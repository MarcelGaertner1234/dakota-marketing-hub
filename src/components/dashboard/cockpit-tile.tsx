import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Gauge } from "lucide-react"
import { AmpelBadge } from "@/components/cockpit/ampel"
import { getAnlaesse, getMonths, getSettings, getWochen } from "@/lib/actions/cockpit"
import { berechneMonat, chf, monatLabel, prozent } from "@/lib/cockpit/calc"
import { addDays } from "@/lib/utils/today"

/** Kleine Cockpit-Kachel fürs Dashboard: laufender Monat (oder erster Planmonat), Ampel, Rapport-Status, nächste Anlässe. */
export async function CockpitTile({ today }: { today: string }) {
  let data: Awaited<ReturnType<typeof load>> | null = null
  try { data = await load(today) } catch { data = null }
  if (!data) return null
  const { c, ges, quote, wochenAlt, naechste, istPlanmonat } = data
  return (
    <Card className="border-l-4 border-l-[#2C2C2C] dark:border-l-[#C5A572]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg"><Gauge className="h-5 w-5 text-[#C5A572]" />Cockpit · {monatLabel(c.monat)}{!istPlanmonat && <span className="text-sm font-normal text-gray-400">(nächster Planmonat)</span>}</CardTitle>
        <Link href="/cockpit"><Button size="sm" variant="outline">Cockpit öffnen</Button></Link>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Gesamtumsatz {c.hatIst ? "Ist" : "Forecast"}</p>
            <p className="text-2xl font-bold tabular-nums">{chf((c.hatIst ? ges?.ist : ges?.forecast) ?? 0)}</p>
            <p className="text-xs text-gray-500">Break-even {chf(ges?.breakEven)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Ampel</p>
            <div className="mt-1 flex flex-wrap gap-1.5"><AmpelBadge ampel={ges?.ampel ?? "neutral"} /><AmpelBadge ampel={quote?.ampel ?? "neutral"} /></div>
            <p className="mt-1 text-xs text-gray-500">Gesamt · Personalquote {prozent((c.hatIst ? quote?.ist : quote?.forecast) ?? null)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Wochenrapporte</p>
            <p className="text-2xl font-bold tabular-nums">{c.wochen.length}</p>
            <p className={`text-xs ${wochenAlt ? "font-semibold text-red-600" : "text-gray-500"}`}>{wochenAlt ? "Rapport fällig" : "erfasst"} · <Link href="/cockpit/wochen" className="underline">Woche erfassen</Link></p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Anlässe 14 Tage</p>
            {naechste.length === 0 ? <p className="text-sm text-gray-400">keine eingetragen</p> : naechste.map((a) => (
              <p key={a.id} className="truncate text-sm"><span className="text-gray-500">{a.datum.slice(8, 10)}.{a.datum.slice(5, 7)}.</span> {a.anlass} <span className="text-xs text-gray-400">{a.personen} P. · {a.status}</span></p>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

async function load(today: string) {
  const monthKey = today.slice(0, 7) + "-01"
  const [settings, months, wochen, anlaesse] = await Promise.all([getSettings(), getMonths("2026-12-01"), getWochen(), getAnlaesse()])
  if (months.length === 0) return null
  const month = months.find((m) => m.monat === monthKey) ?? months.find((m) => m.monat > monthKey) ?? months[0]
  const c = berechneMonat(month, wochen, anlaesse, settings)
  const ges = c.zeilen.find((z) => z.key === "ges")
  const quote = c.zeilen.find((z) => z.key === "quote")
  // Rapport fällig: letzter erfasster Sonntag liegt mehr als 8 Tage zurück und wir sind in der Saison (ab Eröffnung 17.12.2026)
  const letzte = wochen[0]?.bis ?? null
  const wochenAlt = today >= "2026-12-28" && (!letzte || letzte < addDays(today, -8))
  const naechste = anlaesse.filter((a) => a.datum >= today && a.datum <= addDays(today, 14)).slice(0, 3)
  return { c, ges, quote, wochenAlt, naechste, istPlanmonat: month.monat === monthKey }
}
