import { getEvent } from "@/lib/actions/events"
import { getConcepts, getTeamMembers } from "@/lib/actions/concepts"
import { getEventLeads } from "@/lib/actions/leads"
import { EventDetail } from "./event-detail"
import { notFound } from "next/navigation"

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [event, concepts, teamMembers, linkedLeads]: [any, any[], any[], any[]] = await Promise.all([
    getEvent(eventId).catch(() => null),
    getConcepts().catch(() => []),
    getTeamMembers().catch(() => []),
    getEventLeads(eventId).catch(() => []),
  ])
  if (!event) notFound()

  return (
    <EventDetail
      event={event}
      concepts={(concepts || []).map((c) => ({ id: c.id, name: c.name }))}
      teamMembers={(teamMembers || []).map((m: { id: string; name: string; color: string }) => ({ id: m.id, name: m.name, color: m.color }))}
      linkedLeads={linkedLeads || []}
    />
  )
}
