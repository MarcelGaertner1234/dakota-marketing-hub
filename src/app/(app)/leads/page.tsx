export const dynamic = "force-dynamic"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { getLeads, getLeadsWithRounds } from "@/lib/actions/leads"
import { getTeamMembers } from "@/lib/actions/team"
import { LeadsTabs } from "@/components/leads/leads-tabs"

export default async function LeadsPage() {
  const [leads, leadsWithRounds, teamMembers] = await Promise.all([
    getLeads(),
    getLeadsWithRounds(),
    getTeamMembers(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
