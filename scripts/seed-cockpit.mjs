// Seed für das AIRL Monats-Cockpit: Monate 2026-01 … 2027-12 (Betriebstage, Referenz 2026),
// Wochen KW 40–42/2026 aus den Rapporten. Idempotent (upsert). Voraussetzung: Migration 008 ausgeführt.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envFile = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8')
const env = Object.fromEntries(envFile.split('\n').filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] }))
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } })

function betriebstage(y, m, closed) {
  let n = 0; const d = new Date(Date.UTC(y, m - 1, 1))
  while (d.getUTCMonth() === m - 1) {
    const wd = d.getUTCDay(); const iso = d.toISOString().slice(0, 10)
    if ([4, 5, 6, 0].includes(wd) && !closed.some(([a, b]) => iso >= a && iso <= b)) n++
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return n
}
const CLOSED_2027 = [['2027-04-12', '2027-05-05'], ['2027-11-01', '2027-11-16']]

// Referenz 2026: Restaurant = Küche + Getränke ohne Trinkgeld, Summen = Protel 01.01.–01.11.2026 (269'786 / 216'674 / 23'812)
const REF2026 = {
  1: [17000, 26, 13000, 2500, true, 'Schätzung: Protel-Rest Jan–Apr verteilt (Ski-Saison)'],
  2: [21000, 24, 16000, 3500, true, 'Schätzung: Protel-Rest verteilt (Sportferien)'],
  3: [15000, 26, 10000, 2500, true, 'Schätzung: Protel-Rest verteilt'],
  4: [8566, 26, 7447, 2350, true, 'Schätzung: Restgrösse, damit Protel-Summen stimmen'],
  5: [26000, 22, 15000, 1000, false, 'Rapporte KW 19–22 + Rand, Mi–So offen; Frühstück/HP geschätzt'],
  6: [32250, 26, 24684, 1630, false, 'Rapport Juni (Food 20 725 + Bev 11 526)'],
  7: [49400, 27, 38746, 3515, false, 'Rapport Juli 51 193 inkl. Trinkgeld (~1 800 geschätzt)'],
  8: [41305, 18, 35445, 5717, false, 'Rapport August (Food 26 712 + Bev 14 593), erster Do–So-Monat'],
  9: [23765, 13, 34352, 900, false, 'Rapport September, KW 39 krankheitshalber zu'],
  10: [35500, 18, 22000, 200, false, 'KW 40–42 aus Rapporten, KW 43 + 29.–31.10. geschätzt, GAULI'],
  11: [null, null, null, null, true, 'Winterpause ab 02.11.2026'],
  12: [null, null, null, null, true, 'Eröffnung Winterkonzept 17.12.2026'],
}
const VERD = { 1: 1.25, 2: 1.25, 3: 1.25, 4: 1.25, 5: 1.15, 6: 1.25, 7: 1.25, 8: 1, 9: 1, 10: 1, 11: 1, 12: 1 }
const FR_EST_2027 = { 11: 7500, 12: 10000 } // Frühstück-Erwartung Nov/Dez ohne Referenz

const months = []
for (let m = 1; m <= 12; m++) {
  const [rest, tage, fr, hp, est, quelle] = REF2026[m]
  months.push({ monat: `2026-${String(m).padStart(2, '0')}-01`, betriebstage: m === 12 ? 9 : betriebstage(2026, m, []), offene_tage: tage, verdichtung: 1, ist_restaurant: rest, ist_fruehstueck: fr, ist_hp: hp, geschaetzt: est, quelle })
}
for (let m = 1; m <= 12; m++) {
  months.push({ monat: `2027-${String(m).padStart(2, '0')}-01`, betriebstage: betriebstage(2027, m, CLOSED_2027), offene_tage: null, verdichtung: VERD[m], ist_restaurant: null, ist_fruehstueck: FR_EST_2027[m] ?? null, ist_hp: null, geschaetzt: false, quelle: m >= 11 ? 'Frühstück geschätzt (keine Referenz 2026)' : null })
}
const { error: e1 } = await sb.from('cockpit_months').upsert(months, { onConflict: 'monat', ignoreDuplicates: false })
if (e1) { console.error('months:', e1.message); process.exit(1) }
console.log('months upserted:', months.length)

const wochen = [
  { kw: 40, von: '2026-09-28', bis: '2026-10-04', restaurant_netto: 6327.10, food: 4742.50, beverage: 1434.60, trinkgeld: 270.80, fruehstueck: 8029, halbpension: 0, personen: 211, kapitel_menues: 0, anlaesse_anzahl: 0, anlass_umsatz: 0, ausfalltage: 0, bemerkung: 'letzte Woche ohne Kapitel', erfasst_von: 'Rapport' },
  { kw: 41, von: '2026-10-05', bis: '2026-10-11', restaurant_netto: 11677.60, food: 6904.50, beverage: 3993.10, trinkgeld: 412.20, fruehstueck: 4955, halbpension: 45, personen: 278, kapitel_menues: 0, anlaesse_anzahl: 0, anlass_umsatz: 0, ausfalltage: 0, bemerkung: 'erste GAULI-Woche, Bon 39.20 netto', erfasst_von: 'Rapport' },
  { kw: 42, von: '2026-10-12', bis: '2026-10-18', restaurant_netto: 6951.20, food: 5351.50, beverage: 1599.70, trinkgeld: 608.50, fruehstueck: 4263, halbpension: 0, personen: 207, kapitel_menues: 0, anlaesse_anzahl: 0, anlass_umsatz: 0, ausfalltage: 0, bemerkung: 'zweite GAULI-Woche, Rapport aus Mail 21.10.', erfasst_von: 'Rapport' },
]
const { error: e2 } = await sb.from('cockpit_wochen').upsert(wochen, { onConflict: 'bis' })
if (e2) { console.error('wochen:', e2.message); process.exit(1) }
console.log('wochen upserted:', wochen.length)
console.log('Seed fertig.')
