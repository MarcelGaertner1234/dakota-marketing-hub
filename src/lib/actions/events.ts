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
  const startDate = formData.get("start_date") as string

  const title = (formData.get("title") as string)?.trim()
  if (!title) {
    throw new Error("Titel ist erforderlich")
  }
  if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    throw new Error("Startdatum ist erforderlich (YYYY-MM-DD)")
  }
  if (recurrence !== "none" && recurrenceEndDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(recurrenceEndDate)) {
      throw new Error("Enddatum der Serie ungültig")
    }
    if (recurrenceEndDate <= startDate) {
      throw new Error("Serien-Enddatum muss nach dem Startdatum liegen")
    }
  }

  const baseEvent = {
    title,
    description: (formData.get("description") as string) || null,
    event_type: (formData.get("event_type") as string) || "own_event",
    start_date: startDate,
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
  const originalDay = start.getDate()

  let current = new Date(start)

  for (let i = 0; i < MAX_OCCURRENCES; i++) {
    current = nextOccurrence(current, recurrence, originalDay)
    if (current > end) break
    dates.push(formatDate(current))
  }

  return dates
}

function nextOccurrence(date: Date, recurrence: string, originalDay?: number): Date {
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
    case "monthly": {
      const targetMonth = next.getMonth() + 1
      // Set day to 1 first to avoid overflow, then set month, then clamp day
      next.setDate(1)
      next.setMonth(targetMonth)
      const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
      next.setDate(Math.min(originalDay || date.getDate(), lastDay))
      break
    }
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

  // Fetch current event to detect recurrence changes
  const { data: existing } = await supabase
    .from("events")
    .select("recurrence, recurrence_end_date, start_date, end_date")
    .eq("id", id)
    .single()

  const updatedFields = {
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
  }

  const { error } = await supabase
    .from("events")
    .update(updatedFields)
    .eq("id", id)
  if (error) throw error

  // Regenerate child events if recurrence changed
  const recurrenceChanged =
    existing &&
    (existing.recurrence !== recurrence ||
      existing.recurrence_end_date !== (recurrence !== "none" ? recurrenceEndDate : null))

  if (recurrenceChanged) {
    // Delete existing child events
    const { error: deleteChildError } = await supabase
      .from("events")
      .delete()
      .eq("parent_event_id", id)
    if (deleteChildError) throw deleteChildError

    // Regenerate if new recurrence is not "none"
    if (recurrence !== "none" && recurrenceEndDate) {
      const childDates = generateRecurrenceDates(
        updatedFields.start_date,
        recurrence,
        recurrenceEndDate
      )

      let endDateOffsetDays = 0
      if (updatedFields.end_date) {
        const startMs = new Date(updatedFields.start_date).getTime()
        const endMs = new Date(updatedFields.end_date).getTime()
        endDateOffsetDays = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24))
      }

      if (childDates.length > 0) {
        const children = childDates.map((date) => {
          const childEndDate = endDateOffsetDays > 0
            ? offsetDate(date, endDateOffsetDays)
            : null
          return {
            title: updatedFields.title,
            description: updatedFields.description,
            event_type: updatedFields.event_type,
            start_date: date,
            end_date: childEndDate,
            start_time: updatedFields.start_time,
            end_time: updatedFields.end_time,
            location: updatedFields.location,
            concept_id: updatedFields.concept_id,
            lead_time_days: updatedFields.lead_time_days,
            recurrence: "none" as const,
            parent_event_id: id,
          }
        })

        const { error: childError } = await supabase.from("events").insert(children)
        if (childError) throw childError
      }
    }
  }

  revalidatePath("/kalender")
  revalidatePath(`/kalender/${id}`)
}

export async function deleteEvent(id: string) {
  const supabase = createServerClient()

  // Historic folder prefix was `event-${id.substring(0,8)}`; now standard is full id.
  // Clean both to avoid orphaned images after format change.
  const folderCandidates = [`event-${id}`, `event-${id.substring(0, 8)}`]
  for (const folderPath of folderCandidates) {
    const { data: files } = await supabase.storage.from("event-images").list(folderPath)
    if (files && files.length > 0) {
      const filePaths = files.map((f) => `${folderPath}/${f.name}`)
      await supabase.storage.from("event-images").remove(filePaths)
    }
  }

  const { error } = await supabase.from("events").delete().eq("id", id)
  if (error) throw error
  revalidatePath("/kalender")
}

export async function getHolidays(year: number) {
  const supabase = createServerClient()
  const query = supabase.from("holidays").select("*").order("date").eq("year", year)
  const { data, error } = await query
  if (error) throw error
  return data
}
