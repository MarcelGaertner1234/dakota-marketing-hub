import { getLead, getLeadEvents, getLeadRounds } from "@/lib/actions/leads"
import { getEventOptions } from "@/lib/actions/tasks"
import { todayZurich, addDays } from "@/lib/utils/today"
import { getTeamMembers } from "@/lib/actions/team"
import { notFound } from "next/navigation"
import { LeadDetail } from "./lead-detail"

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ leadId: string }>
}) {
  const { leadId } = await params

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [lead, linkedEvents, allEvents, rounds, teamMembers]: [any, any[], any[], any[], any[]] = await Promise.all([
    getLead(leadId).catch(() => null),
    getLeadEvents(leadId).catch(() => []),
    getEventOptions(addDays(todayZurich(), -365)).catch(() => []),
    getLeadRounds(leadId).catch(() => []),
    getTeamMembers().catch(() => []),
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
      rounds={rounds || []}
      teamMembers={teamMembers || []}
    />
  )
}
