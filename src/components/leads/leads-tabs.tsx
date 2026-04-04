"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { KanbanBoard } from "./kanban-board"
import { LeadsDatabase } from "./leads-database"
import { LayoutGrid, Database } from "lucide-react"

interface LeadForKanban {
  id: string
  name: string
  company: string | null
  lead_type: string
  status: string
  tags: string[] | null
}

interface TeamMember {
  id: string
  name: string
  color: string
}

interface LeadWithRounds {
  id: string
  name: string
  company: string | null
  lead_type: string
  email: string | null
  phone: string | null
  status: string
  tags: string[] | null
  contact_person: string | null
  contact_role: string | null
  temperature: string
  next_action: string | null
  next_action_date: string | null
  created_at: string
  updated_at: string
  round_count: number
  current_round: {
    id: string
    round_number: number
    reason: string
    started_at: string
    ended_at: string | null
    outcome: string | null
  } | null
  last_activity: {
    activity_type: string
    contacted_at: string
  } | null
}

export function LeadsTabs({
  leads,
  leadsWithRounds,
  teamMembers,
}: {
  leads: LeadForKanban[]
  leadsWithRounds: LeadWithRounds[]
  teamMembers: TeamMember[]
}) {
  return (
    <Tabs defaultValue="kanban">
      <TabsList variant="line">
        <TabsTrigger value="kanban" className="gap-1.5">
          <LayoutGrid className="h-4 w-4" />
          Kanban
        </TabsTrigger>
        <TabsTrigger value="database" className="gap-1.5">
          <Database className="h-4 w-4" />
          Datenbank
        </TabsTrigger>
      </TabsList>

      <TabsContent value="kanban">
        <KanbanBoard initialLeads={leads} teamMembers={teamMembers} />
      </TabsContent>

      <TabsContent value="database">
        <LeadsDatabase leads={leadsWithRounds} teamMembers={teamMembers} />
      </TabsContent>
    </Tabs>
  )
}
