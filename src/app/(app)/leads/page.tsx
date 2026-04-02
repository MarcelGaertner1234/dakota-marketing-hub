import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Users } from "lucide-react"
import Link from "next/link"
import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from "@/lib/constants"
import type { LeadStatus } from "@/types/database"

const KANBAN_COLUMNS: LeadStatus[] = [
  "neu",
  "kontaktiert",
  "interessiert",
  "gebucht",
  "nachfassen",
]

// Demo leads
const DEMO_LEADS = [
  { name: "Turnverein Meiringen", type: "verein", status: "neu" as LeadStatus },
  { name: "Sportclub Hasliberg", type: "verein", status: "neu" as LeadStatus },
  { name: "Restaurant Supplies AG", type: "firma", status: "kontaktiert" as LeadStatus },
  { name: "Familie Brunner", type: "privatperson", status: "interessiert" as LeadStatus },
  { name: "Biker Club Berner Oberland", type: "verein", status: "kontaktiert" as LeadStatus },
]

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2C2C2C]">Leads</h1>
          <p className="text-gray-500">Kontakte verwalten und nachverfolgen</p>
        </div>
        <Link href="/leads/neu">
          <Button className="bg-[#C5A572] hover:bg-[#A08050]">
            <Plus className="mr-2 h-4 w-4" />
            Neuer Lead
          </Button>
        </Link>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((status) => {
          const leads = DEMO_LEADS.filter((l) => l.status === status)
          return (
            <div key={status} className="min-w-[250px] flex-1">
              <div className="mb-3 flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: LEAD_STATUS_COLORS[status] }}
                />
                <h3 className="text-sm font-semibold text-gray-700">
                  {LEAD_STATUS_LABELS[status]}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {leads.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {leads.map((lead, i) => (
                  <Card
                    key={i}
                    className="cursor-pointer transition-shadow hover:shadow-md"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{lead.name}</p>
                          <p className="text-xs text-gray-500 capitalize">
                            {lead.type}
                          </p>
                        </div>
                        <Users className="h-4 w-4 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {leads.length === 0 && (
                  <div className="rounded-lg border border-dashed p-4 text-center text-xs text-gray-400">
                    Keine Leads
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
