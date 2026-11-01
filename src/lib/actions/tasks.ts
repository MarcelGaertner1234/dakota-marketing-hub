"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

const TASK_SELECT = "id, title, description, status, priority, due_date, assigned_to, event_id, completed_at, created_at, updated_at, assigned_member:team_members!tasks_assigned_to_fkey(id, name, color), event:events!tasks_event_id_fkey(id, title, start_date)"

function revalidateTaskPaths(eventId?: string | null) {
  if (eventId) revalidatePath(`/kalender/${eventId}`)
  revalidatePath("/kalender")
  revalidatePath("/aufgaben")
  revalidatePath("/")
}

export async function getTasksForEvent(eventId: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("tasks")
    .select("*, assigned_member:team_members!tasks_assigned_to_fkey(*)")
    .eq("event_id", eventId)
    .order("sort_order")
  if (error) throw error
  return data
}

/** Alle offenen Aufgaben (ohne Limit) plus die zuletzt erledigten. */
export async function getAllTasks(doneLimit = 40) {
  const supabase = createServerClient()
  const [open, done] = await Promise.all([
    supabase.from("tasks").select(TASK_SELECT).in("status", ["todo", "in_progress", "overdue"]).order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("tasks").select(TASK_SELECT).eq("status", "done").order("completed_at", { ascending: false, nullsFirst: false }).limit(doneLimit),
  ])
  if (open.error) throw open.error
  if (done.error) throw done.error
  return { open: open.data ?? [], done: done.data ?? [] }
}

/** Kommende Events als Auswahl für Aufgaben (klein halten). */
export async function getEventOptions(fromDate: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("events")
    .select("id, title, start_date, event_type")
    .or(`start_date.gte.${fromDate},end_date.gte.${fromDate}`)
    .neq("event_type", "holiday")
    .order("start_date")
    .limit(120)
  if (error) throw error
  return data ?? []
}

export async function createTask(formData: FormData) {
  const supabase = createServerClient()
  const title = ((formData.get("title") as string) || "").trim()
  if (!title) throw new Error("Titel ist erforderlich")
  const eventId = (formData.get("event_id") as string) || null
  const { error } = await supabase.from("tasks").insert({
    event_id: eventId,
    title,
    description: (formData.get("description") as string) || null,
    priority: (formData.get("priority") as string) || "medium",
    assigned_to: (formData.get("assigned_to") as string) || null,
    due_date: (formData.get("due_date") as string) || null,
  })
  if (error) throw error
  revalidateTaskPaths(eventId)
}

export async function updateTask(
  taskId: string,
  fields: { title?: string; description?: string | null; priority?: string; due_date?: string | null; assigned_to?: string | null; event_id?: string | null },
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = createServerClient()
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (fields.title !== undefined) {
    const t = fields.title.trim()
    if (!t) return { success: false, error: "Titel darf nicht leer sein" }
    update.title = t
  }
  if (fields.description !== undefined) update.description = fields.description || null
  if (fields.priority !== undefined) update.priority = fields.priority
  if (fields.due_date !== undefined) update.due_date = fields.due_date || null
  if (fields.assigned_to !== undefined) update.assigned_to = fields.assigned_to || null
  if (fields.event_id !== undefined) update.event_id = fields.event_id || null
  const { data, error } = await supabase.from("tasks").update(update).eq("id", taskId).select("event_id").single()
  if (error) return { success: false, error: error.message }
  revalidateTaskPaths(data?.event_id)
  return { success: true }
}

export async function deleteTask(taskId: string): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("tasks").delete().eq("id", taskId).select("event_id").single()
  if (error) return { success: false, error: error.message }
  revalidateTaskPaths(data?.event_id)
  return { success: true }
}

export async function updateTaskAssignment(taskId: string, assignedTo: string | null) {
  const supabase = createServerClient()
  const { error } = await supabase
    .from("tasks")
    .update({ assigned_to: assignedTo, updated_at: new Date().toISOString() })
    .eq("id", taskId)
  if (error) throw error
  revalidatePath("/")
  revalidatePath("/aufgaben")
}

export async function updateTaskStatus(taskId: string, status: string, eventId?: string) {
  const supabase = createServerClient()
  const update: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
    completed_at: status === "done" ? new Date().toISOString() : null,
  }

  let resolvedEventId = eventId
  if (!resolvedEventId) {
    const { data: task } = await supabase.from("tasks").select("event_id").eq("id", taskId).single()
    resolvedEventId = task?.event_id ?? undefined
  }

  const { error } = await supabase.from("tasks").update(update).eq("id", taskId)
  if (error) throw error
  revalidateTaskPaths(resolvedEventId)
}
