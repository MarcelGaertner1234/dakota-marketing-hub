"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Check } from "lucide-react"
import { saveMonth } from "@/lib/actions/cockpit"
import { chf, monatLabel, type Settings } from "@/lib/cockpit/calc"
import type { CockpitMonth } from "@/types/database"

const FIELDS = [
  { key: "betriebstage", label: "Betriebstage", step: 1 },
  { key: "logiernaechte", label: "Logiernächte (Pers.)", step: 1 },
  { key: "hp_einzel_pers", label: "HP Einzel (Pers.)", step: 1 },
  { key: "hp_gruppe_pers", label: "HP Gruppe (Pers.)", step: 1 },
  { key: "gaeste_woche", label: "Gäste / Woche", step: 1 },
  { key: "bon", label: "Bon", step: 0.5 },
  { key: "kapitel_menues", label: "Kapitel-Menüs", step: 1 },
] as const
type Key = (typeof FIELDS)[number]["key"]

function Zeile({ m, s }: { m: CockpitMonth; s: Settings }) {
  const router = useRouter()
  const [vals, setVals] = useState<Record<Key, string>>(() => Object.fromEntries(FIELDS.map((f) => [f.key, String(m[f.key] ?? 0)])) as Record<Key, string>)
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()
  const n = (k: Key) => Number(String(vals[k]).replace(",", ".")) || 0
  const fr = n("logiernaechte") * s.fruehstueck_pp
  const hp = n("hp_einzel_pers") * s.hp_einzel_pp + n("hp_gruppe_pers") * s.hp_gruppe_pp
  const rest = n("gaeste_woche") * n("bon") * n("betriebstage") / 4
  function save() {
    startTransition(async () => {
      const r = await saveMonth(m.monat, Object.fromEntries(FIELDS.map((f) => [f.key, n(f.key)])))
      if (r.success) { setDirty(false); setSaved(true); setTimeout(() => setSaved(false), 2000); router.refresh() }
      else alert(r.error)
    })
  }
  return (
    <TableRow>
      <TableCell className="whitespace-nowrap font-medium">{monatLabel(m.monat)}</TableCell>
      {FIELDS.map((f) => (
        <TableCell key={f.key} className="p-1">
          <input
            type="number" step={f.step} inputMode="decimal" value={vals[f.key]}
            onChange={(e) => { setVals({ ...vals, [f.key]: e.target.value }); setDirty(true) }}
            className="h-8 w-24 rounded-md border border-input bg-[#FFFBEA] px-2 text-right text-sm tabular-nums dark:bg-[#2A241E]"
          />
        </TableCell>
      ))}
      <TableCell className="text-right tabular-nums text-xs text-gray-500">{chf(fr)}</TableCell>
      <TableCell className="text-right tabular-nums text-xs text-gray-500">{chf(hp)}</TableCell>
      <TableCell className="text-right tabular-nums text-xs text-gray-500">{chf(rest)}</TableCell>
      <TableCell>
        <Button size="sm" variant={dirty ? "default" : "ghost"} disabled={!dirty || isPending} onClick={save} className={dirty ? "bg-[#C5A572] hover:bg-[#A08050]" : ""}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4 text-emerald-600" /> : "Speichern"}
        </Button>
      </TableCell>
    </TableRow>
  )
}

export function MonatEingaben({ months, settings }: { months: CockpitMonth[]; settings: Settings }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hotel-Buchungen und Erwartung Tagesgeschäft pro Monat</CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Aus Protel: gebuchte Logiernächte in Personen (× {settings.fruehstueck_pp.toFixed(2)} = Frühstück), Halbpension Einzel (× {settings.hp_einzel_pp.toFixed(2)}) und Gruppe (× {settings.hp_gruppe_pp.toFixed(2)}).
          Tagesgeschäft: Gäste pro Woche × Bon × Betriebstage ÷ 4. Gelbe Felder sind Eingabe, pro Zeile speichern.
        </p>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#2C2C2C] hover:bg-[#2C2C2C]">
              <TableHead className="text-white">Monat</TableHead>
              {FIELDS.map((f) => <TableHead key={f.key} className="whitespace-nowrap text-white">{f.label}</TableHead>)}
              <TableHead className="whitespace-nowrap text-right text-white">= Frühstück</TableHead>
              <TableHead className="whitespace-nowrap text-right text-white">= HP</TableHead>
              <TableHead className="whitespace-nowrap text-right text-white">= Restaurant</TableHead>
              <TableHead className="text-white"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {months.map((m) => <Zeile key={m.monat} m={m} s={settings} />)}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
