export const dynamic = "force-dynamic"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, Lightbulb, Star, CheckCircle2, Clock, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"
import { getReviewStats } from "@/lib/actions/reviews"
import { getTeamMembers } from "@/lib/actions/team"
import { OpenTasks } from "@/components/dashboard/open-tasks"
import { UpcomingEvents } from "@/components/dashboard/upcoming-events"
import { OverdueLeads } from "@/components/dashboard/overdue-leads"

export default async function DashboardPage() {
  const supabase = createServerClient()

  // Parallel data fetching
  const now = new Date().toISOString().split("T")[0]
  const monthEnd = new Date()
  monthEnd.setMonth(monthEnd.getMonth() + 1)
  const monthEndStr = monthEnd.toISOString().split("T")[0]

  const [eventsRes, leadsRes, conceptsRes, reviewStats, tasksRes, upcomingRes, overdueRes, teamMembers] =
    await Promise.all([
      supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .gte("start_date", now)
        .lte("start_date", monthEndStr),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .not("status", "eq", "verloren"),
      supabase
        .from("concepts")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      getReviewStats(),
      supabase
        .from("tasks")
        .select("*, assigned_member:team_members!tasks_assigned_to_fkey(name, color), event:events!tasks_event_id_fkey(id, title)")
        .in("status", ["todo", "in_progress"])
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(30),
      supabase
        .from("events")
        .select("id, title, start_date, start_time, event_type")
        .gte("start_date", now)
        .order("start_date")
        .limit(20),
      supabase
        .from("leads")
        .select("id, name, contact_person, temperature, status, next_action, next_action_date")
        .not("next_action", "is", null)
        .not("next_action_date", "is", null)
        .lte("next_action_date", new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0])
        .not("status", "eq", "verloren")
        .order("next_action_date", { ascending: true })
        .limit(15),
      getTeamMembers(),
    ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#2C2C2C] dark:text-gray-100">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Dakota Air Lounge — Marketing Hub</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-[#C5A572]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Events diesen Monat</CardTitle>
            <Calendar className="h-4 w-4 text-[#C5A572]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventsRes.count ?? 0}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Aktive Leads</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadsRes.count ?? 0}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Konzepte</CardTitle>
            <Lightbulb className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conceptsRes.count ?? 0}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Bewertungen</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviewStats.total}</div>
            {reviewStats.total > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Ø {(((reviewStats.food || 0) + (reviewStats.ambience || 0) + (reviewStats.service || 0)) / 3).toFixed(1)} / 5
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Two columns */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-[#C5A572]" />
              Nächste Events
              {(upcomingRes.data?.length ?? 0) > 0 && (
                <span className="text-sm font-normal text-gray-400">({upcomingRes.data?.length})</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UpcomingEvents events={upcomingRes.data ?? []} />
          </CardContent>
        </Card>

        {/* Open Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Offene Aufgaben
              {(tasksRes.data?.length ?? 0) > 0 && (
                <span className="text-sm font-normal text-gray-400">({tasksRes.data?.length})</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OpenTasks tasks={tasksRes.data ?? []} teamMembers={teamMembers ?? []} />
          </CardContent>
        </Card>
      </div>

      {/* Overdue Lead Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Lead-Aktionen
            {(overdueRes.data?.length ?? 0) > 0 && (
              <Badge className="bg-red-500 text-white text-xs">{overdueRes.data?.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OverdueLeads
            leads={(overdueRes.data ?? []).map((lead) => ({
              ...lead,
              next_action: lead.next_action!,
              next_action_date: lead.next_action_date!,
              days_overdue: Math.floor((Date.now() - new Date(lead.next_action_date + "T00:00:00").getTime()) / 86400000),
            }))}
          />
        </CardContent>
      </Card>
    </div>
  )
}
