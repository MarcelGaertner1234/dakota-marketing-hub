"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getTasksForEvent(eventId: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("tasks")
    .select("*, assigned_member:team_members(*)")
    .eq("event_id", eventId)
    .order("sort_order")
  if (error) throw error
  return data
}

export async function getAllOpenTasks() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("tasks")
    .select("*, assigned_member:team_members(*), event:events(id, title)")
    .in("status", ["todo", "in_progress"])
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(20)
  if (error) throw error
  return data
}

export async function createTask(formData: FormData) {
  const supabase = createServerClient()
  const { error } = await supabase.from("tasks").insert({
    event_id: (formData.get("event_id") as string) || null,
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || null,
    priority: (formData.get("priority") as string) || "medium",
    assigned_to: (formData.get("assigned_to") as string) || null,
    due_date: (formData.get("due_date") as string) || null,
  })
  if (error) throw error
  const eventId = formData.get("event_id") as string
  if (eventId) revalidatePath(`/kalender/${eventId}`)
  revalidatePath("/")
}

export async function updateTaskStatus(taskId: string, status: string) {
  const supabase = createServerClient()
  const update: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (status === "done") {
    update.completed_at = new Date().toISOString()
  }
  const { error } = await supabase
    .from("tasks")
    .update(update)
    .eq("id", taskId)
  if (error) throw error
  revalidatePath("/kalender")
  revalidatePath("/")
}
