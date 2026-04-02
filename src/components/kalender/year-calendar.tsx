"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from "@/lib/constants"
import type { EventType } from "@/types/database"

const MONTH_NAMES = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
]

const DAY_NAMES = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1 // Monday = 0
}

// Demo events for display before Supabase is connected
const DEMO_EVENTS: Array<{
  title: string
  start_date: string
  event_type: EventType
}> = [
  { title: "Karfreitag", start_date: "2026-04-03", event_type: "holiday" },
  { title: "Ostermontag", start_date: "2026-04-06", event_type: "holiday" },
  { title: "Auffahrt", start_date: "2026-05-14", event_type: "holiday" },
  { title: "Pfingstmontag", start_date: "2026-05-25", event_type: "holiday" },
  { title: "Bundesfeiertag", start_date: "2026-08-01", event_type: "holiday" },
  { title: "Weihnachten", start_date: "2026-12-25", event_type: "holiday" },
  { title: "Afterwork Launch", start_date: "2026-04-24", event_type: "concept_event" },
  { title: "Spezialitätenabend", start_date: "2026-04-18", event_type: "own_event" },
  { title: "Friday Lounge Start", start_date: "2026-05-01", event_type: "concept_event" },
  { title: "Strassenfest Meiringen", start_date: "2026-06-20", event_type: "local_event" },
  { title: "Nachbarschafts-Apéro", start_date: "2026-05-10", event_type: "concept_event" },
  { title: "Biker Brunch", start_date: "2026-06-07", event_type: "concept_event" },
  { title: "Sommerfest", start_date: "2026-07-18", event_type: "own_event" },
  { title: "Sportler-Menü Woche", start_date: "2026-09-14", event_type: "concept_event" },
  { title: "Themenabend Herbst", start_date: "2026-10-16", event_type: "own_event" },
]

function MonthGrid({ year, month }: { year: number; month: number }) {
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const today = new Date()
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month

  const monthEvents = DEMO_EVENTS.filter((e) => {
    const d = new Date(e.start_date)
    return d.getFullYear() === year && d.getMonth() === month
  })

  const days: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-[#2C2C2C] px-3 py-2">
        <CardTitle className="text-center text-sm font-medium text-white">
          {MONTH_NAMES[month]}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        {/* Day headers */}
        <div className="mb-1 grid grid-cols-7 gap-0">
          {DAY_NAMES.map((d) => (
            <div
              key={d}
              className="text-center text-[10px] font-medium text-gray-400"
            >
              {d}
            </div>
          ))}
        </div>
        {/* Day grid */}
        <div className="grid grid-cols-7 gap-0">
          {days.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />

            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            const dayEvents = monthEvents.filter(
              (e) => e.start_date === dateStr
            )
            const isToday =
              isCurrentMonth && today.getDate() === day

            return (
              <div
                key={day}
                className="relative flex min-h-[28px] flex-col items-center justify-start p-0.5"
              >
                <span
                  className={`text-[11px] leading-none ${
                    isToday
                      ? "flex h-5 w-5 items-center justify-center rounded-full bg-[#C5A572] font-bold text-white"
                      : "text-gray-700"
                  }`}
                >
                  {day}
                </span>
                {dayEvents.length > 0 && (
                  <div className="mt-0.5 flex gap-0.5">
                    {dayEvents.map((e, j) => (
                      <div
                        key={j}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          backgroundColor:
                            EVENT_TYPE_COLORS[e.event_type],
                        }}
                        title={e.title}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {/* Events list */}
        {monthEvents.length > 0 && (
          <div className="mt-2 space-y-1 border-t pt-2">
            {monthEvents.map((e, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor: EVENT_TYPE_COLORS[e.event_type],
                  }}
                />
                <span className="truncate text-[10px] text-gray-600">
                  {new Date(e.start_date).getDate()}.{" "}
                  {e.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function YearCalendar() {
  const [year, setYear] = useState(2026)

  return (
    <div className="space-y-4">
      {/* Year Navigation + Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setYear(year - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xl font-bold text-[#2C2C2C]">{year}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setYear(year + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-3">
          {(Object.entries(EVENT_TYPE_LABELS) as [EventType, string][]).map(
            ([type, label]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: EVENT_TYPE_COLORS[type] }}
                />
                <span className="text-xs text-gray-600">{label}</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* 12 Month Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }, (_, i) => (
          <MonthGrid key={i} year={year} month={i} />
        ))}
      </div>
    </div>
  )
}
