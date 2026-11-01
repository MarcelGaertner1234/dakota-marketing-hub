"use client"

import { useState, useTransition } from "react"
import { updateLeadStatus } from "@/lib/actions/leads"
import { LEAD_STATUS_LABELS } from "@/lib/constants"
import type { LeadStatus } from "@/types/database"

const ALL_STATUSES: LeadStatus[] = [
  "neu",
  "kontaktiert",
  "interessiert",
  "gebucht",
  "nachfassen",
  "verloren",
]

export function LeadStatusSelect({
  leadId,
  currentStatus,
  teamMembers = [],
}: {
  leadId: string
  currentStatus: LeadStatus
  teamMembers?: Array<{ id: string; name: string }>
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [optimisticStatus, setOptimisticStatus] = useState<LeadStatus>(currentStatus)
  const [who, setWho] = useState<string>("")

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as LeadStatus
    const oldStatus = optimisticStatus
    setOptimisticStatus(newStatus)
    setError(null)
    startTransition(async () => {
      try {
        // The status_change activity is logged atomically inside updateLeadStatus.
        await updateLeadStatus(leadId, newStatus, who || null)
      } catch (e) {
        setOptimisticStatus(oldStatus)
        setError(e instanceof Error ? e.message : "Status-Update fehlgeschlagen")
        return
      }
    })
  }

  return (
    <div className="space-y-2">
      <select
        value={optimisticStatus}
        onChange={handleChange}
        disabled={isPending}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm disabled:opacity-50"
      >
        {ALL_STATUSES.map((s) => (
          <option key={s} value={s}>
            {LEAD_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      {teamMembers.length > 0 && (
        <select
          value={who}
          onChange={(e) => setWho(e.target.value)}
          aria-label="Wer ändert den Status"
          className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs"
        >
          <option value="">Statuswechsel durch: nicht angegeben</option>
          {teamMembers.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      )}
      {isPending && (
        <p className="text-xs text-gray-400 dark:text-gray-500">Wird aktualisiert...</p>
      )}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}
