"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Pencil, Trash2, Plus } from "lucide-react"
import { deleteAnlass, saveAnlass, setAnlassStatus } from "@/lib/actions/cockpit"
import { chf, monatKey, monatLabel } from "@/lib/cockpit/calc"
import type { CockpitAnlass } from "@/types/database"
import { cn } from "@/lib/utils"

export function AnlaesseEingabe({ anlaesse }: { anlaesse: CockpitAnlass[] }) {
  const router = useRouter()
  const [edit, setEdit] = useState<CockpitAnlass | null>(null)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit(fd: FormData) {
    setError(null)
    startTransition(async () => {
      const r = await saveAnlass(fd)
      if (!r.success) { setError(r.error); return }
      setEdit(null); setOpen(false); router.refresh()
    })
  }
  const showForm = open || edit
  const heute = new Date().toISOString().slice(0, 10)
  const kommend = anlaesse.filter((a) => a.datum >= heute)
  const vergangen = anlaesse.filter((a) => a.datum < heute)

  const Row = ({ a }: { a: CockpitAnlass }) => (
    <TableRow key={a.id} className={cn(a.status === "option" && "text-gray-500")}>
      <TableCell className="whitespace-nowrap">{a.datum.slice(8, 10)}.{a.datum.slice(5, 7)}.{a.datum.slice(0, 4)}</TableCell>
      <TableCell className="text-xs text-gray-500">{monatLabel(monatKey(a.datum), true)}</TableCell>
      <TableCell className="font-medium">{a.anlass}{a.bemerkung && <span className="block text-xs font-normal text-gray-500">{a.bemerkung}</span>}</TableCell>
      <TableCell className="text-right tabular-nums">{a.personen}</TableCell>
      <TableCell className="text-right tabular-nums">{chf(Number(a.preis))}</TableCell>
      <TableCell className="text-right tabular-nums font-medium">{chf(a.personen * Number(a.preis))}</TableCell>
      <TableCell>
        <button
          type="button"
          onClick={() => startTransition(async () => { await setAnlassStatus(a.id, a.status === "fix" ? "option" : "fix"); router.refresh() })}
          className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", a.status === "fix" ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-gray-50 text-gray-600 ring-gray-200")}
          title="Klicken zum Umschalten"
        >
          {a.status === "fix" ? "fix" : "Option"}
        </button>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <Button variant="ghost" size="icon" onClick={() => { setEdit(a); setOpen(true) }} aria-label="Bearbeiten"><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Anlass löschen?")) startTransition(async () => { await deleteAnlass(a.id); router.refresh() }) }} aria-label="Löschen"><Trash2 className="h-4 w-4 text-red-500" /></Button>
      </TableCell>
    </TableRow>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">Anlässe ab 10 Personen. Nur Status «fix» zählt im Forecast, «Option» wird angezeigt, aber nicht gerechnet.</p>
        {!showForm && <Button onClick={() => { setEdit(null); setOpen(true) }} className="bg-[#C5A572] hover:bg-[#A08050]"><Plus className="mr-2 h-4 w-4" />Anlass eintragen</Button>}
      </div>
      {showForm && (
        <Card key={edit?.id ?? "neu"}>
          <CardHeader><CardTitle>{edit ? "Anlass bearbeiten" : "Neuer Anlass"}</CardTitle></CardHeader>
          <CardContent>
            {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            <form action={submit} className="space-y-4">
              {edit && <input type="hidden" name="id" value={edit.id} />}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                <div className="space-y-1"><Label htmlFor="datum" className="text-xs">Datum</Label><Input id="datum" name="datum" type="date" required defaultValue={edit?.datum ?? ""} className="h-9" /></div>
                <div className="space-y-1 lg:col-span-2"><Label htmlFor="anlass" className="text-xs">Anlass / Gruppe</Label><Input id="anlass" name="anlass" required defaultValue={edit?.anlass ?? ""} placeholder="z.B. Weihnachtsessen Firma X" className="h-9" /></div>
                <div className="space-y-1"><Label htmlFor="personen" className="text-xs">Personen</Label><Input id="personen" name="personen" type="number" step="1" inputMode="numeric" defaultValue={edit?.personen ?? ""} className="h-9" /></div>
                <div className="space-y-1"><Label htmlFor="preis" className="text-xs">Preis p.P. CHF</Label><Input id="preis" name="preis" type="number" step="0.05" inputMode="decimal" defaultValue={edit?.preis ?? ""} className="h-9" /></div>
                <div className="space-y-1"><Label htmlFor="status" className="text-xs">Status</Label>
                  <select id="status" name="status" defaultValue={edit?.status ?? "option"} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                    <option value="fix">fix (gebucht)</option>
                    <option value="option">Option</option>
                  </select>
                </div>
                <div className="space-y-1 sm:col-span-2 lg:col-span-6"><Label htmlFor="bemerkung" className="text-xs">Bemerkung</Label><Input id="bemerkung" name="bemerkung" defaultValue={edit?.bemerkung ?? ""} className="h-9" placeholder="Menü, Kontakt, Zeit" /></div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setEdit(null); setOpen(false); setError(null) }}>Abbrechen</Button>
                <Button type="submit" disabled={isPending} className="bg-[#C5A572] hover:bg-[#A08050]">{isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Speichert…</> : "Anlass speichern"}</Button>
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
                {["Datum", "Monat", "Anlass / Gruppe", "Pers.", "Preis p.P.", "Umsatz", "Status", ""].map((h, i) => <TableHead key={i} className={`text-white ${i >= 3 && i <= 5 ? "text-right" : ""}`}>{h}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {kommend.length === 0 && <TableRow><TableCell colSpan={8} className="py-8 text-center text-gray-500">Noch kein Anlass eingetragen.</TableCell></TableRow>}
              {kommend.map((a) => <Row key={a.id} a={a} />)}
              {vergangen.length > 0 && <TableRow><TableCell colSpan={8} className="bg-[#F8F6F3] text-xs font-medium uppercase tracking-wide text-gray-500">Vergangen</TableCell></TableRow>}
              {vergangen.map((a) => <Row key={a.id} a={a} />)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
