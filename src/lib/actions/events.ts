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
  const { error } = await supabase.from("events").insert({
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
  })
  if (error) throw error
  revalidatePath("/kalender")
}

export async function updateEvent(id: string, formData: FormData) {
  const supabase = createServerClient()
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
