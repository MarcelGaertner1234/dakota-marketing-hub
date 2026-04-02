"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, Plus, Calendar, MapPin, Clock } from "lucide-react"
import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS } from "@/lib/constants"
import type { EventType } from "@/types/database"
import Link from "next/link"

const MONTH_NAMES = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
]
const WEEKDAY_NAMES = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"]
const DAY_NAMES = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

interface CalendarEvent {
  id: string
  title: string
  start_date: string
  start_time?: string | null
  end_time?: string | null
  location?: string | null
  event_type: EventType
  description?: string | null
}

interface YearCalendarProps {
  events: CalendarEvent[]
  holidays: Array<{ name: string; date: string }>
}

// ============================================================
// Month Grid
// ============================================================
function MonthGrid({
  year,
  month,
  allItems,
  onDayClick,
  selectedDate,
}: {
  year: number
  month: number
  allItems: CalendarEvent[]
  onDayClick: (dateStr: string) => void
  selectedDate: string | null
}) {
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month

  const monthItems = allItems.filter((e) => {
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
        <div className="mb-1 grid grid-cols-7 gap-0">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-center text-[10px] font-medium text-gray-400">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0">
          {days.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            const dayEvents = monthItems.filter((e) => e.start_date === dateStr)
            const isToday = isCurrentMonth && today.getDate() === day
            const isSelected = selectedDate === dateStr
            const hasEvents = dayEvents.length > 0

            return (
              <button
                key={day}
                type="button"
                onClick={() => onDayClick(dateStr)}
                className={`
                  relative flex min-h-[32px] flex-col items-center justify-start p-0.5 rounded-md
                  transition-all duration-150 cursor-pointer
                  ${isSelected ? "bg-[#C5A572]/20 ring-2 ring-[#C5A572]"
                    : hasEvents ? "hover:bg-[#C5A572]/10" : "hover:bg-gray-100"}
                `}
              >
                <span className={`text-[11px] leading-none ${
                  isToday ? "flex h-5 w-5 items-center justify-center rounded-full bg-[#C5A572] font-bold text-white"
                    : hasEvents ? "font-semibold text-[#2C2C2C]" : "text-gray-500"
                }`}>
                  {day}
                </span>
                {hasEvents && (
                  <div className="mt-0.5 flex gap-0.5">
                    {dayEvents.slice(0, 3).map((e, j) => (
                      <div key={j} className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: EVENT_TYPE_COLORS[e.event_type] }} />
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[8px] text-gray-400">+{dayEvents.length - 3}</span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
        {monthItems.length > 0 && (
          <div className="mt-2 space-y-0.5 border-t pt-2">
            {monthItems
              .sort((a, b) => a.start_date.localeCompare(b.start_date))
              .slice(0, 6)
              .map((e, i) => (
                <button key={i} type="button" onClick={() => onDayClick(e.start_date)}
                  className="flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left transition-colors hover:bg-gray-100">
                  <div className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: EVENT_TYPE_COLORS[e.event_type] }} />
                  <span className="truncate text-[10px] text-gray-600">
                    {new Date(e.start_date).getDate()}. {e.title}
                  </span>
                </button>
              ))}
            {monthItems.length > 6 && (
              <p className="text-[10px] text-gray-400 text-center pt-1">+{monthItems.length - 6} weitere</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================
// Year Calendar
// ============================================================
export function YearCalendar({ events, holidays }: YearCalendarProps) {
  const [year, setYear] = useState(2026)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const yearEvents = events.filter((e) => new Date(e.start_date).getFullYear() === year)
  const yearHolidays = holidays.filter((h) => new Date(h.date).getFullYear() === year)

  const allItems: CalendarEvent[] = [
    ...yearEvents,
    ...yearHolidays.map((h) => ({
      id: `holiday-${h.date}`,
      title: h.name,
      start_date: h.date,
      event_type: "holiday" as EventType,
    })),
  ]

  const selectedDayEvents = selectedDate
    ? allItems.filter((e) => e.start_date === selectedDate)
    : []

  const selectedDateObj = selectedDate ? new Date(selectedDate) : null
  const realEvents = selectedDayEvents.filter((e) => !e.id.startsWith("holiday-"))
  const holidayEvents = selectedDayEvents.filter((e) => e.id.startsWith("holiday-"))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setYear(year - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xl font-bold text-[#2C2C2C]">{year}</span>
          <Button variant="outline" size="icon" onClick={() => setYear(year + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-3">
          {(Object.entries(EVENT_TYPE_LABELS) as [EventType, string][]).map(([type, label]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: EVENT_TYPE_COLORS[type] }} />
              <span className="text-xs text-gray-600">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }, (_, i) => (
          <MonthGrid key={i} year={year} month={i} allItems={allItems}
            onDayClick={(d) => setSelectedDate(d)} selectedDate={selectedDate} />
        ))}
      </div>

      {/* Day Detail Dialog */}
      <Dialog open={!!selectedDate} onOpenChange={(open) => { if (!open) setSelectedDate(null) }}>
        <DialogContent className="sm:max-w-lg" showCloseButton={false}>
          {selectedDateObj && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#C5A572] font-medium">
                      {WEEKDAY_NAMES[selectedDateObj.getDay()]}
                    </p>
                    <DialogTitle className="text-xl font-bold">
                      {selectedDateObj.getDate()}. {MONTH_NAMES[selectedDateObj.getMonth()]} {selectedDateObj.getFullYear()}
                    </DialogTitle>
                  </div>
                  <Link href={`/kalender/neu?date=${selectedDate}`} onClick={() => setSelectedDate(null)}>
                    <Button size="sm" className="bg-[#C5A572] hover:bg-[#A08050]">
                      <Plus className="mr-1 h-4 w-4" /> Event
                    </Button>
                  </Link>
                </div>
                <DialogDescription>
                  {selectedDayEvents.length === 0
                    ? "Keine Events an diesem Tag"
                    : `${realEvents.length} Event${realEvents.length !== 1 ? "s" : ""}${holidayEvents.length > 0 ? ` · ${holidayEvents.length} Feiertag${holidayEvents.length !== 1 ? "e" : ""}` : ""}`
                  }
                </DialogDescription>
              </DialogHeader>

              <div className="max-h-[50vh] overflow-y-auto space-y-2 -mx-1 px-1">
                {/* Feiertage */}
                {holidayEvents.map((e, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-100 p-3">
                    <div className="h-3 w-3 shrink-0 rounded-full bg-red-500" />
                    <div>
                      <p className="text-sm font-medium text-red-800">{e.title}</p>
                      <p className="text-xs text-red-500">Feiertag</p>
                    </div>
                  </div>
                ))}

                {/* Events */}
                {realEvents.map((e) => (
                  <Link key={e.id} href={`/kalender/${e.id}`} onClick={() => setSelectedDate(null)}>
                    <div className="group flex gap-3 rounded-lg border p-3 transition-all hover:border-[#C5A572] hover:shadow-md cursor-pointer">
                      <div className="mt-1 h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: EVENT_TYPE_COLORS[e.event_type] }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm group-hover:text-[#C5A572] transition-colors">
                          {e.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                          {(e.start_time || e.end_time) && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              {e.start_time?.slice(0, 5) || "—"}
                              {e.end_time && ` – ${e.end_time.slice(0, 5)}`}
                            </span>
                          )}
                          {e.location && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <MapPin className="h-3 w-3" />
                              {e.location}
                            </span>
                          )}
                        </div>
                        {e.description && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{e.description}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="shrink-0 text-[10px] h-5 self-start"
                        style={{ borderColor: EVENT_TYPE_COLORS[e.event_type], color: EVENT_TYPE_COLORS[e.event_type] }}>
                        {EVENT_TYPE_LABELS[e.event_type]}
                      </Badge>
                    </div>
                  </Link>
                ))}

                {/* Leer */}
                {selectedDayEvents.length === 0 && (
                  <div className="text-center py-6">
                    <Calendar className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                    <p className="text-sm text-gray-400">Noch nichts geplant</p>
                  </div>
                )}
              </div>

              {realEvents.length > 0 && (
                <DialogFooter>
                  <p className="text-xs text-gray-500 w-full text-center">
                    Klick auf ein Event für Details & Aufgaben
                  </p>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
