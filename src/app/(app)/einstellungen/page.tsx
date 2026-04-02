import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getTeamMembers } from "@/lib/actions/concepts"

export default async function EinstellungenPage() {
  const team = await getTeamMembers()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#2C2C2C]">Einstellungen</h1>
        <p className="text-gray-500">Team und Konfiguration verwalten</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team-Mitglieder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {team?.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white font-bold"
                  style={{ backgroundColor: m.color }}
                >
                  {m.name[0]}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{m.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{m.role}</p>
                </div>
                <Badge variant="outline" className="capitalize">{m.role}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Supabase Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-green-700">Verbunden</span>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Projekt: Dakota | Region: Europe
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
