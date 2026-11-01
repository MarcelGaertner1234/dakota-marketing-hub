export const dynamic = "force-dynamic"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { getLeadsWithRounds } from "@/lib/actions/leads"
import { getTeamMembers } from "@/lib/actions/team"
import { LeadsTabs } from "@/components/leads/leads-tabs"

export default async function LeadsPage() {
  const [leadsWithRounds, teamMembers] = await Promise.all([getLeadsWithRounds(), getTeamMembers()])
  // Kanban braucht dieselben Leads, nur schlanker (keine zweite Abfrage)
  const leads = leadsWithRounds
    .map(({ id, name, company, lead_type, status, tags, temperature, next_action, next_action_date }) => ({ id, name, company, lead_type, status, tags, temperature, next_action, next_action_date }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[#2C2C2C] dark:text-gray-100">Leads</h1>
          <p className="text-gray-500 dark:text-gray-400">Kontakte verwalten und nachverfolgen</p>
        </div>
        <Link href="/leads/neu">
          <Button className="bg-[#C5A572] hover:bg-[#A08050]">
            <Plus className="mr-2 h-4 w-4" />
            Neuer Lead
          </Button>
        </Link>
      </div>

      <LeadsTabs
        leads={leads || []}
        leadsWithRounds={leadsWithRounds || []}
        teamMembers={teamMembers || []}
      />
    </div>
  )
}
