export const dynamic = "force-dynamic"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, Lightbulb, Star, CheckCircle2, Clock } from "lucide-react"
import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from "@/lib/constants"
import { getReviewStats } from "@/lib/actions/reviews"
import { OpenTasks } from "@/components/dashboard/open-tasks"

export default async function DashboardPage() {
  const supabase = createServerClient()

  // Parallel data fetching
  const now = new Date().toISOString().split("T")[0]
  const monthEnd = new Date()
  monthEnd.setMonth(monthEnd.getMonth() + 1)
  const monthEndStr = monthEnd.toISOString().split("T")[0]

  const [eventsRes, leadsRes, conceptsRes, reviewStats, tasksRes, upcomingRes] =
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
        .limit(5),
      supabase
        .from("events")
        .select("*")
        .gte("start_date", now)
        .order("start_date")
        .limit(5),
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
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingRes.data && upcomingRes.data.length > 0 ? (
              upcomingRes.data.map((event) => (
                <Link key={event.id} href={`/kalender/${event.id}`}>
                  <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: EVENT_TYPE_COLORS[event.event_type as keyof typeof EVENT_TYPE_COLORS] || "#6B7280" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(event.start_date).toLocaleDateString("de-CH", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                        {event.start_time && ` · ${event.start_time.slice(0, 5)}`}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {EVENT_TYPE_LABELS[event.event_type as keyof typeof EVENT_TYPE_LABELS] || event.event_type}
                    </Badge>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                Keine anstehenden Events.{" "}
                <Link href="/kalender/neu" className="text-[#C5A572] hover:underline">
                  Event erstellen
                </Link>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Open Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Offene Aufgaben
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OpenTasks tasks={tasksRes.data ?? []} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
