"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, MapPin, Clock, Calendar, Pencil, Save, X, Loader2 } from "lucide-react"
import Link from "next/link"
import { updateEvent } from "@/lib/actions/events"
import { useRouter } from "next/navigation"
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS } from "@/lib/constants"
import { TaskList } from "@/components/kalender/task-list"
import type { EventType } from "@/types/database"

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

export function EventDetail({
  event,
  concepts,
  teamMembers,
}: {
  event: EventData
  concepts: ConceptOption[]
  teamMembers: TeamMemberOption[]
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

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
  const isInLeadTime = now >= warningDate && now < eventDate

  function handleSave(formData: FormData) {
    startTransition(async () => {
      await updateEvent(event.id, formData)
      setIsEditing(false)
      router.refresh()
    })
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
            <h1 className="text-3xl font-bold text-[#2C2C2C]">{event.title}</h1>
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
            <p className="mt-1 text-gray-500">{event.description}</p>
          )}
        </div>
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

      {/* Warning Banner */}
      {isInLeadTime && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4">
          <p className="font-medium text-yellow-800">
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

              <div className="space-y-2">
                <Label htmlFor="lead_time_days">Vorlaufzeit (Tage)</Label>
                <Input
                  id="lead_time_days"
                  name="lead_time_days"
                  type="number"
                  defaultValue={event.lead_time_days || 28}
                  min={0}
                />
                <p className="text-xs text-gray-500">
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
                  <p className="text-xs text-gray-500">Datum</p>
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
                    <p className="text-xs text-gray-500">Uhrzeit</p>
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
                  <p className="text-xs text-gray-500">Ort</p>
                  <p className="font-medium">
                    {event.location || "Dakota Air Lounge"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Concept Link */}
          {event.concept && (
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs text-gray-500">Verkn\u00fcpftes Konzept</p>
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
        </>
      )}

      {/* Tasks (always visible) */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <TaskList eventId={event.id} tasks={(event.tasks as any) || []} teamMembers={teamMembers} />
    </div>
  )
}
