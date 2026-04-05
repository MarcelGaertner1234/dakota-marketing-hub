import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createEvent } from "@/lib/actions/events"
import { getConcepts } from "@/lib/actions/concepts"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { RecurrenceFields } from "@/components/kalender/recurrence-fields"

export default async function NeuesEventPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const { date: prefillDate } = await searchParams
  const concepts = await getConcepts()

  async function handleCreate(formData: FormData) {
    "use server"
    try {
      await createEvent(formData)
    } catch (e) {
      // Return without redirect - user stays on form
      return
    }
    redirect("/kalender")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/kalender">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-[#2C2C2C] dark:text-gray-100">Neues Event</h1>
          <p className="text-gray-500 dark:text-gray-400">Event zum Marketing-Kalender hinzufügen</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event-Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleCreate} className="space-y-4">
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
              <Button type="submit" className="bg-[#C5A572] hover:bg-[#A08050]">
                Event erstellen
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
