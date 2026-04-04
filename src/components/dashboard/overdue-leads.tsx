"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, AlertTriangle, Flame, Clock, Phone } from "lucide-react"
import { LEAD_TEMPERATURE_COLORS, LEAD_STATUS_COLORS } from "@/lib/constants"
import type { LeadTemperature, LeadStatus } from "@/types/database"

interface OverdueLead {
  id: string
  name: string
  contact_person: string | null
  temperature: string
  status: string
  next_action: string
  next_action_date: string
  days_overdue: number
}

export function OverdueLeads({ leads }: { leads: OverdueLead[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  async function handleDone(leadId: string) {
    startTransition(async () => {
      const res = await fetch("/api/lead-action-done", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      })
      if (res.ok) router.refresh()
    })
  }

  if (leads.length === 0) {
    return (
      <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
        Keine überfälligen Aktionen — alles im Griff!
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {leads.map((lead) => (
        <div
          key={lead.id}
          className={`flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${pending ? "opacity-60" : ""} ${lead.days_overdue > 3 ? "border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10" : ""}`}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-gray-400 hover:text-green-500"
            onClick={() => handleDone(lead.id)}
            title="Als erledigt markieren"
          >
            <Check className="h-4 w-4" />
          </Button>

          <Link href={`/leads/${lead.id}`} className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">{lead.next_action}</p>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {lead.contact_person ? `${lead.contact_person} · ` : ""}{lead.name}
              </span>
              <Badge
                className="text-[9px] h-4"
                style={{
                  backgroundColor: LEAD_TEMPERATURE_COLORS[(lead.temperature as LeadTemperature) || "kalt"],
                  color: "white",
                }}
              >
                {lead.temperature}
              </Badge>
            </div>
          </Link>

          <div className="flex items-center gap-1 shrink-0">
            {lead.days_overdue > 0 ? (
              <span className="text-xs font-medium text-red-500">
                {lead.days_overdue}d überfällig
              </span>
            ) : (
              <span className="text-xs text-amber-500 font-medium">
                Heute
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
