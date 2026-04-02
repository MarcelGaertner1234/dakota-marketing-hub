"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Users, GripVertical, ArrowRight } from "lucide-react"
import { updateLeadStatus, addLeadActivity } from "@/lib/actions/leads"
import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from "@/lib/constants"
import type { LeadStatus } from "@/types/database"
import { useRouter } from "next/navigation"

const KANBAN_COLUMNS: LeadStatus[] = [
  "neu",
  "kontaktiert",
  "interessiert",
  "gebucht",
  "nachfassen",
  "verloren",
]

interface Lead {
  id: string
  name: string
  company: string | null
  lead_type: string
  status: string
  tags: string[] | null
}

interface TeamMember {
  id: string
  name: string
  color: string
}

interface PendingMove {
  leadId: string
  leadName: string
  fromStatus: LeadStatus
  toStatus: LeadStatus
}

function DroppableColumn({
  status,
  leads,
  isOver,
  activeId,
  onLeadClick,
}: {
  status: LeadStatus
  leads: Lead[]
  isOver: boolean
  activeId: string | null
  onLeadClick: (id: string) => void
}) {
  const { setNodeRef } = useDroppable({ id: status })

  return (
    <div ref={setNodeRef} className="min-w-[220px] flex-1">
      <div className="mb-3 flex items-center gap-2">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: LEAD_STATUS_COLORS[status] }}
        />
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {LEAD_STATUS_LABELS[status]}
        </h3>
        <Badge variant="secondary" className="text-xs">
          {leads.length}
        </Badge>
      </div>
      <div
        className={`space-y-2 min-h-[100px] rounded-lg p-1 transition-colors ${
          isOver ? "bg-[#C5A572]/10 ring-2 ring-[#C5A572]/30" : ""
        }`}
      >
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            isDragging={lead.id === activeId}
            onClick={() => onLeadClick(lead.id)}
          />
        ))}
        {leads.length === 0 && (
          <div className="rounded-lg border border-dashed p-4 text-center text-xs text-gray-400 dark:text-gray-500">
            Keine Leads
          </div>
        )}
      </div>
    </div>
  )
}

function LeadCard({
  lead,
  isDragging,
  onClick,
}: {
  lead: Lead
  isDragging?: boolean
  onClick: () => void
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: lead.id,
  })
  const didDrag = useRef(false)
  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined

  if (transform && (Math.abs(transform.x) > 3 || Math.abs(transform.y) > 3)) {
    didDrag.current = true
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className={`transition-shadow hover:shadow-md cursor-pointer ${
          isDragging ? "opacity-30" : ""
        }`}
        onClick={() => {
          if (!didDrag.current) {
            onClick()
          }
          didDrag.current = false
        }}
      >
        <CardContent className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <GripVertical className="h-4 w-4 text-gray-300 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-sm hover:text-[#C5A572] transition-colors">
                  {lead.name}
                </p>
                {lead.company && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{lead.company}</p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500 capitalize mt-0.5">
                  {lead.lead_type}
                </p>
              </div>
            </div>
            <Users className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
          </div>
          {lead.tags && lead.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1 ml-6">
              {lead.tags.map((tag: string) => (
                <Badge key={tag} variant="outline" className="text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function DragOverlayCard({ lead }: { lead: Lead }) {
  return (
    <Card className="cursor-grabbing shadow-xl ring-2 ring-[#C5A572] rotate-2 w-[240px]">
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <GripVertical className="h-4 w-4 text-[#C5A572] mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="font-medium text-sm">{lead.name}</p>
            {lead.company && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{lead.company}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function KanbanBoard({
  initialLeads,
  teamMembers,
}: {
  initialLeads: Lead[]
  teamMembers: TeamMember[]
}) {
  const [leads, setLeads] = useState(initialLeads)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null)
  const [selectedMember, setSelectedMember] = useState<string>("")
  const [mounted, setMounted] = useState(false)
  const [, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => { setMounted(true) }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null

  // SSR: render static version without DnD to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((status) => {
          const columnLeads = leads.filter((l) => l.status === status)
          return (
            <div key={status} className="min-w-[220px] flex-1">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: LEAD_STATUS_COLORS[status] }} />
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{LEAD_STATUS_LABELS[status]}</h3>
                <Badge variant="secondary" className="text-xs">{columnLeads.length}</Badge>
              </div>
              <div className="space-y-2 min-h-[100px] rounded-lg p-1">
                {columnLeads.map((lead) => (
                  <Card key={lead.id} className="cursor-pointer transition-shadow hover:shadow-md">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <GripVertical className="h-4 w-4 text-gray-300 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm">{lead.name}</p>
                            {lead.company && <p className="text-xs text-gray-500 dark:text-gray-400">{lead.company}</p>}
                            <p className="text-xs text-gray-400 dark:text-gray-500 capitalize mt-0.5">{lead.lead_type}</p>
                          </div>
                        </div>
                        <Users className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {columnLeads.length === 0 && (
                  <div className="rounded-lg border border-dashed p-4 text-center text-xs text-gray-400 dark:text-gray-500">Keine Leads</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragOver(event: DragOverEvent) {
    setOverId(event.over?.id as string | null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    setOverId(null)

    if (!over) return

    const leadId = active.id as string
    const rawStatus = over.id as string

    // Guard: only accept valid column statuses, not card UUIDs
    if (!KANBAN_COLUMNS.includes(rawStatus as LeadStatus)) return
    const newStatus = rawStatus as LeadStatus

    const lead = leads.find((l) => l.id === leadId)
    if (!lead || lead.status === newStatus) return

    // Show "who moved this?" dialog
    setPendingMove({
      leadId,
      leadName: lead.name,
      fromStatus: lead.status as LeadStatus,
      toStatus: newStatus,
    })
    setSelectedMember("")
  }

  function confirmMove() {
    if (!pendingMove) return

    const { leadId, fromStatus, toStatus } = pendingMove
    const memberName = teamMembers.find((m) => m.id === selectedMember)?.name || "Unbekannt"

    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: toStatus } : l))
    )

    setPendingMove(null)

    // Server update
    startTransition(async () => {
      try {
        await updateLeadStatus(leadId, toStatus)
      } catch {
        // Rollback only on status update failure
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: fromStatus } : l))
        )
        return
      }

      // Log activity — non-fatal, don't roll back status on failure
      try {
        const formData = new FormData()
        formData.set("lead_id", leadId)
        formData.set("activity_type", "status_change")
        formData.set(
          "description",
          `Status geändert: ${LEAD_STATUS_LABELS[fromStatus]} → ${LEAD_STATUS_LABELS[toStatus]}`
        )
        if (selectedMember) {
          formData.set("contacted_by", selectedMember)
        }
        await addLeadActivity(formData)
      } catch {
        // Activity log failed — status was already updated, no rollback
        console.error("Failed to log activity for lead status change")
      }

      router.refresh()
    })
  }

  function cancelMove() {
    setPendingMove(null)
  }

  function handleLeadClick(leadId: string) {
    router.push(`/leads/${leadId}`)
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((status) => {
            const columnLeads = leads.filter((l) => l.status === status)
            return (
              <DroppableColumn
                key={status}
                status={status}
                leads={columnLeads}
                isOver={overId === status}
                activeId={activeId}
                onLeadClick={handleLeadClick}
              />
            )
          })}
        </div>

        <DragOverlay>
          {activeLead ? <DragOverlayCard lead={activeLead} /> : null}
        </DragOverlay>
      </DndContext>

      {/* "Wer hat verschoben?" Dialog */}
      <Dialog open={!!pendingMove} onOpenChange={(open) => { if (!open) cancelMove() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lead verschieben</DialogTitle>
            <DialogDescription>
              Wer verschiebt <strong>{pendingMove?.leadName}</strong>?
            </DialogDescription>
          </DialogHeader>

          {pendingMove && (
            <div className="flex items-center justify-center gap-3 py-4">
              <Badge
                variant="outline"
                className="text-sm px-3 py-1"
                style={{
                  borderColor: LEAD_STATUS_COLORS[pendingMove.fromStatus],
                  color: LEAD_STATUS_COLORS[pendingMove.fromStatus],
                }}
              >
                {LEAD_STATUS_LABELS[pendingMove.fromStatus]}
              </Badge>
              <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Badge
                className="text-sm px-3 py-1 text-white"
                style={{ backgroundColor: LEAD_STATUS_COLORS[pendingMove.toStatus] }}
              >
                {LEAD_STATUS_LABELS[pendingMove.toStatus]}
              </Badge>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {teamMembers.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => setSelectedMember(member.id)}
                className={`flex items-center gap-2 rounded-lg border p-3 transition-all ${
                  selectedMember === member.id
                    ? "border-[#C5A572] bg-[#C5A572]/10 ring-1 ring-[#C5A572]"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: member.color }}
                >
                  {member.name[0]}
                </div>
                <span className="text-sm font-medium">{member.name}</span>
              </button>
            ))}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={cancelMove}>
              Abbrechen
            </Button>
            <Button
              className="bg-[#C5A572] hover:bg-[#A08050]"
              onClick={confirmMove}
              disabled={!selectedMember}
            >
              Verschieben
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
