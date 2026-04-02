"use client"

import { useTransition } from "react"
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

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as LeadStatus
    const oldStatus = currentStatus
    startTransition(async () => {
      await updateLeadStatus(leadId, newStatus)
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
        // Activity log failed — status was already updated, no rollback
      }
    })
  }

  return (
    <div className="space-y-2">
      <select
        value={currentStatus}
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
        <p className="text-xs text-gray-400">Wird aktualisiert...</p>
      )}
    </div>
  )
}
