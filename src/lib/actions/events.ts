"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getEvents(year?: number) {
  const supabase = createServerClient()
  let query = supabase
    .from("events")
    .select("*, concept:concepts(*)")
    .order("start_date", { ascending: true })

  if (year) {
    query = query
      .gte("start_date", `${year}-01-01`)
      .lte("start_date", `${year}-12-31`)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getEvent(id: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("events")
    .select("*, concept:concepts(*), tasks(*, assigned_member:team_members!tasks_assigned_to_fkey(*)), images:event_images(*)")
    .eq("id", id)
    .single()
  if (error) throw error
  return data
}

export async function createEvent(formData: FormData) {
  const supabase = createServerClient()

  const recurrence = (formData.get("recurrence") as string) || "none"
  const recurrenceEndDate = (formData.get("recurrence_end_date") as string) || null

  const baseEvent = {
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || null,
    event_type: (formData.get("event_type") as string) || "own_event",
    start_date: formData.get("start_date") as string,
    end_date: (formData.get("end_date") as string) || null,
    start_time: (formData.get("start_time") as string) || null,
    end_time: (formData.get("end_time") as string) || null,
    location: (formData.get("location") as string) || "Dakota Air Lounge",
    concept_id: (formData.get("concept_id") as string) || null,
    lead_time_days: Number(formData.get("lead_time_days")) || 28,
    recurrence,
    recurrence_end_date: recurrence !== "none" ? recurrenceEndDate : null,
  }

  // Insert the parent event
  const { data: parentEvent, error } = await supabase
    .from("events")
    .insert(baseEvent)
    .select("id")
    .single()
  if (error) throw error

  // Generate child events if recurrence is set
  if (recurrence !== "none" && recurrenceEndDate) {
    const childDates = generateRecurrenceDates(
      baseEvent.start_date,
      recurrence,
      recurrenceEndDate
    )

    // Calculate end_date offset (if the event spans multiple days)
    let endDateOffsetDays = 0
    if (baseEvent.end_date) {
      const startMs = new Date(baseEvent.start_date).getTime()
      const endMs = new Date(baseEvent.end_date).getTime()
      endDateOffsetDays = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24))
    }

    if (childDates.length > 0) {
      const children = childDates.map((date) => {
        const childEndDate = endDateOffsetDays > 0
          ? offsetDate(date, endDateOffsetDays)
          : null
        return {
          title: baseEvent.title,
          description: baseEvent.description,
          event_type: baseEvent.event_type,
          start_date: date,
          end_date: childEndDate,
          start_time: baseEvent.start_time,
          end_time: baseEvent.end_time,
          location: baseEvent.location,
          concept_id: baseEvent.concept_id,
          lead_time_days: baseEvent.lead_time_days,
          recurrence: "none" as const,
          parent_event_id: parentEvent.id,
        }
      })

      const { error: childError } = await supabase.from("events").insert(children)
      if (childError) throw childError
    }
  }

  revalidatePath("/kalender")
}

/** Generate future occurrence dates (excluding the first/parent date). Max 52 entries. */
function generateRecurrenceDates(
  startDate: string,
  recurrence: string,
  endDate: string
): string[] {
  const dates: string[] = []
  const start = new Date(startDate + "T00:00:00")
  const end = new Date(endDate + "T00:00:00")
  const MAX_OCCURRENCES = 52

  let current = new Date(start)

  for (let i = 0; i < MAX_OCCURRENCES; i++) {
    current = nextOccurrence(current, recurrence)
    if (current > end) break
    dates.push(formatDate(current))
  }

  return dates
}

function nextOccurrence(date: Date, recurrence: string): Date {
  const next = new Date(date)
  switch (recurrence) {
    case "daily":
      next.setDate(next.getDate() + 1)
      break
    case "weekly":
      next.setDate(next.getDate() + 7)
      break
    case "biweekly":
      next.setDate(next.getDate() + 14)
      break
    case "monthly":
      next.setMonth(next.getMonth() + 1)
      break
    case "yearly":
      next.setFullYear(next.getFullYear() + 1)
      break
  }
  return next
}

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00")
  d.setDate(d.getDate() + days)
  return formatDate(d)
}

export async function updateEvent(id: string, formData: FormData) {
  const supabase = createServerClient()

  const recurrence = (formData.get("recurrence") as string) || "none"
  const recurrenceEndDate = (formData.get("recurrence_end_date") as string) || null

  const { error } = await supabase
    .from("events")
    .update({
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      event_type: (formData.get("event_type") as string) || "own_event",
      start_date: formData.get("start_date") as string,
      end_date: (formData.get("end_date") as string) || null,
      start_time: (formData.get("start_time") as string) || null,
      end_time: (formData.get("end_time") as string) || null,
      location: (formData.get("location") as string) || "Dakota Air Lounge",
      concept_id: (formData.get("concept_id") as string) || null,
      lead_time_days: Number(formData.get("lead_time_days")) || 28,
      recurrence,
      recurrence_end_date: recurrence !== "none" ? recurrenceEndDate : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
  if (error) throw error
  revalidatePath("/kalender")
  revalidatePath(`/kalender/${id}`)
}

export async function deleteEvent(id: string) {
  const supabase = createServerClient()
  const { error } = await supabase.from("events").delete().eq("id", id)
  if (error) throw error
  revalidatePath("/kalender")
}

export async function getHolidays(year?: number) {
  const supabase = createServerClient()
  let query = supabase.from("holidays").select("*").order("date")
  if (year) {
    query = query.eq("year", year)
  }
  const { data, error } = await query
  if (error) throw error
  return data
}
