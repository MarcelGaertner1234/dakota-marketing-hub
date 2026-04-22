"use client"

import { useState, useTransition } from "react"
import { updateLeadStatus, addLeadActivity } from "@/lib/actions/leads"
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
}: {
  leadId: string
  currentStatus: LeadStatus
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [optimisticStatus, setOptimisticStatus] = useState<LeadStatus>(currentStatus)

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as LeadStatus
    const oldStatus = optimisticStatus
    setOptimisticStatus(newStatus)
    setError(null)
    startTransition(async () => {
      try {
        await updateLeadStatus(leadId, newStatus)
      } catch (e) {
        setOptimisticStatus(oldStatus)
        setError(e instanceof Error ? e.message : "Status-Update fehlgeschlagen")
        return
      }
      try {
        const formData = new FormData()
        formData.set("lead_id", leadId)
        formData.set("activity_type", "status_change")
        formData.set(
          "description",
          `Status geändert: ${LEAD_STATUS_LABELS[oldStatus]} → ${LEAD_STATUS_LABELS[newStatus]}`
        )
        await addLeadActivity(formData)
      } catch {
        // Activity log is non-fatal — status already persisted
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
      {isPending && (
        <p className="text-xs text-gray-400 dark:text-gray-500">Wird aktualisiert...</p>
      )}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}
