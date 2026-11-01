"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Pencil, Trash2, Plus } from "lucide-react"
import { deleteWoche, saveWoche } from "@/lib/actions/cockpit"
import { chf, isoWeek, monatLabel, monatKey, zahl } from "@/lib/cockpit/calc"
import type { CockpitWoche } from "@/types/database"

function nextWeek(wochen: CockpitWoche[]): { kw: number; von: string; bis: string } {
  const last = wochen[0]
  const base = last ? new Date(last.bis + "T00:00:00Z") : new Date(Date.UTC(2026, 11, 13))
  const von = new Date(base); von.setUTCDate(von.getUTCDate() + 1)
  const bis = new Date(von); bis.setUTCDate(bis.getUTCDate() + 6)
  const v = von.toISOString().slice(0, 10), b = bis.toISOString().slice(0, 10)
  return { kw: isoWeek(b), von: v, bis: b }
}

const F = ({ id, label, defaultValue, step = "0.05", type = "number", placeholder }: { id: string; label: string; defaultValue?: string | number | null; step?: string; type?: string; placeholder?: string }) => (
  <div className="space-y-1">
    <Label htmlFor={id} className="text-xs">{label}</Label>
    <Input id={id} name={id} type={type} step={type === "number" ? step : undefined} inputMode={type === "number" ? "decimal" : undefined} defaultValue={defaultValue ?? ""} placeholder={placeholder} className="h-9" />
  </div>
)

export function WochenEingabe({ wochen }: { wochen: CockpitWoche[] }) {
  const router = useRouter()
  const [edit, setEdit] = useState<CockpitWoche | null>(null)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const nxt = useMemo(() => nextWeek(wochen), [wochen])
  const formKey = edit?.id ?? `neu-${nxt.bis}`

  function submit(fd: FormData) {
    setError(null)
    startTransition(async () => {
      const r = await saveWoche(fd)
      if (!r.success) { setError(r.error); return }
      setEdit(null); setOpen(false); router.refresh()
    })
  }
  function remove(id: string) {
    if (!confirm("Diese Woche löschen?")) return
    startTransition(async () => { const r = await deleteWoche(id); if (!r.success) setError(r.error); else router.refresh() })
  }

  const showForm = open || edit

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">Eine Zeile pro «Rapport AIRL Woche». Restaurant netto = Gesamt ohne Trinkgeld. Monat = Monat des Sonntags.</p>
        {!showForm && (
          <Button onClick={() => { setEdit(null); setOpen(true) }} className="bg-[#C5A572] hover:bg-[#A08050]"><Plus className="mr-2 h-4 w-4" />Woche erfassen</Button>
        )}
      </div>

      {showForm && (
        <Card key={formKey}>
          <CardHeader><CardTitle>{edit ? `Woche ${edit.kw} bearbeiten` : `Neue Woche (Vorschlag KW ${nxt.kw})`}</CardTitle></CardHeader>
          <CardContent>
            {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            <form action={submit} className="space-y-4">
              {edit && <input type="hidden" name="id" value={edit.id} />}
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <F id="kw" label="KW" defaultValue={edit?.kw ?? nxt.kw} step="1" />
                <F id="von" label="Von (Montag)" type="date" defaultValue={edit?.von ?? nxt.von} />
                <F id="bis" label="Bis (Sonntag)" type="date" defaultValue={edit?.bis ?? nxt.bis} />
                <F id="restaurant_netto" label="Restaurant netto CHF" defaultValue={edit?.restaurant_netto} />
                <F id="food" label="Food CHF" defaultValue={edit?.food} />
                <F id="beverage" label="Beverage CHF" defaultValue={edit?.beverage} />
                <F id="trinkgeld" label="Trinkgeld CHF" defaultValue={edit?.trinkgeld} />
                <F id="fruehstueck" label="Frühstück CHF" defaultValue={edit?.fruehstueck} />
                <F id="halbpension" label="Halbpension CHF" defaultValue={edit?.halbpension} />
                <F id="personen" label="Personen" defaultValue={edit?.personen} step="1" />
                <F id="kapitel_menues" label="Kapitel-Menüs" defaultValue={edit?.kapitel_menues} step="1" />
                <F id="anlaesse_anzahl" label="Anlässe (Anzahl)" defaultValue={edit?.anlaesse_anzahl} step="1" />
                <F id="anlass_umsatz" label="Anlass-Umsatz CHF" defaultValue={edit?.anlass_umsatz} />
                <F id="ausfalltage" label="Ausfalltage" defaultValue={edit?.ausfalltage} step="1" />
                <F id="erfasst_von" label="Erfasst von" type="text" defaultValue={edit?.erfasst_von} placeholder="Name" />
                <div className="space-y-1 sm:col-span-3">
                  <Label htmlFor="bemerkung" className="text-xs">Bemerkung</Label>
                  <Input id="bemerkung" name="bemerkung" defaultValue={edit?.bemerkung ?? ""} className="h-9" placeholder="z.B. Silvester, Krankheit, Anlass Militär" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setEdit(null); setOpen(false); setError(null) }}>Abbrechen</Button>
                <Button type="submit" disabled={isPending} className="bg-[#C5A572] hover:bg-[#A08050]">{isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Speichert…</> : "Woche speichern"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#2C2C2C] hover:bg-[#2C2C2C]">
                {["KW", "Zeitraum", "Monat", "Restaurant netto", "Food", "Beverage", "Frühstück", "HP", "Pers.", "Bon", "Kapitel", "Anlässe", "Ausfall", "Bemerkung", ""].map((h, i) => (
                  <TableHead key={i} className={`whitespace-nowrap text-white ${i >= 3 && i <= 12 ? "text-right" : ""}`}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {wochen.length === 0 && <TableRow><TableCell colSpan={15} className="py-8 text-center text-gray-500">Noch keine Woche erfasst.</TableCell></TableRow>}
              {wochen.map((w) => {
                const bon = w.personen > 0 ? (Number(w.restaurant_netto) - Number(w.anlass_umsatz)) / w.personen : null
                return (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">{w.kw}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs">{w.von.slice(8, 10)}.{w.von.slice(5, 7)}. – {w.bis.slice(8, 10)}.{w.bis.slice(5, 7)}.{w.bis.slice(0, 4)}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-gray-500">{monatLabel(monatKey(w.bis), true)}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{chf(Number(w.restaurant_netto))}</TableCell>
                    <TableCell className="text-right tabular-nums">{chf(w.food == null ? null : Number(w.food))}</TableCell>
                    <TableCell className="text-right tabular-nums">{chf(w.beverage == null ? null : Number(w.beverage))}</TableCell>
                    <TableCell className="text-right tabular-nums">{chf(Number(w.fruehstueck))}</TableCell>
                    <TableCell className="text-right tabular-nums">{chf(Number(w.halbpension))}</TableCell>
                    <TableCell className="text-right tabular-nums">{zahl(w.personen)}</TableCell>
                    <TableCell className="text-right tabular-nums">{bon == null ? "–" : zahl(bon, 2)}</TableCell>
                    <TableCell className="text-right tabular-nums">{zahl(w.kapitel_menues)}</TableCell>
                    <TableCell className="text-right tabular-nums">{w.anlaesse_anzahl ? `${w.anlaesse_anzahl} · ${chf(Number(w.anlass_umsatz))}` : "–"}</TableCell>
                    <TableCell className="text-right tabular-nums">{w.ausfalltage || "–"}</TableCell>
                    <TableCell className="max-w-[220px] truncate text-xs text-gray-500" title={w.bemerkung ?? ""}>{w.bemerkung}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Button variant="ghost" size="icon" onClick={() => { setEdit(w); setOpen(true); window.scrollTo({ top: 0, behavior: "smooth" }) }} aria-label="Bearbeiten"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(w.id)} aria-label="Löschen"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
