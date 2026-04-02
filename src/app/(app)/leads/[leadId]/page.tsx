import { getLead, getLeadEvents } from "@/lib/actions/leads"
import { getEvents } from "@/lib/actions/events"
import { notFound } from "next/navigation"
import { LeadDetail } from "./lead-detail"

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ leadId: string }>
}) {
  const { leadId } = await params

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [lead, linkedEvents, allEvents]: [any, any[], any[]] = await Promise.all([
    getLead(leadId).catch(() => null),
    getLeadEvents(leadId).catch(() => []),
    getEvents().catch(() => []),
  ])
  if (!lead) notFound()

  return (
    <LeadDetail
      lead={lead}
      linkedEvents={linkedEvents || []}
      allEvents={(allEvents || []).map((e) => ({
        id: e.id,
        title: e.title,
        start_date: e.start_date,
        event_type: e.event_type,
      }))}
    />
  )
}
