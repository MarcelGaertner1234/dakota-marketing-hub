"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building,
  Tag,
  Clock,
  Pencil,
  Save,
  X,
  Loader2,
  CalendarDays,
  Plus,
  Trash2,
  RefreshCw,
  RotateCcw,
  Flame,
  Zap,
  User,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea as DialogTextarea } from "@/components/ui/textarea"
import Link from "next/link"
import { updateLead, deleteLead, linkLeadToEvent, unlinkLeadFromEvent, startNewRound } from "@/lib/actions/leads"
import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS, LEAD_TEMPERATURE_LABELS, LEAD_TEMPERATURE_COLORS, EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from "@/lib/constants"
import type { LeadStatus, LeadType, LeadTemperature, EventType } from "@/types/database"
import { LeadStatusSelect } from "./lead-status-select"
import { ActivityForm } from "./activity-form"
import { useRouter } from "next/navigation"

const LEAD_TYPE_LABELS: Record<LeadType, string> = {
  verein: "Verein",
  firma: "Firma",
  privatperson: "Privatperson",
  behoerde: "Behörde",
  medien: "Medien",
}

const ALL_LEAD_TYPES: LeadType[] = [
  "privatperson",
  "firma",
  "verein",
  "behoerde",
  "medien",
]

interface LeadData {
  id: string
  name: string
  company: string | null
  lead_type: string
  email: string | null
  phone: string | null
  address: string | null
  status: string
  notes: string | null
  tags: string[] | null
  contact_person: string | null
  contact_role: string | null
  story: string | null
  trigger_points: string[] | null
  temperature: string
  next_action: string | null
  next_action_date: string | null
  created_at: string
  activities?: Array<{
    id: string
    activity_type: string
    description: string
    contacted_at: string
    contacted_member?: { name: string } | null
    event?: { id: string; title: string } | null
  }>
}

interface LinkedEvent {
  lead_id: string
  event_id: string
  status: string | null
  notes: string | null
  event: { id: string; title: string; start_date: string; event_type: string } | null
}

interface EventOption {
  id: string
  title: string
  start_date: string
  event_type: string
}

interface RoundData {
  id: string
  round_number: number
  reason: string
  started_at: string
  ended_at: string | null
  outcome: string | null
  started_member?: { name: string } | null
  activities?: Array<{
    id: string
    activity_type: string
    description: string
    contacted_at: string
    contacted_member?: { name: string } | null
    event?: { id: string; title: string } | null
  }>
}

interface TeamMemberOption {
  id: string
  name: string
  color: string
}

export function LeadDetail({
  lead,
  linkedEvents,
  allEvents,
  rounds = [],
  teamMembers = [],
}: {
  lead: LeadData
  linkedEvents: LinkedEvent[]
  allEvents: EventOption[]
  rounds?: RoundData[]
  teamMembers?: TeamMemberOption[]
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const [showEventPicker, setShowEventPicker] = useState(false)
  const [linkingEvent, startLinkTransition] = useTransition()
  const [showNewRound, setShowNewRound] = useState(false)
  const [newRoundReason, setNewRoundReason] = useState("")
  const [newRoundMember, setNewRoundMember] = useState("")
  const [roundPending, startRoundTransition] = useTransition()
  const [deletePending, startDeleteTransition] = useTransition()

  const status = lead.status as LeadStatus

  const linkedEventIds = new Set(linkedEvents.map((le) => le.event_id))
  const availableEvents = allEvents.filter((e) => !linkedEventIds.has(e.id))

  function handleLinkEvent(eventId: string) {
    startLinkTransition(async () => {
      const result = await linkLeadToEvent(lead.id, eventId)
      if (result.success) {
        setShowEventPicker(false)
        router.refresh()
      }
    })
  }

  function handleUnlinkEvent(eventId: string) {
    startLinkTransition(async () => {
      const result = await unlinkLeadFromEvent(lead.id, eventId)
      if (result.success) {
        router.refresh()
      }
    })
  }

  function handleSave(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const tags = (formData.get("tags") as string)
        ?.split(",")
        .map((t) => t.trim())
        .filter(Boolean) || []

      const triggerPoints = (formData.get("trigger_points") as string)
        ?.split(",")
        .map((t) => t.trim())
        .filter(Boolean) || []

      const result = await updateLead(lead.id, {
        name: formData.get("name") as string,
        company: (formData.get("company") as string) || null,
        email: (formData.get("email") as string) || null,
        phone: (formData.get("phone") as string) || null,
        address: (formData.get("address") as string) || null,
        notes: (formData.get("notes") as string) || null,
        lead_type: (formData.get("lead_type") as string) || "privatperson",
        tags: tags.length > 0 ? tags : null,
        contact_person: (formData.get("contact_person") as string) || null,
        contact_role: (formData.get("contact_role") as string) || null,
        story: (formData.get("story") as string) || null,
        trigger_points: triggerPoints.length > 0 ? triggerPoints : null,
        temperature: (formData.get("temperature") as string) || "kalt",
        next_action: (formData.get("next_action") as string) || null,
        next_action_date: (formData.get("next_action_date") as string) || null,
      })

      if (result.success) {
        setIsEditing(false)
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/leads">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-[#2C2C2C] dark:text-gray-100">{lead.name}</h1>
            <Badge
              style={{
                backgroundColor: LEAD_STATUS_COLORS[status],
                color: "white",
              }}
            >
              {LEAD_STATUS_LABELS[status]}
            </Badge>
          </div>
          {lead.company && (
            <p className="mt-1 text-gray-500 dark:text-gray-400">{lead.company}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(status === "gebucht" || status === "verloren") && (
            <Button
              variant="outline"
              onClick={() => setShowNewRound(true)}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Neuer Durchlauf
            </Button>
          )}
          <Button
            variant={isEditing ? "outline" : "default"}
            className={isEditing ? "" : "bg-[#C5A572] hover:bg-[#A08050]"}
            onClick={() => {
              setIsEditing(!isEditing)
              setError(null)
            }}
          >
            {isEditing ? (
              <>
                <X className="mr-2 h-4 w-4" /> Abbrechen
              </>
            ) : (
              <>
                <Pencil className="mr-2 h-4 w-4" /> Bearbeiten
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={deletePending}
            className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
            onClick={() => {
              if (window.confirm("Lead wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.")) {
                startDeleteTransition(async () => {
                  await deleteLead(lead.id)
                })
              }
            }}
          >
            {deletePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {isEditing ? (
        /* Edit Mode */
        <form action={handleSave}>
          <Card>
            <CardHeader>
              <CardTitle>Lead bearbeiten</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={lead.name}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Firma</Label>
                  <Input
                    id="company"
                    name="company"
                    defaultValue={lead.company || ""}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={lead.email || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    defaultValue={lead.phone || ""}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    name="address"
                    defaultValue={lead.address || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead_type">Typ</Label>
                  <select
                    id="lead_type"
                    name="lead_type"
                    defaultValue={lead.lead_type}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  >
                    {ALL_LEAD_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {LEAD_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (kommagetrennt)</Label>
                <Input
                  id="tags"
                  name="tags"
                  defaultValue={lead.tags?.join(", ") || ""}
                  placeholder="z.B. VIP, Stammgast, Presse"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact_person">Ansprechpartner</Label>
                  <Input
                    id="contact_person"
                    name="contact_person"
                    defaultValue={lead.contact_person || ""}
                    placeholder="z.B. Hans Müller"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_role">Rolle / Position</Label>
                  <Input
                    id="contact_role"
                    name="contact_role"
                    defaultValue={lead.contact_role || ""}
                    placeholder="z.B. Präsident"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="story">Story / Verbindung</Label>
                <Textarea
                  id="story"
                  name="story"
                  rows={3}
                  defaultValue={lead.story || ""}
                  placeholder="Warum ist dieser Lead relevant? Was ist die Connection?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trigger_points">Trigger-Punkte (kommagetrennt)</Label>
                <Input
                  id="trigger_points"
                  name="trigger_points"
                  defaultValue={lead.trigger_points?.join(", ") || ""}
                  placeholder="z.B. Vereinsessen, GV, Sommerfest"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperatur</Label>
                  <select
                    id="temperature"
                    name="temperature"
                    defaultValue={lead.temperature || "kalt"}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  >
                    <option value="kalt">Kalt</option>
                    <option value="warm">Warm</option>
                    <option value="heiss">Heiss</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="next_action">Nächste Aktion</Label>
                  <Input
                    id="next_action"
                    name="next_action"
                    defaultValue={lead.next_action || ""}
                    placeholder="z.B. Anrufen"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="next_action_date">Bis wann?</Label>
                  <Input
                    id="next_action_date"
                    name="next_action_date"
                    type="date"
                    defaultValue={lead.next_action_date || ""}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notizen</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  defaultValue={lead.notes || ""}
                  placeholder="Interne Notizen zum Lead..."
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    setError(null)
                  }}
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  className="bg-[#C5A572] hover:bg-[#A08050]"
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Speichern
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      ) : (
        /* View Mode */
        <>
          {/* Info Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Building className="h-5 w-5 text-[#C5A572]" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Typ</p>
                  <p className="font-medium capitalize">{LEAD_TYPE_LABELS[lead.lead_type as LeadType] || lead.lead_type}</p>
                </div>
              </CardContent>
            </Card>
            {lead.email && (
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <Mail className="h-5 w-5 text-[#C5A572]" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">E-Mail</p>
                    <a href={`mailto:${lead.email}`} className="font-medium text-[#C5A572] hover:underline">
                      {lead.email}
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}
            {lead.phone && (
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <Phone className="h-5 w-5 text-[#C5A572]" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Telefon</p>
                    <a href={`tel:${lead.phone}`} className="font-medium text-[#C5A572] hover:underline">
                      {lead.phone}
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}
            {lead.address && (
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <MapPin className="h-5 w-5 text-[#C5A572]" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Adresse</p>
                    <p className="font-medium">{lead.address}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Clock className="h-5 w-5 text-[#C5A572]" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Erstellt am</p>
                  <p className="font-medium">
                    {new Date(lead.created_at).toLocaleDateString("de-CH", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ansprechpartner + Temperatur */}
          {(lead.contact_person || lead.temperature) && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {lead.contact_person && (
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <User className="h-5 w-5 text-[#C5A572]" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Ansprechpartner</p>
                      <p className="font-medium">{lead.contact_person}</p>
                      {lead.contact_role && (
                        <p className="text-xs text-gray-400">{lead.contact_role}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              {lead.temperature && (
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <Flame className="h-5 w-5" style={{ color: LEAD_TEMPERATURE_COLORS[(lead.temperature as LeadTemperature) || "kalt"] }} />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Temperatur</p>
                      <Badge
                        className="text-[11px]"
                        style={{
                          backgroundColor: LEAD_TEMPERATURE_COLORS[(lead.temperature as LeadTemperature) || "kalt"],
                          color: "white",
                        }}
                      >
                        {LEAD_TEMPERATURE_LABELS[(lead.temperature as LeadTemperature) || "kalt"]}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
              {lead.next_action && (
                <Card className="border-l-4 border-l-[#C5A572]">
                  <CardContent className="flex items-center gap-3 p-4">
                    <Zap className="h-5 w-5 text-[#C5A572]" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Nächste Aktion</p>
                      <p className="font-medium text-sm">{lead.next_action}</p>
                      {lead.next_action_date && (
                        <p className="text-xs text-gray-400">
                          bis {new Date(lead.next_action_date).toLocaleDateString("de-CH", { day: "numeric", month: "short" })}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Story */}
          {lead.story && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500 dark:text-gray-400">Story / Verbindung</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{lead.story}</p>
              </CardContent>
            </Card>
          )}

          {/* Trigger-Punkte */}
          {lead.trigger_points && lead.trigger_points.length > 0 && (
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Trigger:</span>
              <div className="flex flex-wrap gap-1">
                {lead.trigger_points.map((tp: string) => (
                  <Badge key={tp} variant="outline" className="border-amber-300 text-amber-700 dark:text-amber-400">
                    {tp}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {lead.tags && lead.tags.length > 0 && (
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              <div className="flex flex-wrap gap-1">
                {lead.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Status + Notes */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                <LeadStatusSelect leadId={lead.id} currentStatus={status} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Notizen</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {lead.notes || "Keine Notizen vorhanden."}
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Verknuepfte Events */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-[#C5A572]" />
            Verknuepfte Events
          </CardTitle>
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEventPicker(!showEventPicker)}
              disabled={linkingEvent}
            >
              <Plus className="mr-1 h-4 w-4" />
              Event verknuepfen
            </Button>
            {showEventPicker && (
              <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-md border bg-white dark:bg-gray-800 shadow-lg dark:border-gray-700">
                <div className="max-h-64 overflow-y-auto p-1">
                  {availableEvents.length === 0 ? (
                    <p className="p-3 text-center text-sm text-gray-400 dark:text-gray-500">
                      Keine weiteren Events verfuegbar
                    </p>
                  ) : (
                    availableEvents.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => handleLinkEvent(event.id)}
                        className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                        disabled={linkingEvent}
                      >
                        <Badge
                          className="shrink-0 text-[10px]"
                          style={{
                            backgroundColor: EVENT_TYPE_COLORS[event.event_type as EventType],
                            color: "white",
                          }}
                        >
                          {EVENT_TYPE_LABELS[event.event_type as EventType]}
                        </Badge>
                        <span className="truncate font-medium">{event.title}</span>
                        <span className="ml-auto shrink-0 text-xs text-gray-400 dark:text-gray-500">
                          {new Date(event.start_date + "T00:00:00").toLocaleDateString("de-CH", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {linkedEvents.length > 0 ? (
            <div className="space-y-2">
              {linkedEvents.map((le) =>
                le.event ? (
                  <div
                    key={le.event_id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        className="text-[10px]"
                        style={{
                          backgroundColor: EVENT_TYPE_COLORS[le.event.event_type as EventType],
                          color: "white",
                        }}
                      >
                        {EVENT_TYPE_LABELS[le.event.event_type as EventType]}
                      </Badge>
                      <Link
                        href={`/kalender/${le.event.id}`}
                        className="font-medium text-[#2C2C2C] dark:text-gray-100 hover:text-[#C5A572] hover:underline"
                      >
                        {le.event.title}
                      </Link>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(le.event.start_date + "T00:00:00").toLocaleDateString("de-CH", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 dark:text-red-400 hover:text-red-700"
                      onClick={() => handleUnlinkEvent(le.event_id)}
                      disabled={linkingEvent}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="ml-1 hidden sm:inline">Entfernen</span>
                    </Button>
                  </div>
                ) : null
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Noch keine Events verknuepft.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Kontakthistorie — nach Durchläufen gruppiert */}
      {rounds.length > 0 ? (
        <div className="space-y-4">
          {rounds.map((round) => (
            <Card key={round.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <RefreshCw className="h-4 w-4 text-[#C5A572]" />
                    Durchlauf #{round.round_number}: {round.reason}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {round.outcome && (
                      <Badge
                        className="text-[10px]"
                        style={{
                          backgroundColor: LEAD_STATUS_COLORS[round.outcome as LeadStatus],
                          color: "white",
                        }}
                      >
                        {LEAD_STATUS_LABELS[round.outcome as LeadStatus]}
                      </Badge>
                    )}
                    {!round.ended_at && (
                      <Badge variant="outline" className="text-[10px] border-green-500 text-green-600">
                        Aktiv
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {new Date(round.started_at).toLocaleDateString("de-CH", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  {round.ended_at && (
                    <>
                      {" "}— {new Date(round.ended_at).toLocaleDateString("de-CH", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </>
                  )}
                  {round.started_member && ` · von ${round.started_member.name}`}
                </p>
              </CardHeader>
              <CardContent>
                {round.activities && round.activities.length > 0 ? (
                  <div className="space-y-3">
                    {round.activities
                      .sort(
                        (a, b) =>
                          new Date(b.contacted_at).getTime() -
                          new Date(a.contacted_at).getTime()
                      )
                      .map((activity) => (
                        <div
                          key={activity.id}
                          className="flex gap-3 border-l-2 border-[#C5A572] pl-4"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="secondary"
                                className="text-xs capitalize"
                              >
                                {activity.activity_type}
                              </Badge>
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                {new Date(activity.contacted_at).toLocaleDateString(
                                  "de-CH",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                              {activity.description}
                            </p>
                            {activity.contacted_member && (
                              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                von {activity.contacted_member.name}
                              </p>
                            )}
                            {activity.event && (
                              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                Event: {activity.event.title}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Noch keine Aktivitäten in diesem Durchlauf.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Kontakthistorie</CardTitle>
          </CardHeader>
          <CardContent>
            {lead.activities && lead.activities.length > 0 ? (
              <div className="space-y-4">
                {lead.activities
                  .sort(
                    (a, b) =>
                      new Date(b.contacted_at).getTime() -
                      new Date(a.contacted_at).getTime()
                  )
                  .map((activity) => (
                    <div
                      key={activity.id}
                      className="flex gap-3 border-l-2 border-[#C5A572] pl-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="text-xs capitalize"
                          >
                            {activity.activity_type}
                          </Badge>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(activity.contacted_at).toLocaleDateString(
                              "de-CH",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                          {activity.description}
                        </p>
                        {activity.contacted_member && (
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            von {activity.contacted_member.name}
                          </p>
                        )}
                        {activity.event && (
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            Event: {activity.event.title}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Noch keine Aktivitäten erfasst.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Activity Form */}
      <Card>
        <CardHeader>
          <CardTitle>Aktivität erfassen</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityForm leadId={lead.id} />
        </CardContent>
      </Card>

      {/* Neuer Durchlauf Dialog */}
      <Dialog
        open={showNewRound}
        onOpenChange={(open) => {
          if (!open) {
            setShowNewRound(false)
            setNewRoundReason("")
            setNewRoundMember("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuer Durchlauf starten</DialogTitle>
            <DialogDescription>
              {lead.name} wird auf <Badge className="text-[10px] bg-gray-500 text-white">Neu</Badge> zurückgesetzt.
              Der aktuelle Durchlauf wird abgeschlossen.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Grund für den neuen Durchlauf *</label>
              <DialogTextarea
                placeholder="z.B. Einladung zum Sommerfest, Kooperationsanfrage..."
                value={newRoundReason}
                onChange={(e) => setNewRoundReason(e.target.value)}
                rows={3}
              />
            </div>

            {teamMembers.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Wer startet den Durchlauf?</label>
                <div className="grid grid-cols-2 gap-2">
                  {teamMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => setNewRoundMember(member.id === newRoundMember ? "" : member.id)}
                      className={`flex items-center gap-2 rounded-lg border p-2 text-sm transition-colors ${
                        newRoundMember === member.id
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
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNewRound(false)
                setNewRoundReason("")
                setNewRoundMember("")
              }}
            >
              Abbrechen
            </Button>
            <Button
              className="bg-[#C5A572] hover:bg-[#A08050]"
              disabled={!newRoundReason.trim() || roundPending}
              onClick={() => {
                startRoundTransition(async () => {
                  const result = await startNewRound(lead.id, newRoundReason.trim(), newRoundMember || undefined)
                  if (result.success) {
                    setShowNewRound(false)
                    setNewRoundReason("")
                    setNewRoundMember("")
                    router.refresh()
                  }
                })
              }}
            >
              {roundPending ? "Wird gestartet..." : "Durchlauf starten"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
