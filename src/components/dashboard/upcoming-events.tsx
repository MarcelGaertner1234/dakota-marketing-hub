"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from "@/lib/constants"
import type { EventType } from "@/types/database"

type EventItem = {
  id: string
  title: string
  start_date: string
  start_time: string | null
  event_type: string
}

const COLLAPSED_COUNT = 5

export function UpcomingEvents({ events }: { events: EventItem[] }) {
  const [expanded, setExpanded] = useState(false)

  if (events.length === 0) {
    return (
      <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
        Keine anstehenden Events.{" "}
        <Link href="/kalender/neu" className="text-[#C5A572] hover:underline">
          Event erstellen
        </Link>
      </p>
    )
  }

  const visible = expanded ? events : events.slice(0, COLLAPSED_COUNT)
  const hasMore = events.length > COLLAPSED_COUNT

  return (
    <div className="space-y-2">
      {visible.map((event) => (
        <Link key={event.id} href={`/kalender/${event.id}`}>
          <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
            <div
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: EVENT_TYPE_COLORS[event.event_type as EventType] || "#6B7280" }}
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
              {EVENT_TYPE_LABELS[event.event_type as EventType] || event.event_type}
            </Badge>
          </div>
        </Link>
      ))}
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-gray-400 hover:text-gray-600"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="mr-1 h-3 w-3" />
              Weniger anzeigen
            </>
          ) : (
            <>
              <ChevronDown className="mr-1 h-3 w-3" />
              Alle {events.length} Events anzeigen
            </>
          )}
        </Button>
      )}
    </div>
  )
}
