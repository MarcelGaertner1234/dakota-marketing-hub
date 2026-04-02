import { getLead } from "@/lib/actions/leads"
import { notFound } from "next/navigation"
import { LeadDetail } from "./lead-detail"

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ leadId: string }>
}) {
  const { leadId } = await params

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lead: any = await getLead(leadId).catch(() => null)
  if (!lead) notFound()

  return <LeadDetail lead={lead} />
}
