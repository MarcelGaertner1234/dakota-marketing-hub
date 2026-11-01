"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Loader2, CalendarDays, ChevronDown, ChevronUp } from "lucide-react"
import { createTask, deleteTask, updateTask, updateTaskStatus } from "@/lib/actions/tasks"
import { TASK_PRIORITY_LABELS } from "@/lib/constants"
import { cn } from "@/lib/utils"

export interface AufgabeItem {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  assigned_to: string | null
  event_id: string | null
  completed_at: string | null
  assigned_member: { id: string; name: string; color: string } | null
  event: { id: string; title: string; start_date: string } | null
}
interface Member { id: string; name: string; color: string }
interface EventOption { id: string; title: string; start_date: string }

const PRIO: Record<string, string> = {
  low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  medium: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  high: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  urgent: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
}
const SEL = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"

function fmtDate(d: string | null) {
  if (!d) return "–"
  const [y, m, day] = d.split("-")
  return `${day}.${m}.${y}`
}

function TaskForm({ task, members, events, onClose }: { task: AufgabeItem | null; members: Member[]; events: EventOption[]; onClose: () => void }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  function submit(fd: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        if (task) {
          const r = await updateTask(task.id, {
            title: fd.get("title") as string,
            description: (fd.get("description") as string) || null,
            priority: fd.get("priority") as string,
            due_date: (fd.get("due_date") as string) || null,
            assigned_to: (fd.get("assigned_to") as string) || null,
            event_id: (fd.get("event_id") as string) || null,
          })
          if (!r.success) { setError(r.error); return }
        } else {
          await createTask(fd)
        }
        onClose(); router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Speichern fehlgeschlagen")
      }
    })
  }
  return (
    <form action={submit} className="space-y-4">
      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="space-y-2">
        <Label htmlFor="t-title">Aufgabe *</Label>
        <Input id="t-title" name="title" required defaultValue={task?.title ?? ""} placeholder="Was ist zu tun?" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="t-due">Fällig</Label>
          <Input id="t-due" name="due_date" type="date" defaultValue={task?.due_date ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="t-prio">Priorität</Label>
          <select id="t-prio" name="priority" defaultValue={task?.priority ?? "medium"} className={SEL}>
            {Object.entries(TASK_PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="t-who">Zuständig</Label>
          <select id="t-who" name="assigned_to" defaultValue={task?.assigned_to ?? ""} className={SEL}>
            <option value="">Niemand</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="t-event">Gehört zu Event (optional)</Label>
        <select id="t-event" name="event_id" defaultValue={task?.event_id ?? ""} className={SEL}>
          <option value="">Kein Event</option>
          {task?.event && !events.some((e) => e.id === task.event!.id) && <option value={task.event.id}>{fmtDate(task.event.start_date)} · {task.event.title}</option>}
          {events.map((e) => <option key={e.id} value={e.id}>{fmtDate(e.start_date)} · {e.title}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="t-desc">Notiz</Label>
        <Textarea id="t-desc" name="description" rows={2} defaultValue={task?.description ?? ""} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Abbrechen</Button>
        <Button type="submit" disabled={isPending} className="bg-[#C5A572] hover:bg-[#A08050]">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : task ? "Speichern" : "Aufgabe anlegen"}</Button>
      </DialogFooter>
    </form>
  )
}

export function AufgabenBoard({ open, done, members, events, today }: { open: AufgabeItem[]; done: AufgabeItem[]; members: Member[]; events: EventOption[]; today: string }) {
  const router = useRouter()
  const [who, setWho] = useState<string>("alle")
  const [zeit, setZeit] = useState<"alle" | "ueberfaellig" | "woche">("alle")
  const [showDone, setShowDone] = useState(false)
  const [dialog, setDialog] = useState<{ open: boolean; task: AufgabeItem | null }>({ open: false, task: null })
  const [confirmDel, setConfirmDel] = useState<AufgabeItem | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const inWeek = (d: string | null) => {
    if (!d) return false
    const [y, m, day] = today.split("-").map(Number)
    const limit = new Date(Date.UTC(y, m - 1, day + 7)).toISOString().slice(0, 10)
    return d <= limit
  }
  const filtered = open.filter((t) => {
    if (who === "niemand" && t.assigned_to) return false
    if (who !== "alle" && who !== "niemand" && t.assigned_to !== who) return false
    if (zeit === "ueberfaellig" && !(t.due_date && t.due_date < today)) return false
    if (zeit === "woche" && !inWeek(t.due_date)) return false
    return true
  })
  const ueberfaellig = open.filter((t) => t.due_date && t.due_date < today).length

  function complete(t: AufgabeItem) {
    setPendingId(t.id)
    startTransition(async () => { await updateTaskStatus(t.id, "done", t.event_id ?? undefined); setPendingId(null); router.refresh() })
  }
  function reopen(t: AufgabeItem) {
    setPendingId(t.id)
    startTransition(async () => { await updateTaskStatus(t.id, "todo", t.event_id ?? undefined); setPendingId(null); router.refresh() })
  }
  function remove(t: AufgabeItem) {
    setConfirmDel(null)
    startTransition(async () => { const r = await deleteTask(t.id); if (!r.success) alert(r.error); router.refresh() })
  }

  const Row = ({ t, erledigt = false }: { t: AufgabeItem; erledigt?: boolean }) => {
    const late = !erledigt && t.due_date && t.due_date < today
    return (
      <div className={cn("flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800", pendingId === t.id && "opacity-50 pointer-events-none", erledigt && "opacity-70")}>
        <Checkbox className="mt-0.5 shrink-0" checked={erledigt} aria-label={erledigt ? "Wieder öffnen" : "Erledigt"} onCheckedChange={() => (erledigt ? reopen(t) : complete(t))} />
        <div className="min-w-0 flex-1">
          <p className={cn("text-sm font-medium", erledigt && "line-through text-gray-500")}>{t.title}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
            <span className={cn("inline-flex items-center gap-1", late && "font-semibold text-red-600")}><CalendarDays className="h-3 w-3" />{fmtDate(t.due_date)}{late && " · überfällig"}</span>
            <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", PRIO[t.priority] ?? PRIO.medium)}>{TASK_PRIORITY_LABELS[t.priority as keyof typeof TASK_PRIORITY_LABELS] ?? t.priority}</span>
            {t.event && <Link href={`/kalender/${t.event.id}`} className="truncate text-[#C5A572] hover:underline">{t.event.title}</Link>}
            {t.description && <span className="truncate text-gray-400" title={t.description}>{t.description}</span>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: t.assigned_member?.color || "#D1D5DB" }} title={t.assigned_member?.name ?? "Nicht zugewiesen"}>{t.assigned_member ? t.assigned_member.name[0] : "?"}</span>
          <Button variant="ghost" size="icon" aria-label="Bearbeiten" onClick={() => setDialog({ open: true, task: t })}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" aria-label="Löschen" onClick={() => setConfirmDel(t)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select value={who} onChange={(e) => setWho(e.target.value)} className={cn(SEL, "w-auto")} aria-label="Zuständig">
          <option value="alle">Alle Personen</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          <option value="niemand">Nicht zugewiesen</option>
        </select>
        <div className="flex rounded-md border border-input p-0.5">
          {([["alle", "Alle"], ["woche", "Diese Woche"], ["ueberfaellig", `Überfällig${ueberfaellig ? ` (${ueberfaellig})` : ""}`]] as const).map(([k, l]) => (
            <button key={k} type="button" onClick={() => setZeit(k)} className={cn("rounded px-3 py-1 text-sm", zeit === k ? "bg-[#2C2C2C] text-white dark:bg-[#C5A572] dark:text-[#15120F]" : "text-gray-600 hover:bg-gray-100 dark:text-gray-300")}>{l}</button>
          ))}
        </div>
        <div className="ml-auto">
          <Button onClick={() => setDialog({ open: true, task: null })} className="bg-[#C5A572] hover:bg-[#A08050]"><Plus className="mr-2 h-4 w-4" />Neue Aufgabe</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Offen ({filtered.length}{filtered.length !== open.length ? ` von ${open.length}` : ""})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {filtered.length === 0 && <p className="py-6 text-center text-sm text-gray-400">Keine offenen Aufgaben in dieser Auswahl.</p>}
          {filtered.map((t) => <Row key={t.id} t={t} />)}
        </CardContent>
      </Card>

      {done.length > 0 && (
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => setShowDone(!showDone)}>
            <CardTitle className="flex items-center justify-between text-lg text-gray-500">Erledigt ({done.length}){showDone ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</CardTitle>
          </CardHeader>
          {showDone && <CardContent className="space-y-2">{done.map((t) => <Row key={t.id} t={t} erledigt />)}</CardContent>}
        </Card>
      )}

      <Dialog open={dialog.open} onOpenChange={(o) => { if (!o) setDialog({ open: false, task: null }) }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>{dialog.task ? "Aufgabe bearbeiten" : "Neue Aufgabe"}</DialogTitle></DialogHeader>
          {dialog.open && <TaskForm task={dialog.task} members={members} events={events} onClose={() => setDialog({ open: false, task: null })} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDel} onOpenChange={(o) => { if (!o) setConfirmDel(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Aufgabe löschen?</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 dark:text-gray-300">«{confirmDel?.title}» wird endgültig gelöscht.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDel(null)}>Abbrechen</Button>
            <Button variant="destructive" onClick={() => confirmDel && remove(confirmDel)}>Löschen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
