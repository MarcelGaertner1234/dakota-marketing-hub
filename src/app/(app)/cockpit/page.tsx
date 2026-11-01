export const dynamic = "force-dynamic"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AmpelBadge } from "@/components/cockpit/ampel"
import { MonatTabelle } from "@/components/cockpit/monat-tabelle"
import { StackedBars, TargetBars } from "@/components/cockpit/charts"
import { getAnlaesse, getMonths, getSettings, getWochen } from "@/lib/actions/cockpit"
import { berechneMonat, berechneZiel, chf, monatLabel, prozent, summeZiel } from "@/lib/cockpit/calc"

export default async function CockpitPage() {
  const [settings, months, wochen, anlaesse] = await Promise.all([getSettings(), getMonths(), getWochen(), getAnlaesse()])
  const heute = new Date()
  const aktuellKey = `${heute.getFullYear()}-${String(heute.getMonth() + 1).padStart(2, "0")}-01`
  const plan = months.filter((m) => m.monat >= "2026-12-01")
  const cockpits = plan.map((m) => berechneMonat(m, wochen, anlaesse, settings))
  const aktuell = cockpits.find((c) => c.monat === aktuellKey) ?? cockpits[0]
  const fokus = cockpits.filter((c) => c.monat >= "2026-12-01" && c.monat <= "2027-02-01")
  const ziel = berechneZiel(months.filter((m) => m.monat.startsWith("2027")), months.filter((m) => m.monat.startsWith("2026")), settings)
  const zielSum = summeZiel(ziel)

  const ges = aktuell?.zeilen.find((z) => z.key === "ges")
  const quote = aktuell?.zeilen.find((z) => z.key === "quote")
  const rest = aktuell?.zeilen.find((z) => z.key === "rest")
  const anl = aktuell?.zeilen.find((z) => z.key === "anl")

  const beWoche = ((settings.be_restaurant + settings.be_anlaesse) / 17) * 4
  const plWoche = ((settings.pl_restaurant + settings.be_anlaesse) / 17) * 4
  const wochenChrono = wochen.slice().sort((a, b) => a.bis.localeCompare(b.bis)).slice(-16)

  if (months.length === 0) {
    return (
      <Card><CardContent className="py-10 text-center text-gray-500">
        Noch keine Daten. Migration <code>008_cockpit.sql</code> ausführen und <code>node scripts/seed-cockpit.mjs</code> starten.
      </CardContent></Card>
    )
  }

  return (
    <div className="space-y-6">
      {aktuell && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tile label={`${monatLabel(aktuell.monat)} · Gesamtumsatz`} value={chf(ges?.ist ?? ges?.forecast ?? 0)} sub={aktuell.hatIst ? `Ist · Forecast ${chf(ges?.forecast)}` : `Forecast · Break-even ${chf(ges?.breakEven)}`} ampel={ges?.ampel} />
          <Tile label="Restaurant à la carte" value={chf(rest?.ist ?? rest?.forecast ?? 0)} sub={`Break-even ${chf(rest?.breakEven)} · Basis ${chf(rest?.basis)}`} ampel={rest?.ampel} />
          <Tile label="Anlässe" value={chf(anl?.ist ?? anl?.forecast ?? 0)} sub={`${aktuell.anlaesseFix.length} fix · ${aktuell.anlaesseOption.length} Option`} ampel={anl?.ampel} />
          <Tile label="Personalquote" value={prozent(quote?.ist ?? quote?.forecast ?? null)} sub={`Lohn ${chf(settings.lohnkosten)} · grün ≤ 45 %`} ampel={quote?.ampel} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div><CardTitle>Wochen · Restaurant netto</CardTitle><p className="text-sm text-gray-500">Letzte Wochen aus den Rapporten, Marken = Break-even und Basis pro Woche</p></div>
            <Link href="/cockpit/wochen"><Button size="sm" variant="outline">Woche erfassen</Button></Link>
          </CardHeader>
          <CardContent>
            {wochenChrono.length ? (
              <TargetBars
                title="Restaurant netto pro Woche"
                points={wochenChrono.map((w) => ({ label: `KW ${w.kw}`, value: Number(w.restaurant_netto), sub: w.bis.slice(5, 7) + "/" + w.bis.slice(2, 4) }))}
                boden={wochenChrono.map(() => beWoche)}
                basis={wochenChrono.map(() => plWoche)}
              />
            ) : <p className="py-10 text-center text-sm text-gray-500">Noch keine Woche erfasst.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div><CardTitle>Monate · Forecast und Ist</CardTitle><p className="text-sm text-gray-500">Restaurant, Anlässe, Frühstück, Halbpension; Marke = Break-even gesamt</p></div>
            <Link href="/cockpit/forecast"><Button size="sm" variant="outline">Forecast pflegen</Button></Link>
          </CardHeader>
          <CardContent>
            <StackedBars
              title="Gesamtumsatz pro Monat"
              names={["Restaurant", "Anlässe", "Frühstück", "Halbpension"]}
              points={cockpits.slice(0, 7).map((c) => {
                const g = (k: string) => { const z = c.zeilen.find((x) => x.key === k)!; return Number((c.hatIst ? z.ist : z.forecast) ?? 0) }
                return { label: monatLabel(c.monat, true), sub: c.hatIst ? "Ist" : "Forecast", parts: [g("rest"), g("anl"), g("fr"), g("hp")] }
              })}
              target={cockpits.slice(0, 7).map((c) => c.zeilen.find((x) => x.key === "ges")!.breakEven ?? 0)}
            />
          </CardContent>
        </Card>
      </div>

      {fokus.map((c) => (
        <Card key={c.monat}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-[#C5A572]">{monatLabel(c.monat)}</CardTitle>
            <AmpelBadge ampel={c.zeilen.find((z) => z.key === "ges")!.ampel} size="lg" />
          </CardHeader>
          <CardContent><MonatTabelle m={c} /></CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div><CardTitle>Ziel 2027 · Erwartung gegen Break-even</CardTitle><p className="text-sm text-gray-500">2026 als Referenz, Uplift × {(settings.uplift ?? 1).toFixed(2)} · Jahr: Erwartung {chf(zielSum.erwartung)} · Break-even {chf(zielSum.breakEven)} · Basis {chf(zielSum.basis)}</p></div>
          <Link href="/cockpit/ziel"><Button size="sm" variant="outline">Ziel 2027 öffnen</Button></Link>
        </CardHeader>
        <CardContent>
          <TargetBars title="Erwartung Restaurant + Anlässe" points={ziel.map((z) => ({ label: monatLabel(z.monat, true), value: z.erwartung, sub: `${z.betriebstage} Tage` }))} boden={ziel.map((z) => z.breakEven)} basis={ziel.map((z) => z.basis)} height={200} />
        </CardContent>
      </Card>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Regeln (Gespräch 1.11.2026): Zahlen bis zum 3. des Folgemonats, Besprechung am ersten Donnerstag. Eine rote Ampel ist eine Massnahme mit Datum. Zwei rote Monate in Folge bringen das Konzept auf den Tisch. Notbremse: unter 210 Gäste pro Woche zwei Wochen in Folge.
      </p>
    </div>
  )
}

function Tile({ label, value, sub, ampel }: { label: string; value: string; sub: string; ampel?: import("@/lib/cockpit/calc").Ampel }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
          {ampel && <AmpelBadge ampel={ampel} />}
        </div>
        <p className="mt-2 text-3xl font-bold tabular-nums text-[#2C2C2C] dark:text-gray-100">{value}</p>
        <p className="mt-1 text-xs text-gray-500">{sub}</p>
      </CardContent>
    </Card>
  )
}
