"use client"

/* eslint-disable @next/next/no-img-element */

import { useState, useTransition, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, MapPin, Clock, Calendar, Pencil, Save, X, Loader2, Users, Repeat, Trash2, Upload, ImageIcon, Plus } from "lucide-react"
import Link from "next/link"
import { updateEvent, deleteEvent } from "@/lib/actions/events"
import { useRouter } from "next/navigation"
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from "@/lib/constants"
import { TaskList } from "@/components/kalender/task-list"
import { RecurrenceFields } from "@/components/kalender/recurrence-fields"
import type { EventType, LeadStatus, RecurrenceType } from "@/types/database"

const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  none: "Keine",
  daily: "Täglich",
  weekly: "Wöchentlich",
  biweekly: "Alle 2 Wochen",
  monthly: "Monatlich",
  yearly: "Jährlich",
}

interface StorageFile {
  name: string
  path: string
  url: string
}

interface ConceptOption {
  id: string
  name: string
}

interface TeamMemberOption {
  id: string
  name: string
  color: string
}

interface EventData {
  id: string
  title: string
  description: string | null
  event_type: string
  start_date: string
  end_date: string | null
  start_time: string | null
  end_time: string | null
  location: string | null
  lead_time_days: number
  concept_id: string | null
  recurrence?: RecurrenceType | null
  recurrence_end_date?: string | null
  parent_event_id?: string | null
  concept?: { id: string; name: string } | null
  tasks?: Array<{
    id: string
    title: string
    status: string
    priority: string
    due_date: string | null
    assigned_to: string | null
    assigned_member?: { id: string; name: string; color: string } | null
    [key: string]: unknown
  }>
}

interface LinkedLead {
  lead_id: string
  event_id: string
  status: string | null
  notes: string | null
  lead: { id: string; name: string; company: string | null; status: string; lead_type: string } | null
}

export function EventDetail({
  event,
  concepts,
  teamMembers,
  linkedLeads = [],
}: {
  event: EventData
  concepts: ConceptOption[]
  teamMembers: TeamMemberOption[]
  linkedLeads?: LinkedLead[]
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [eventImages, setEventImages] = useState<StorageFile[]>([])
  const [deletingPath, setDeletingPath] = useState<string | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const folder = `event-${event.id.substring(0, 8)}`

  const leadTimeDays = event.lead_time_days || 28

  function parseDateLocal(dateStr: string): Date {
    const [y, m, d] = dateStr.split("-").map(Number)
    return new Date(y, m - 1, d)
  }

  const eventDate = parseDateLocal(event.start_date)
  const warningDate = new Date(eventDate)
  warningDate.setDate(warningDate.getDate() - leadTimeDays)
  const now = new Date()
  const daysUntilEvent = Math.ceil(
    (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )
  const isInLeadTime = now >= warningDate && (now < eventDate || now.toDateString() === eventDate.toDateString())

  function handleSave(formData: FormData) {
    startTransition(async () => {
      await updateEvent(event.id, formData)
      setIsEditing(false)
      router.refresh()
    })
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteEvent(event.id)
      router.push("/kalender")
    })
  }

  const loadImages = useCallback(async () => {
    try {
      const res = await fetch(`/api/storage?bucket=event-images&folder=${folder}`)
      const data = await res.json()
      if (data.files) setEventImages(data.files)
    } catch { /* ignore */ }
  }, [folder])

  useEffect(() => { loadImages() }, [loadImages])

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    setIsUploading(true)
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.set("file", file)
        fd.set("bucket", "event-images")
        fd.set("folder", folder)
        await fetch("/api/upload", { method: "POST", body: fd })
      }
      await loadImages()
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function handleDeleteImage(file: StorageFile) {
    setDeletingPath(file.path)
    try {
      await fetch("/api/storage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket: "event-images", path: file.path }),
      })
      await loadImages()
    } finally {
      setDeletingPath(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/kalender">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-[#2C2C2C] dark:text-gray-100">{event.title}</h1>
            <Badge
              style={{
                backgroundColor:
                  EVENT_TYPE_COLORS[event.event_type as keyof typeof EVENT_TYPE_COLORS],
                color: "white",
              }}
            >
              {EVENT_TYPE_LABELS[event.event_type as keyof typeof EVENT_TYPE_LABELS]}
            </Badge>
          </div>
          {!isEditing && event.description && (
            <p className="mt-1 text-gray-500 dark:text-gray-400">{event.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          {!isEditing && (
            <Button
              variant="outline"
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Löschen
            </Button>
          )}
          <Button
            variant={isEditing ? "outline" : "default"}
            className={isEditing ? "" : "bg-[#C5A572] hover:bg-[#A08050]"}
            onClick={() => setIsEditing(!isEditing)}
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
        </div>
      </div>

      {/* Warning Banner */}
      {isInLeadTime && (
        <div className="rounded-lg border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950/30 p-4">
          <p className="font-medium text-yellow-800 dark:text-yellow-300">
            Noch {Math.max(0, daysUntilEvent)} Tage bis zum Event — Vorbereitungen
            starten!
          </p>
        </div>
      )}

      {isEditing ? (
        /* Edit Mode */
        <form action={handleSave}>
          <Card>
            <CardHeader>
              <CardTitle>Event bearbeiten</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Titel *</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={event.title}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event_type">Typ</Label>
                  <select
                    id="event_type"
                    name="event_type"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    defaultValue={event.event_type}
                  >
                    <option value="own_event">Eigenes Event</option>
                    <option value="local_event">Lokales Event</option>
                    <option value="concept_event">Konzept-Event</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={3}
                  defaultValue={event.description || ""}
                  placeholder="Was ist geplant?"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Startdatum *</Label>
                  <Input
                    id="start_date"
                    name="start_date"
                    type="date"
                    required
                    defaultValue={event.start_date}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_time">Startzeit</Label>
                  <Input
                    id="start_time"
                    name="start_time"
                    type="time"
                    defaultValue={event.start_time?.slice(0, 5) || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">Endzeit</Label>
                  <Input
                    id="end_time"
                    name="end_time"
                    type="time"
                    defaultValue={event.end_time?.slice(0, 5) || ""}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="end_date">Enddatum</Label>
                  <Input
                    id="end_date"
                    name="end_date"
                    type="date"
                    defaultValue={event.end_date || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Ort</Label>
                  <Input
                    id="location"
                    name="location"
                    defaultValue={event.location || "Dakota Air Lounge"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="concept_id">Konzept</Label>
                  <select
                    id="concept_id"
                    name="concept_id"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    defaultValue={event.concept_id || ""}
                  >
                    <option value="">Kein Konzept</option>
                    {concepts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Wiederholung */}
              <RecurrenceFields
                defaultRecurrence={(event.recurrence as RecurrenceType) || "none"}
                defaultEndDate={event.recurrence_end_date}
              />

              <div className="space-y-2">
                <Label htmlFor="lead_time_days">Vorlaufzeit (Tage)</Label>
                <Input
                  id="lead_time_days"
                  name="lead_time_days"
                  type="number"
                  defaultValue={event.lead_time_days || 28}
                  min={0}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Wie viele Tage vorher soll eine Erinnerung erscheinen?
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
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
          {/* Event Info */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Calendar className="h-5 w-5 text-[#C5A572]" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Datum</p>
                  <p className="font-medium">
                    {parseDateLocal(event.start_date).toLocaleDateString("de-CH", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
            {(event.start_time || event.end_time) && (
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <Clock className="h-5 w-5 text-[#C5A572]" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Uhrzeit</p>
                    <p className="font-medium">
                      {event.start_time?.slice(0, 5) || "\u2014"}
                      {event.end_time && ` \u2013 ${event.end_time.slice(0, 5)}`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <MapPin className="h-5 w-5 text-[#C5A572]" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Ort</p>
                  <p className="font-medium">
                    {event.location || "Dakota Air Lounge"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recurrence Info */}
          {event.recurrence && event.recurrence !== "none" && (
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Repeat className="h-5 w-5 text-[#C5A572]" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Wiederholung</p>
                  <p className="font-medium">
                    {RECURRENCE_LABELS[event.recurrence]}
                    {event.recurrence_end_date && (
                      <span className="text-gray-500 dark:text-gray-400">
                        {" "}bis{" "}
                        {new Date(event.recurrence_end_date + "T00:00:00").toLocaleDateString("de-CH", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Child Event Badge */}
          {event.parent_event_id && (
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Repeat className="h-5 w-5 text-[#C5A572]" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Serie</p>
                    <p className="font-medium">Teil einer wiederkehrenden Serie</p>
                  </div>
                </div>
                <Link href={`/kalender/${event.parent_event_id}`}>
                  <Button variant="outline" size="sm">
                    Ursprungsevent ansehen
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Concept Link */}
          {event.concept && (
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Verkn\u00fcpftes Konzept</p>
                  <p className="font-medium">{event.concept.name}</p>
                </div>
                <Link href={`/konzepte/${event.concept.id}`}>
                  <Button variant="outline" size="sm">
                    Konzept ansehen
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Event-Bilder */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Event-Bilder ({eventImages.length})
                </div>
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                {isUploading ? "Hochladen..." : "Bild hinzufügen"}
              </Button>
            </CardHeader>
            <CardContent>
              {eventImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {eventImages.map((file) => (
                    <div key={file.path} className="group relative">
                      <div className="relative overflow-hidden rounded-lg border cursor-pointer" onClick={() => setLightboxUrl(file.url)}>
                        <img src={file.url} alt={file.name} className="h-36 w-full object-cover" />
                        <div className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-black/50 via-transparent to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDeleteImage(file) }}
                            disabled={deletingPath === file.path}
                            className="rounded bg-red-500/90 p-1.5 text-white hover:bg-red-600"
                          >
                            {deletingPath === file.path ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-36 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 transition-colors hover:border-[#C5A572] hover:bg-[#C5A572]/5"
                  >
                    <Upload className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">Hinzufügen</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 transition-colors hover:border-[#C5A572] hover:bg-[#C5A572]/5"
                >
                  {isUploading ? <Loader2 className="h-6 w-6 animate-spin text-[#C5A572]" /> : <ImageIcon className="h-6 w-6 text-gray-400 dark:text-gray-500" />}
                  <span className="text-sm text-gray-500 dark:text-gray-400">{isUploading ? "Hochladen..." : "Event-Bilder hochladen"}</span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
            </CardContent>
          </Card>
        </>
      )}

      {/* Verknuepfte Leads */}
      {linkedLeads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#C5A572]" />
              Verknuepfte Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {linkedLeads.map((ll) =>
                ll.lead ? (
                  <div
                    key={ll.lead_id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        className="text-[10px]"
                        style={{
                          backgroundColor: LEAD_STATUS_COLORS[ll.lead.status as LeadStatus],
                          color: "white",
                        }}
                      >
                        {LEAD_STATUS_LABELS[ll.lead.status as LeadStatus]}
                      </Badge>
                      <Link
                        href={`/leads/${ll.lead.id}`}
                        className="font-medium text-[#2C2C2C] dark:text-gray-100 hover:text-[#C5A572] hover:underline"
                      >
                        {ll.lead.name}
                      </Link>
                      {ll.lead.company && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">{ll.lead.company}</span>
                      )}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tasks (always visible) */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <TaskList eventId={event.id} tasks={(event.tasks as any) || []} teamMembers={teamMembers} />

      {/* Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 cursor-pointer" onClick={() => setLightboxUrl(null)}>
          <button type="button" onClick={() => setLightboxUrl(null)} className="absolute top-4 right-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/40 transition-colors">
            <X className="h-6 w-6" />
          </button>
          <img src={lightboxUrl} alt="Vergrössert" className="max-h-[95vh] max-w-[95vw] object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg bg-white dark:bg-gray-900 p-6 shadow-xl max-w-sm mx-4">
            <h3 className="text-lg font-bold text-[#2C2C2C] dark:text-gray-100">Event löschen?</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              &quot;{event.title}&quot; wird unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isPending}>
                Abbrechen
              </Button>
              <Button
                className="bg-red-500 hover:bg-red-600 text-white"
                onClick={handleDelete}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Löschen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
