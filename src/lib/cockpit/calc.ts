// Rechenlogik des AIRL Monats-Cockpits. Identisch mit der Excel-Datei
// AIRL_COCKPIT_WINTER_2026_27.xlsx (Blätter Cockpit und Ziel 2027).
// Reine Funktionen, laufen auf Server und Client.

import type { CockpitAnlass, CockpitMonth, CockpitWoche } from "@/types/database"

export type Settings = Record<string, number>
export type Ampel = "gruen" | "gelb" | "rot" | "neutral"

export const DEFAULT_SETTINGS: Settings = {
  be_restaurant: 26400, pl_restaurant: 33900, be_anlaesse: 8700,
  be_fruehstueck: 12000, pl_fruehstueck: 12000, lohnkosten: 30000,
  fruehstueck_pp: 19.7, hp_einzel_pp: 36.8, hp_gruppe_pp: 23.1,
  gaeste_boden: 210, gaeste_basis: 230, bon_boden: 29, bon_basis: 34,
  kapitel_boden: 0.3, kapitel_basis: 0.35, uplift: 1,
}

export const MONATSNAMEN = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"]

/** "2027-01-01" → "Januar 2027" */
export function monatLabel(monat: string, kurz = false): string {
  const [y, m] = monat.split("-").map(Number)
  const name = MONATSNAMEN[m - 1]
  return kurz ? `${name.slice(0, 3)} ${String(y).slice(2)}` : `${name} ${y}`
}

/** Datum → "YYYY-MM-01" */
export function monatKey(date: string): string {
  return date.slice(0, 7) + "-01"
}

export function monthsBetween(from: string, to: string): string[] {
  const out: string[] = []
  let [y, m] = from.split("-").map(Number)
  const [ty, tm] = to.split("-").map(Number)
  while (y < ty || (y === ty && m <= tm)) {
    out.push(`${y}-${String(m).padStart(2, "0")}-01`)
    m += 1
    if (m > 12) { m = 1; y += 1 }
  }
  return out
}

export function ampel(value: number, boden: number, basis: number): Ampel {
  if (value < boden) return "rot"
  if (value < basis) return "gelb"
  return "gruen"
}

export function ampelLabel(a: Ampel): string {
  return a === "gruen" ? "grün" : a === "gelb" ? "gelb" : a === "rot" ? "rot" : "–"
}

export interface Kennzahl {
  key: string
  label: string
  quelle: string
  einheit: "chf" | "zahl" | "prozent" | "bon"
  breakEven: number | null
  basis: number | null
  forecast: number | null
  ist: number | null
  ampel: Ampel
  regel: string
}

export interface MonatsCockpit {
  monat: string
  betriebstage: number
  wochen: CockpitWoche[]
  anlaesseFix: CockpitAnlass[]
  anlaesseOption: CockpitAnlass[]
  zeilen: Kennzahl[]
  hatIst: boolean
}

/** Ein Monat wie im Excel-Blatt «Cockpit». */
export function berechneMonat(
  month: CockpitMonth,
  wochen: CockpitWoche[],
  anlaesse: CockpitAnlass[],
  s: Settings,
): MonatsCockpit {
  const bt = month.betriebstage
  const w = wochen.filter((x) => monatKey(x.bis) === month.monat)
  const aFix = anlaesse.filter((a) => monatKey(a.datum) === month.monat && a.status === "fix")
  const aOpt = anlaesse.filter((a) => monatKey(a.datum) === month.monat && a.status === "option")
  const sum = (f: (x: CockpitWoche) => number) => w.reduce((acc, x) => acc + (f(x) || 0), 0)
  const hatIst = w.length > 0

  const istRestNetto = sum((x) => Number(x.restaurant_netto))
  const istAnl = sum((x) => Number(x.anlass_umsatz))
  const istRest = istRestNetto - istAnl
  const istFr = sum((x) => Number(x.fruehstueck))
  const istHp = sum((x) => Number(x.halbpension))
  const istPers = sum((x) => x.personen)
  const istKap = sum((x) => x.kapitel_menues)
  const istAusfall = sum((x) => x.ausfalltage)
  const wochenAnteil = bt / 4

  const fcRest = Number(month.gaeste_woche) * Number(month.bon) * wochenAnteil
  const fcAnl = aFix.reduce((acc, a) => acc + a.personen * Number(a.preis), 0)
  const fcFr = month.logiernaechte * s.fruehstueck_pp
  const fcHp = month.hp_einzel_pers * s.hp_einzel_pp + month.hp_gruppe_pers * s.hp_gruppe_pp
  const lohn = s.lohnkosten

  const beRest = (s.be_restaurant / 17) * bt
  const plRest = (s.pl_restaurant / 17) * bt
  const beAnl = (s.be_anlaesse / 17) * bt

  const beGes = beRest + beAnl + s.be_fruehstueck
  const plGes = plRest + beAnl + s.pl_fruehstueck
  const fcGes = fcRest + fcAnl + fcFr + fcHp
  const istGes = istRest + istAnl + istFr + istHp

  const v = (ist: number, fc: number) => (hatIst && ist !== 0 ? ist : fc)

  const zeilen: Kennzahl[] = [
    { key: "rest", label: "Umsatz Restaurant à la carte", quelle: "Kasse", einheit: "chf", breakEven: beRest, basis: plRest, forecast: fcRest, ist: hatIst ? istRest : null, ampel: ampel(v(istRest, fcRest), beRest, plRest), regel: "rot: unter Break-even" },
    { key: "anl", label: "Umsatz Anlässe (ab 10 Pers.)", quelle: "Reservationsbuch", einheit: "chf", breakEven: beAnl, basis: beAnl, forecast: fcAnl, ist: hatIst ? istAnl : null, ampel: ampel(v(istAnl, fcAnl), beAnl, beAnl), regel: "gelb: weniger als 3 Anlässe" },
    { key: "fr", label: "Umsatz Frühstück", quelle: "Protel", einheit: "chf", breakEven: s.be_fruehstueck, basis: s.pl_fruehstueck, forecast: fcFr, ist: hatIst ? istFr : null, ampel: ampel(v(istFr, fcFr), s.be_fruehstueck, s.pl_fruehstueck), regel: "gelb: unter 10'000" },
    { key: "hp", label: "Umsatz Halbpension", quelle: "Protel", einheit: "chf", breakEven: 0, basis: 0, forecast: fcHp, ist: hatIst ? istHp : null, ampel: "neutral", regel: "nur Buchungen, nie schätzen" },
    { key: "ges", label: "Gesamtumsatz", quelle: "", einheit: "chf", breakEven: beGes, basis: plGes, forecast: fcGes, ist: hatIst ? istGes : null, ampel: ampel(v(istGes, fcGes), beGes, plGes), regel: "gesund ab 70'000" },
    { key: "gaeste", label: "Gäste pro Woche", quelle: "Kasse", einheit: "zahl", breakEven: s.gaeste_boden, basis: s.gaeste_basis, forecast: Number(month.gaeste_woche), ist: hatIst ? istPers / w.length : null, ampel: ampel(v(hatIst ? istPers / w.length : 0, Number(month.gaeste_woche)), s.gaeste_boden, s.gaeste_basis), regel: "rot: unter 210 zwei Wochen" },
    { key: "bon", label: "Bon pro Gast", quelle: "Kasse", einheit: "bon", breakEven: s.bon_boden, basis: s.bon_basis, forecast: Number(month.bon), ist: hatIst && istPers > 0 ? istRest / istPers : null, ampel: ampel(v(istPers > 0 ? istRest / istPers : 0, Number(month.bon)), s.bon_boden, s.bon_basis), regel: "gelb: unter 32" },
    { key: "kap", label: "Kapitel-Anteil", quelle: "Kasse", einheit: "prozent", breakEven: s.kapitel_boden, basis: s.kapitel_basis, forecast: wochenAnteil > 0 && month.gaeste_woche > 0 ? month.kapitel_menues / (month.gaeste_woche * wochenAnteil) : 0, ist: hatIst && istPers > 0 ? istKap / istPers : null, ampel: ampel(v(istPers > 0 ? istKap / istPers : 0, wochenAnteil > 0 && month.gaeste_woche > 0 ? month.kapitel_menues / (month.gaeste_woche * wochenAnteil) : 0), s.kapitel_boden, s.kapitel_basis), regel: "gelb: unter 25 %" },
    { key: "lohn", label: "Lohnkosten", quelle: "Lohnlauf", einheit: "chf", breakEven: lohn, basis: lohn, forecast: lohn, ist: lohn, ampel: lohn > 32000 ? "gelb" : "gruen", regel: "gelb: über 32'000" },
    { key: "quote", label: "Personalquote", quelle: "Rechnung", einheit: "prozent", breakEven: beGes > 0 ? lohn / beGes : null, basis: plGes > 0 ? lohn / plGes : null, forecast: fcGes > 0 ? lohn / fcGes : null, ist: hatIst && istGes > 0 ? lohn / istGes : null, ampel: (() => { const q = v(istGes, fcGes) > 0 ? lohn / v(istGes, fcGes) : 1; return q <= 0.45 ? "gruen" : q >= 0.65 ? "rot" : "gelb" })(), regel: "grün ≤ 45 % · rot ≥ 65 %" },
    { key: "ausfall", label: "Ausfalltage", quelle: "Dienstplan", einheit: "zahl", breakEven: 0, basis: 0, forecast: 0, ist: hatIst ? istAusfall : null, ampel: istAusfall > 0 ? "rot" : "gruen", regel: "rot: jeder Tag ≈ 2'100" },
  ]

  return { monat: month.monat, betriebstage: bt, wochen: w, anlaesseFix: aFix, anlaesseOption: aOpt, zeilen, hatIst }
}

// ---------- Ziel 2027 ----------

export interface ZielZeile {
  monat: string
  betriebstage: number
  refRestaurant: number | null
  refTage: number | null
  proTag: number
  proTagHerkunft: string
  verdichtung: number
  erwartung: number
  breakEven: number
  basis: number
  ampel: Ampel
  uplift: number // nötiger Uplift bis Break-even
  fruehstueck: number
  hp: number
  gesamt: number
  lohn: number
  quote: number
  geschaetzt: boolean
  quelle: string | null
}

/** Ziel 2027 mit 2026 als Referenz, wie Excel-Blatt «Ziel 2027». */
export function berechneZiel(
  months2027: CockpitMonth[],
  months2026: CockpitMonth[],
  s: Settings,
  upliftOverride?: number,
): ZielZeile[] {
  const up = upliftOverride ?? s.uplift ?? 1
  const ref = new Map(months2026.map((m) => [m.monat.slice(5, 7), m]))
  const proTagOf = (m: CockpitMonth | undefined) =>
    m && m.ist_restaurant != null && m.offene_tage ? Number(m.ist_restaurant) / m.offene_tage : null

  const sep = proTagOf(ref.get("09"))
  const augOkt = ["08", "09", "10"].map((k) => proTagOf(ref.get(k))).filter((x): x is number => x != null)
  const augOktAvg = augOkt.length ? augOkt.reduce((a, b) => a + b, 0) / augOkt.length : 0

  const beTag = (s.be_restaurant + s.be_anlaesse) / 17
  const plTag = (s.pl_restaurant + s.be_anlaesse) / 17

  return months2027
    .slice()
    .sort((a, b) => a.monat.localeCompare(b.monat))
    .map((m) => {
      const mm = m.monat.slice(5, 7)
      const r = ref.get(mm)
      let proTag = proTagOf(r)
      let herkunft = r?.quelle ?? "Referenz 2026"
      if (proTag == null) {
        if (mm === "11") { proTag = sep ?? 0; herkunft = "keine Referenz: Ø/Tag wie September 2026" }
        else { proTag = augOktAvg; herkunft = "keine Referenz: Ø/Tag wie August–Oktober 2026" }
      }
      const bt = m.betriebstage
      const erwBasis = proTag * Number(m.verdichtung) * bt
      const erwartung = Math.round((erwBasis * up) / 100) * 100
      const breakEven = Math.round((beTag * bt) / 100) * 100
      const basis = Math.round((plTag * bt) / 100) * 100
      const fr = Number(m.ist_fruehstueck ?? r?.ist_fruehstueck ?? 0)
      const hp = Number(m.ist_hp ?? r?.ist_hp ?? 0)
      const gesamt = erwartung + fr + hp
      return {
        monat: m.monat, betriebstage: bt,
        refRestaurant: r?.ist_restaurant != null ? Number(r.ist_restaurant) : null,
        refTage: r?.offene_tage ?? null,
        proTag: Math.round(proTag), proTagHerkunft: herkunft,
        verdichtung: Number(m.verdichtung), erwartung, breakEven, basis,
        ampel: ampel(erwartung, breakEven, basis),
        uplift: erwBasis > 0 ? breakEven / erwBasis : 0,
        fruehstueck: fr, hp, gesamt, lohn: s.lohnkosten,
        quote: gesamt > 0 ? s.lohnkosten / gesamt : 0,
        geschaetzt: r?.geschaetzt ?? true, quelle: r?.quelle ?? null,
      }
    })
}

export function summeZiel(z: ZielZeile[]) {
  const sum = (f: (x: ZielZeile) => number) => z.reduce((a, x) => a + f(x), 0)
  const erwartung = sum((x) => x.erwartung), breakEven = sum((x) => x.breakEven), basis = sum((x) => x.basis)
  const fr = sum((x) => x.fruehstueck), hp = sum((x) => x.hp), lohn = sum((x) => x.lohn)
  const gesamt = erwartung + fr + hp
  const erwOhneUplift = sum((x) => (x.uplift > 0 ? x.breakEven / x.uplift : 0))
  return { betriebstage: sum((x) => x.betriebstage), erwartung, breakEven, basis, fruehstueck: fr, hp, gesamt, lohn, quote: gesamt > 0 ? lohn / gesamt : 0, ampel: ampel(erwartung, breakEven, basis), uplift: erwOhneUplift > 0 ? breakEven / erwOhneUplift : 0 }
}

// ---------- Format ----------

const nf = new Intl.NumberFormat("de-CH", { maximumFractionDigits: 0 })
export function chf(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return "–"
  if (v === 0) return "–"
  return nf.format(Math.round(v))
}
export function zahl(v: number | null | undefined, dec = 0): string {
  if (v == null || Number.isNaN(v)) return "–"
  return new Intl.NumberFormat("de-CH", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(v)
}
export function prozent(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return "–"
  return `${Math.round(v * 100)} %`
}
export function fmt(v: number | null | undefined, einheit: Kennzahl["einheit"]): string {
  if (einheit === "chf") return chf(v)
  if (einheit === "prozent") return prozent(v)
  if (einheit === "bon") return v == null ? "–" : zahl(v, 2)
  return v == null ? "–" : zahl(Math.round(v))
}

/** ISO-Kalenderwoche eines Datums (YYYY-MM-DD) */
export function isoWeek(date: string): number {
  const d = new Date(date + "T00:00:00Z")
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

/** Betriebstage Do–So eines Monats abzüglich Schliessungen [von, bis] */
export function betriebstage(monat: string, closed: Array<[string, string]> = []): number {
  const [y, m] = monat.split("-").map(Number)
  let n = 0
  const d = new Date(Date.UTC(y, m - 1, 1))
  while (d.getUTCMonth() === m - 1) {
    const wd = d.getUTCDay() // 0 So … 6 Sa
    const iso = d.toISOString().slice(0, 10)
    const zu = closed.some(([a, b]) => iso >= a && iso <= b)
    if ((wd === 4 || wd === 5 || wd === 6 || wd === 0) && !zu) n += 1
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return n
}
