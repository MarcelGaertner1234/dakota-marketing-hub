"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Check } from "lucide-react"
import { saveMonth, saveSetting } from "@/lib/actions/cockpit"
import { monatLabel } from "@/lib/cockpit/calc"
import type { CockpitMonth, CockpitSetting } from "@/types/database"

const REF_FIELDS = [
  { key: "ist_restaurant", label: "Restaurant CHF" },
  { key: "offene_tage", label: "offene Tage" },
  { key: "ist_fruehstueck", label: "Frühstück CHF" },
  { key: "ist_hp", label: "HP CHF" },
] as const
type RK = (typeof REF_FIELDS)[number]["key"]

function RefZeile({ m, verd }: { m: CockpitMonth; verd: CockpitMonth | undefined }) {
  const router = useRouter()
  const [vals, setVals] = useState<Record<string, string>>(() => ({
    ...Object.fromEntries(REF_FIELDS.map((f) => [f.key, m[f.key] == null ? "" : String(m[f.key])])),
    verdichtung: String(verd?.verdichtung ?? 1),
    quelle: m.quelle ?? "",
  }))
  const [geschaetzt, setGeschaetzt] = useState(m.geschaetzt)
  const [dirty, setDirty] = useState(false); const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()
  const upd = (k: string, v: string) => { setVals({ ...vals, [k]: v }); setDirty(true) }
  function save() {
    startTransition(async () => {
      const num = (k: RK) => (vals[k] === "" ? null : Number(String(vals[k]).replace(",", ".")))
      const r = await saveMonth(m.monat, { ist_restaurant: num("ist_restaurant"), offene_tage: num("offene_tage"), ist_fruehstueck: num("ist_fruehstueck"), ist_hp: num("ist_hp"), quelle: vals.quelle || null, geschaetzt })
      if (!r.success) { alert(r.error); return }
      if (verd) {
        const r2 = await saveMonth(verd.monat, { verdichtung: Number(String(vals.verdichtung).replace(",", ".")) || 1 })
        if (!r2.success) { alert(r2.error); return }
      }
      setDirty(false); setSaved(true); setTimeout(() => setSaved(false), 2000); router.refresh()
    })
  }
  const inp = "h-8 rounded-md border border-input bg-[#FFFBEA] px-2 text-right text-sm tabular-nums dark:bg-[#2A241E]"
  return (
    <TableRow>
      <TableCell className="whitespace-nowrap font-medium">{monatLabel(m.monat)}</TableCell>
      {REF_FIELDS.map((f) => <TableCell key={f.key} className="p-1"><input type="number" step="1" inputMode="decimal" value={vals[f.key]} onChange={(e) => upd(f.key, e.target.value)} className={`${inp} w-28`} /></TableCell>)}
      <TableCell className="p-1"><input type="number" step="0.05" inputMode="decimal" value={vals.verdichtung} onChange={(e) => upd("verdichtung", e.target.value)} className={`${inp} w-20`} title="Verdichtung auf Do–So, gilt für denselben Monat 2027" /></TableCell>
      <TableCell className="p-1 text-center"><input type="checkbox" checked={geschaetzt} onChange={(e) => { setGeschaetzt(e.target.checked); setDirty(true) }} aria-label="geschätzt" /></TableCell>
      <TableCell className="p-1"><input type="text" value={vals.quelle} onChange={(e) => upd("quelle", e.target.value)} className="h-8 w-72 rounded-md border border-input bg-transparent px-2 text-xs" placeholder="Quelle / Hinweis" /></TableCell>
      <TableCell>
        <Button size="sm" variant={dirty ? "default" : "ghost"} disabled={!dirty || isPending} onClick={save} className={dirty ? "bg-[#C5A572] hover:bg-[#A08050]" : ""}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4 text-emerald-600" /> : "Speichern"}
        </Button>
      </TableCell>
    </TableRow>
  )
}

export function ReferenzForm({ months2026, months2027 }: { months2026: CockpitMonth[]; months2027: CockpitMonth[] }) {
  const byMonth = new Map(months2027.map((m) => [m.monat.slice(5, 7), m]))
  return (
    <Card>
      <CardHeader>
        <CardTitle>Referenz 2026 (Monatswerte)</CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">Restaurant = Küche + Getränke ohne Trinkgeld. Sobald Alexandra den Protel-Umsatzbericht pro Monat liefert, hier die Schätzungen ersetzen und den Haken «geschätzt» entfernen.</p>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#2C2C2C] hover:bg-[#2C2C2C]">
              {["Monat 2026", "Restaurant CHF", "offene Tage", "Frühstück CHF", "HP CHF", "Verdichtung", "geschätzt", "Quelle", ""].map((h, i) => <TableHead key={i} className="whitespace-nowrap text-white">{h}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>{months2026.map((m) => <RefZeile key={m.monat} m={m} verd={byMonth.get(m.monat.slice(5, 7))} />)}</TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function KennzahlenForm({ rows }: { rows: CockpitSetting[] }) {
  const router = useRouter()
  const [vals, setVals] = useState<Record<string, string>>(() => Object.fromEntries(rows.map((r) => [r.key, String(r.value)])))
  const [isPending, startTransition] = useTransition()
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set())
  function saveAll() {
    startTransition(async () => {
      for (const k of dirtyKeys) {
        const r = await saveSetting(k, Number(String(vals[k]).replace(",", ".")))
        if (!r.success) { alert(r.error); return }
      }
      setDirtyKeys(new Set()); router.refresh()
    })
  }
  const show = rows.filter((r) => r.key !== "uplift")
  return (
    <Card>
      <CardHeader>
        <CardTitle>Kennzahlen und Schwellen</CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">Gespräch 1.11.2026 und Protel-Export. Änderungen wirken sofort auf alle Monate.</p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {show.map((r) => (
            <label key={r.key} className="flex items-center justify-between gap-3 rounded-md border border-[#E7DED1] px-3 py-2 text-sm dark:border-[#3A332B]">
              <span className="text-gray-600 dark:text-gray-300">{r.label ?? r.key}</span>
              <input type="number" step="any" inputMode="decimal" value={vals[r.key]} onChange={(e) => { setVals({ ...vals, [r.key]: e.target.value }); setDirtyKeys(new Set([...dirtyKeys, r.key])) }} className="h-8 w-28 rounded-md border border-input bg-[#FFFBEA] px-2 text-right tabular-nums dark:bg-[#2A241E]" />
            </label>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button disabled={dirtyKeys.size === 0 || isPending} onClick={saveAll} className="bg-[#C5A572] hover:bg-[#A08050]">{isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Kennzahlen speichern</Button>
        </div>
      </CardContent>
    </Card>
  )
}
