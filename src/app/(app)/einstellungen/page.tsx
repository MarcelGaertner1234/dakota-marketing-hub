export const dynamic = "force-dynamic"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getTeamMembers } from "@/lib/actions/team"
import TeamSettings from "./team-settings"

export default async function EinstellungenPage() {
  const team = await getTeamMembers()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#2C2C2C] dark:text-gray-100">Einstellungen</h1>
        <p className="text-gray-500 dark:text-gray-400">Team und Konfiguration verwalten</p>
      </div>

      <TeamSettings team={team ?? []} />

      <Card>
        <CardHeader>
          <CardTitle>Supabase Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">Verbunden</span>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Projekt: Dakota | Region: Europe
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
