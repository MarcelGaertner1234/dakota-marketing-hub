"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createEvent } from "@/lib/actions/events"
import { RecurrenceFields } from "@/components/kalender/recurrence-fields"
import Link from "next/link"

interface EventCreateFormProps {
  concepts: { id: string; name: string }[]
  prefillDate?: string
}

export function EventCreateForm({ concepts, prefillDate }: EventCreateFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        await createEvent(formData)
        router.push("/kalender")
      } catch (e) {
        setError(e instanceof Error ? e.message : "Event konnte nicht erstellt werden.")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event-Details</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}
        <form action={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Titel *</Label>
              <Input id="title" name="title" required placeholder="z.B. Afterwork Freitag" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event_type">Typ</Label>
              <select
                id="event_type"
                name="event_type"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                defaultValue="own_event"
              >
                <option value="own_event">Eigenes Event</option>
                <option value="local_event">Lokales Event</option>
                <option value="concept_event">Konzept-Event</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea id="description" name="description" rows={3} placeholder="Was ist geplant?" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="start_date">Datum *</Label>
              <Input id="start_date" name="start_date" type="date" required defaultValue={prefillDate || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_time">Startzeit</Label>
              <Input id="start_time" name="start_time" type="time" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">Endzeit</Label>
              <Input id="end_time" name="end_time" type="time" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="location">Ort</Label>
              <Input id="location" name="location" defaultValue="Dakota Air Lounge" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="concept_id">Konzept (optional)</Label>
              <select
                id="concept_id"
                name="concept_id"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="">Kein Konzept</option>
                {concepts?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Wiederholung */}
          <RecurrenceFields />

          <div className="space-y-2">
            <Label htmlFor="lead_time_days">Vorlaufzeit (Tage)</Label>
            <Input
              id="lead_time_days"
              name="lead_time_days"
              type="number"
              defaultValue={28}
              min={0}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Wie viele Tage vorher soll eine Erinnerung erscheinen?
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Link href="/kalender">
              <Button variant="outline">Abbrechen</Button>
            </Link>
            <Button type="submit" disabled={isPending} className="bg-[#C5A572] hover:bg-[#A08050]">
              {isPending ? "Wird erstellt..." : "Event erstellen"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
