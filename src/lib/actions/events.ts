"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getEvents(year?: number) {
  const supabase = createServerClient()
  let query = supabase
    .from("events")
    .select("id, title, description, event_type, start_date, end_date, start_time, end_time, location, color, concept_id, recurrence, recurrence_end_date, parent_event_id, lead_time_days, concept:concepts(id, name, slug)")
    .order("start_date", { ascending: true })

  if (year) {
    // Alles, was das Jahr berührt: Start im Jahr ODER (mehrtägig und Ende im/nach dem Jahr)
    query = query
      .lte("start_date", `${year}-12-31`)
      .or(`start_date.gte.${year}-01-01,end_date.gte.${year}-01-01`)
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

export type UpdateEventResult =
  | { success: true }
  | { success: false; error: string }
  | { success: false; needsConfirm: true; deleteCount: number; taskCount: number }

/**
 * Event speichern. Serien werden per Diff nachgeführt: bestehende Folge-Termine, deren Datum
 * in der neuen Serie liegt, bleiben (inkl. Aufgaben) und werden aktualisiert; nur weggefallene
 * Termine werden gelöscht, neue eingefügt. Hängen an weggefallenen Terminen Aufgaben, wird
 * ohne `confirm_children=1` nichts gelöscht, sondern `needsConfirm` zurückgegeben.
 */
export async function updateEvent(id: string, formData: FormData): Promise<UpdateEventResult> {
  const supabase = createServerClient()

  const title = ((formData.get("title") as string) || "").trim()
  const startDate = formData.get("start_date") as string
  const endDate = (formData.get("end_date") as string) || null
  const recurrence = (formData.get("recurrence") as string) || "none"
  const recurrenceEndDate = (formData.get("recurrence_end_date") as string) || null
  const confirmed = formData.get("confirm_children") === "1"

  if (!title) return { success: false, error: "Titel ist erforderlich" }
  if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return { success: false, error: "Startdatum ist erforderlich (YYYY-MM-DD)" }
  if (endDate && endDate < startDate) return { success: false, error: "Enddatum liegt vor dem Startdatum" }
  if (recurrence !== "none") {
    if (!recurrenceEndDate || !/^\d{4}-\d{2}-\d{2}$/.test(recurrenceEndDate)) return { success: false, error: "«Wiederholen bis» fehlt" }
    if (recurrenceEndDate <= startDate) return { success: false, error: "Serien-Enddatum muss nach dem Startdatum liegen" }
  }

  const updatedFields = {
    title,
    description: (formData.get("description") as string) || null,
    event_type: (formData.get("event_type") as string) || "own_event",
    start_date: startDate,
    end_date: endDate,
    start_time: (formData.get("start_time") as string) || null,
    end_time: (formData.get("end_time") as string) || null,
    location: (formData.get("location") as string) || "Dakota Air Lounge",
    concept_id: (formData.get("concept_id") as string) || null,
    lead_time_days: Number(formData.get("lead_time_days")) || 28,
    recurrence,
    recurrence_end_date: recurrence !== "none" ? recurrenceEndDate : null,
    updated_at: new Date().toISOString(),
  }

  // Gewünschte Folge-Termine der (neuen) Serie
  const desired = recurrence !== "none" && recurrenceEndDate ? generateRecurrenceDates(startDate, recurrence, recurrenceEndDate) : []
  let endDateOffsetDays = 0
  if (endDate) {
    endDateOffsetDays = Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)
  }
  const childEnd = (date: string) => (endDateOffsetDays > 0 ? offsetDate(date, endDateOffsetDays) : null)

  // Bestehende Folge-Termine mit Aufgabenzahl
  const { data: existing, error: exErr } = await supabase
    .from("events")
    .select("id, start_date, tasks(count)")
    .eq("parent_event_id", id)
  if (exErr) return { success: false, error: exErr.message }
  type Child = { id: string; start_date: string; tasks: Array<{ count: number }> | null }
  const children = (existing ?? []) as Child[]
  const desiredSet = new Set(desired)
  const existingDates = new Set(children.map((c) => c.start_date))
  const keep = children.filter((c) => desiredSet.has(c.start_date))
  const drop = children.filter((c) => !desiredSet.has(c.start_date))
  const add = desired.filter((d) => !existingDates.has(d))
  const dropTasks = drop.reduce((n, c) => n + (c.tasks?.[0]?.count ?? 0), 0)

  if (drop.length > 0 && dropTasks > 0 && !confirmed) {
    return { success: false, needsConfirm: true, deleteCount: drop.length, taskCount: dropTasks }
  }

  const { error } = await supabase.from("events").update(updatedFields).eq("id", id)
  if (error) return { success: false, error: error.message }

  const shared = {
    title: updatedFields.title,
    description: updatedFields.description,
    event_type: updatedFields.event_type,
    start_time: updatedFields.start_time,
    end_time: updatedFields.end_time,
    location: updatedFields.location,
    concept_id: updatedFields.concept_id,
    lead_time_days: updatedFields.lead_time_days,
    updated_at: updatedFields.updated_at,
  }
  // Bleibende Folge-Termine: gemeinsame Felder nachziehen (auch ohne Serien-Änderung)
  for (const c of keep) {
    const { error: upErr } = await supabase.from("events").update({ ...shared, end_date: childEnd(c.start_date) }).eq("id", c.id)
    if (upErr) return { success: false, error: upErr.message }
  }
  if (drop.length > 0) {
    const { error: delErr } = await supabase.from("events").delete().in("id", drop.map((c) => c.id))
    if (delErr) return { success: false, error: delErr.message }
  }
  if (add.length > 0) {
    const rows = add.map((date) => ({ ...shared, start_date: date, end_date: childEnd(date), recurrence: "none" as const, parent_event_id: id }))
    const { error: insErr } = await supabase.from("events").insert(rows)
    if (insErr) return { success: false, error: insErr.message }
  }

  revalidatePath("/kalender")
  revalidatePath(`/kalender/${id}`)
  revalidatePath("/aufgaben")
  revalidatePath("/")
  return { success: true }
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
