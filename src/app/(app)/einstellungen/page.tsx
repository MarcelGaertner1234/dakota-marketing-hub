import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const TEAM = [
  { name: "Marcel", role: "Admin", color: "#C5A572" },
  { name: "Thomas", role: "Manager", color: "#3B82F6" },
  { name: "Vanessa", role: "Manager", color: "#8B5CF6" },
  { name: "Antonella", role: "Mitglied", color: "#EF4444" },
]

export default function EinstellungenPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#2C2C2C]">Einstellungen</h1>
        <p className="text-gray-500">Team und Konfiguration verwalten</p>
      </div>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle>Team-Mitglieder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {TEAM.map((m) => (
              <div
                key={m.name}
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
                  <p className="text-xs text-gray-500">{m.role}</p>
                </div>
                <Badge variant="outline">{m.role}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Supabase Connection */}
      <Card>
        <CardHeader>
          <CardTitle>Supabase Verbindung</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Erstelle ein Supabase-Projekt und trage die URL + Anon Key in{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
              .env.local
            </code>{" "}
            ein. Führe dann das SQL-Schema aus{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
              supabase/migrations/001_initial_schema.sql
            </code>{" "}
            im Supabase SQL Editor aus.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
