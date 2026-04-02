import { getEvent } from "@/lib/actions/events"
import { getConcepts, getTeamMembers } from "@/lib/actions/concepts"
import { EventDetail } from "./event-detail"
import { notFound } from "next/navigation"

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [event, concepts, teamMembers]: [any, any[], any[]] = await Promise.all([
    getEvent(eventId).catch(() => null),
    getConcepts().catch(() => []),
    getTeamMembers().catch(() => []),
  ])
  if (!event) notFound()

  return (
    <EventDetail
      event={event}
      concepts={(concepts || []).map((c) => ({ id: c.id, name: c.name }))}
      teamMembers={(teamMembers || []).map((m: { id: string; name: string; color: string }) => ({ id: m.id, name: m.name, color: m.color }))}
    />
  )
}
