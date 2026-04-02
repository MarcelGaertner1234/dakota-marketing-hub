import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, Clock, Calendar } from "lucide-react"
import Link from "next/link"
import { getEvent } from "@/lib/actions/events"
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS, TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from "@/lib/constants"
import { TaskList } from "@/components/kalender/task-list"
import { notFound } from "next/navigation"

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const event: any = await getEvent(eventId).catch(() => null)
  if (!event) notFound()

  /** Parse a date-only string (YYYY-MM-DD) as local midnight, avoiding UTC off-by-one. */
  function parseDateLocal(dateStr: string): Date {
    const [y, m, d] = dateStr.split("-").map(Number)
    return new Date(y, m - 1, d)
  }

  const leadTimeDays = event.lead_time_days || 28
  const eventDate = parseDateLocal(event.start_date)
  const warningDate = new Date(eventDate)
  warningDate.setDate(warningDate.getDate() - leadTimeDays)
  const now = new Date()
  const daysUntilEvent = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const isInLeadTime = now >= warningDate && now < eventDate

  return (
    <div className="space-y-6">
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
                backgroundColor: EVENT_TYPE_COLORS[event.event_type as keyof typeof EVENT_TYPE_COLORS],
                color: "white",
              }}
            >
              {EVENT_TYPE_LABELS[event.event_type as keyof typeof EVENT_TYPE_LABELS]}
            </Badge>
          </div>
          {event.description && (
            <p className="mt-1 text-gray-500">{event.description}</p>
          )}
        </div>
      </div>

      {/* Warning Banner */}
      {isInLeadTime && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4">
          <p className="font-medium text-yellow-800">
            Noch {Math.max(0, daysUntilEvent)} Tage bis zum Event — Vorbereitungen starten!
          </p>
        </div>
      )}

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
                  {event.start_time?.slice(0, 5) || "—"}
                  {event.end_time && ` – ${event.end_time.slice(0, 5)}`}
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
              <p className="font-medium">{event.location || "Dakota Air Lounge"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Concept Link */}
      {event.concept && (
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs text-gray-500">Verknüpftes Konzept</p>
              <p className="font-medium">{event.concept.name}</p>
            </div>
            <Link href={`/konzepte/${event.concept.id}`}>
              <Button variant="outline" size="sm">Konzept ansehen</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Tasks */}
      <TaskList eventId={eventId} tasks={event.tasks || []} />
    </div>
  )
}
