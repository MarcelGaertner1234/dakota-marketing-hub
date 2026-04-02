"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Repeat } from "lucide-react"
import type { RecurrenceType } from "@/types/database"

const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  none: "Keine",
  daily: "Täglich",
  weekly: "Wöchentlich",
  biweekly: "Alle 2 Wochen",
  monthly: "Monatlich",
  yearly: "Jährlich",
}

interface RecurrenceFieldsProps {
  defaultRecurrence?: RecurrenceType
  defaultEndDate?: string | null
}

export function RecurrenceFields({
  defaultRecurrence = "none",
  defaultEndDate = null,
}: RecurrenceFieldsProps) {
  const [recurrence, setRecurrence] = useState<RecurrenceType>(defaultRecurrence)

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        <Repeat className="h-4 w-4 text-[#C5A572]" />
        Wiederholung
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="recurrence">Intervall</Label>
          <select
            id="recurrence"
            name="recurrence"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
          >
            {Object.entries(RECURRENCE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {recurrence !== "none" && (
          <div className="space-y-2">
            <Label htmlFor="recurrence_end_date">Wiederholen bis</Label>
            <Input
              id="recurrence_end_date"
              name="recurrence_end_date"
              type="date"
              required
              defaultValue={defaultEndDate || ""}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Max. 52 Wiederholungen werden erstellt
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
