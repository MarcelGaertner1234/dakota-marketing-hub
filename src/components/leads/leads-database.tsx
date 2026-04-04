"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { RefreshCw, Search, ArrowUpDown, RotateCcw } from "lucide-react"
import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from "@/lib/constants"
import { startNewRound } from "@/lib/actions/leads"
import type { LeadStatus } from "@/types/database"

interface LeadWithRounds {
  id: string
  name: string
  company: string | null
  lead_type: string
  email: string | null
  phone: string | null
  status: string
  tags: string[] | null
  created_at: string
  updated_at: string
  round_count: number
  current_round: {
    id: string
    round_number: number
    reason: string
    started_at: string
    ended_at: string | null
    outcome: string | null
  } | null
  last_activity: {
    activity_type: string
    contacted_at: string
  } | null
}

interface TeamMember {
  id: string
  name: string
  color: string
}

const LEAD_TYPE_LABELS: Record<string, string> = {
  verein: "Verein",
  firma: "Firma",
  privatperson: "Privat",
  behoerde: "Behörde",
  medien: "Medien",
}

const ACTIVITY_LABELS: Record<string, string> = {
  anruf: "Anruf",
  email: "E-Mail",
  treffen: "Treffen",
  nachricht: "Nachricht",
  notiz: "Notiz",
  status_change: "Status",
}

type SortKey = "name" | "status" | "round" | "updated"

export function LeadsDatabase({
  leads,
  teamMembers,
}: {
  leads: LeadWithRounds[]
  teamMembers: TeamMember[]
}) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("updated")
  const [sortAsc, setSortAsc] = useState(false)
  const [newRoundLead, setNewRoundLead] = useState<LeadWithRounds | null>(null)
  const [reason, setReason] = useState("")
  const [selectedMember, setSelectedMember] = useState<string>("")
  const [pending, startTransition] = useTransition()

  // Filter
  const filtered = leads.filter((lead) => {
    const q = search.toLowerCase()
    if (!q) return true
    return (
      lead.name.toLowerCase().includes(q) ||
      (lead.company?.toLowerCase().includes(q) ?? false) ||
      (lead.email?.toLowerCase().includes(q) ?? false) ||
      (lead.tags?.some((t) => t.toLowerCase().includes(q)) ?? false)
    )
  })

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0
    switch (sortKey) {
      case "name":
        cmp = a.name.localeCompare(b.name)
        break
      case "status":
        cmp = a.status.localeCompare(b.status)
        break
      case "round":
        cmp = (a.round_count || 0) - (b.round_count || 0)
        break
      case "updated":
        cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
        break
    }
    return sortAsc ? cmp : -cmp
  })

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  function handleStartNewRound() {
    if (!newRoundLead || !reason.trim()) return
    startTransition(async () => {
      const result = await startNewRound(newRoundLead.id, reason.trim(), selectedMember || undefined)
      if (result.success) {
        setNewRoundLead(null)
        setReason("")
        setSelectedMember("")
        router.refresh()
      }
    })
  }

  const canStartNewRound = (status: string) =>
    status === "gebucht" || status === "verloren"

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Suche nach Name, Firma, E-Mail, Tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button onClick={() => toggleSort("name")} className="flex items-center gap-1 font-medium">
                  Name <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Firma</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>
                <button onClick={() => toggleSort("status")} className="flex items-center gap-1 font-medium">
                  Status <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => toggleSort("round")} className="flex items-center gap-1 font-medium">
                  Durchlauf <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Grund</TableHead>
              <TableHead>
                <button onClick={() => toggleSort("updated")} className="flex items-center gap-1 font-medium">
                  Letzte Aktivität <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-gray-400 py-8">
                  Keine Leads gefunden.
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((lead) => (
                <TableRow key={lead.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <TableCell>
                    <Link
                      href={`/leads/${lead.id}`}
                      className="font-medium text-[#2C2C2C] dark:text-gray-100 hover:text-[#C5A572] hover:underline"
                    >
                      {lead.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-gray-500 dark:text-gray-400">
                    {lead.company || "—"}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {LEAD_TYPE_LABELS[lead.lead_type] || lead.lead_type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className="text-[11px]"
                      style={{
                        backgroundColor: LEAD_STATUS_COLORS[lead.status as LeadStatus],
                        color: "white",
                      }}
                    >
                      {LEAD_STATUS_LABELS[lead.status as LeadStatus] || lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <RefreshCw className="h-3 w-3 text-gray-400" />
                      <span className="text-sm font-medium">{lead.round_count}.</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[160px]">
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate block">
                      {lead.current_round?.reason || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {lead.last_activity ? (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-medium">
                          {ACTIVITY_LABELS[lead.last_activity.activity_type] || lead.last_activity.activity_type}
                        </span>
                        <br />
                        {new Date(lead.last_activity.contacted_at).toLocaleDateString("de-CH", {
                          day: "numeric",
                          month: "short",
                        })}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {lead.tags?.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                      {(lead.tags?.length || 0) > 2 && (
                        <span className="text-[10px] text-gray-400">+{(lead.tags?.length || 0) - 2}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {canStartNewRound(lead.status) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[#C5A572] hover:text-[#A08050]"
                        onClick={(e) => {
                          e.preventDefault()
                          setNewRoundLead(lead)
                        }}
                        title="Neuen Durchlauf starten"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500">
        {sorted.length} von {leads.length} Leads
      </p>

      {/* New Round Dialog */}
      <Dialog
        open={!!newRoundLead}
        onOpenChange={(open) => {
          if (!open) {
            setNewRoundLead(null)
            setReason("")
            setSelectedMember("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuer Durchlauf starten</DialogTitle>
            <DialogDescription>
              {newRoundLead?.name} — aktuell{" "}
              <Badge
                className="text-[10px]"
                style={{
                  backgroundColor: LEAD_STATUS_COLORS[(newRoundLead?.status || "neu") as LeadStatus],
                  color: "white",
                }}
              >
                {LEAD_STATUS_LABELS[(newRoundLead?.status || "neu") as LeadStatus]}
              </Badge>
              {" "}→ wird auf <Badge className="text-[10px] bg-gray-500 text-white">Neu</Badge> zurückgesetzt
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Grund für den neuen Durchlauf *</label>
              <Textarea
                placeholder="z.B. Einladung zum Sommerfest, Kooperationsanfrage, Nachfass-Aktion..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Wer startet den Durchlauf?</label>
              <div className="grid grid-cols-2 gap-2">
                {teamMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => setSelectedMember(member.id === selectedMember ? "" : member.id)}
                    className={`flex items-center gap-2 rounded-lg border p-2 text-sm transition-colors ${
                      selectedMember === member.id
                        ? "border-[#C5A572] bg-[#C5A572]/10"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div
                      className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.name[0]}
                    </div>
                    {member.name}
                  </button>
                ))}
              </div>
            </div>

            {newRoundLead && newRoundLead.round_count > 0 && (
              <p className="text-xs text-gray-400">
                Dies wird Durchlauf #{newRoundLead.round_count + 1} für diesen Lead.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNewRoundLead(null)
                setReason("")
                setSelectedMember("")
              }}
            >
              Abbrechen
            </Button>
            <Button
              className="bg-[#C5A572] hover:bg-[#A08050]"
              disabled={!reason.trim() || pending}
              onClick={handleStartNewRound}
            >
              {pending ? "Wird gestartet..." : "Durchlauf starten"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
