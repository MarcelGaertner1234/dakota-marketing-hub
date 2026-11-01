"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2 } from "lucide-react"
import { AmpelBadge } from "./ampel"
import { TargetBars } from "./charts"
import { saveSetting } from "@/lib/actions/cockpit"
import { berechneZiel, chf, monatLabel, prozent, summeZiel, zahl, type Settings } from "@/lib/cockpit/calc"
import type { CockpitMonth } from "@/types/database"
import { cn } from "@/lib/utils"

export function ZielTabelle({ months2027, months2026, settings }: { months2027: CockpitMonth[]; months2026: CockpitMonth[]; settings: Settings }) {
  const router = useRouter()
  const [uplift, setUplift] = useState<number>(settings.uplift ?? 1)
  const [isPending, startTransition] = useTransition()
  const zeilen = useMemo(() => berechneZiel(months2027, months2026, settings, uplift), [months2027, months2026, settings, uplift])
  const sum = useMemo(() => summeZiel(zeilen), [zeilen])
  const gespeichert = Math.abs(uplift - (settings.uplift ?? 1)) < 0.001

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Konzept-Uplift</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">1.00 = Niveau 2026. Der Regler zeigt, welche Monate kippen, wenn der Tagesumsatz gegenüber 2026 steigt. KW 41 (GAULI) lag bei Faktor 1.5.</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <input type="range" min={0.8} max={1.8} step={0.01} value={uplift} onChange={(e) => setUplift(Number(e.target.value))} className="w-64 accent-[#C5A572]" aria-label="Konzept-Uplift" />
            <span className="text-2xl font-bold tabular-nums text-[#2C2C2C] dark:text-gray-100">× {uplift.toFixed(2)}</span>
            <span className="text-sm text-gray-500">Jahr: Erwartung {chf(sum.erwartung)} · Break-even {chf(sum.breakEven)} · Basis {chf(sum.basis)} · nötig bis Break-even × {sum.uplift.toFixed(2)}</span>
            <AmpelBadge ampel={sum.ampel} size="lg" />
            <Button size="sm" variant="outline" disabled={gespeichert || isPending} onClick={() => startTransition(async () => { await saveSetting("uplift", uplift); router.refresh() })}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : gespeichert ? "gespeichert" : "als Ziel speichern"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Erwartung 2027 pro Monat gegen Break-even und Basis</CardTitle></CardHeader>
        <CardContent>
          <TargetBars
            title="Erwartung Restaurant + Anlässe"
            points={zeilen.map((z) => ({ label: monatLabel(z.monat, true), value: z.erwartung, sub: `${z.betriebstage} Tage` }))}
            boden={zeilen.map((z) => z.breakEven)}
            basis={zeilen.map((z) => z.basis)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#2C2C2C] hover:bg-[#2C2C2C]">
                {["Monat", "Tage 2027", "Restaurant 2026", "Tage 2026", "Ø / Tag 2026", "Verdichtung", "Erwartung 2027", "Break-even", "Basis", "Ampel", "nötig ×", "Frühstück", "HP", "Gesamt", "Quote"].map((h, i) => (
                  <TableHead key={i} className={cn("whitespace-nowrap text-white", i >= 1 && i !== 9 && "text-right")}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {zeilen.map((z) => (
                <TableRow key={z.monat} className={cn(z.geschaetzt && "text-gray-500")} title={z.quelle ?? z.proTagHerkunft}>
                  <TableCell className="whitespace-nowrap font-medium text-[#2C2C2C] dark:text-gray-100">{monatLabel(z.monat)}{z.geschaetzt && <span className="ml-1 text-xs font-normal text-gray-400" title="Referenz geschätzt">~</span>}</TableCell>
                  <TableCell className="text-right tabular-nums">{z.betriebstage}</TableCell>
                  <TableCell className="text-right tabular-nums">{chf(z.refRestaurant)}</TableCell>
                  <TableCell className="text-right tabular-nums">{z.refTage ?? "–"}</TableCell>
                  <TableCell className="text-right tabular-nums">{chf(z.proTag)}</TableCell>
                  <TableCell className="text-right tabular-nums">{z.verdichtung.toFixed(2)}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold text-[#2C2C2C] dark:text-gray-100">{chf(z.erwartung)}</TableCell>
                  <TableCell className="text-right tabular-nums">{chf(z.breakEven)}</TableCell>
                  <TableCell className="text-right tabular-nums">{chf(z.basis)}</TableCell>
                  <TableCell><AmpelBadge ampel={z.ampel} /></TableCell>
                  <TableCell className="text-right tabular-nums">{z.uplift ? zahl(z.uplift, 2) : "–"}</TableCell>
                  <TableCell className="text-right tabular-nums">{chf(z.fruehstueck)}</TableCell>
                  <TableCell className="text-right tabular-nums">{chf(z.hp)}</TableCell>
                  <TableCell className="text-right tabular-nums">{chf(z.gesamt)}</TableCell>
                  <TableCell className="text-right tabular-nums">{prozent(z.quote)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-[#F8F6F3] font-semibold dark:bg-[#1E1915]">
                <TableCell>Jahr 2027</TableCell>
                <TableCell className="text-right tabular-nums">{sum.betriebstage}</TableCell>
                <TableCell className="text-right tabular-nums">{chf(months2026.reduce((a, m) => a + Number(m.ist_restaurant ?? 0), 0))}</TableCell>
                <TableCell /><TableCell /><TableCell />
                <TableCell className="text-right tabular-nums">{chf(sum.erwartung)}</TableCell>
                <TableCell className="text-right tabular-nums">{chf(sum.breakEven)}</TableCell>
                <TableCell className="text-right tabular-nums">{chf(sum.basis)}</TableCell>
                <TableCell><AmpelBadge ampel={sum.ampel} /></TableCell>
                <TableCell className="text-right tabular-nums">{zahl(sum.uplift, 2)}</TableCell>
                <TableCell className="text-right tabular-nums">{chf(sum.fruehstueck)}</TableCell>
                <TableCell className="text-right tabular-nums">{chf(sum.hp)}</TableCell>
                <TableCell className="text-right tabular-nums">{chf(sum.gesamt)}</TableCell>
                <TableCell className="text-right tabular-nums">{prozent(sum.quote)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <p className="p-3 text-xs text-gray-500 dark:text-gray-400">
            Referenz 2026 = Küche + Getränke ohne Trinkgeld, Summen gleich Protel 01.01.–01.11.2026. Zeilen mit ~ sind geschätzt (Protel-Rest verteilt), bis die Monatsexporte da sind. Verdichtung: Juli 1’830 pro Tag mit 6–7 Tagen, August 2’295 mit 4 Tagen = Faktor 1.25. Break-even und Basis = Restaurant + Anlässe (35’100 bzw. 42’600 je 17 Betriebstage), weil die Referenz die Anlässe enthält. Lohnkosten laufen in den Ferienmonaten weiter, dort ist eine hohe Quote eingeplant.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
