"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getLeads() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("leads")
    .select("id, name, company, lead_type, status, tags")
    .order("created_at", { ascending: false })
  if (error) throw error
  return data
}

export async function getLead(id: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("leads")
    .select("*, activities:lead_activities(*, contacted_member:team_members(*), event:events(id, title))")
    .eq("id", id)
    .single()
  if (error) throw error
  return data
}

export async function createLead(formData: FormData): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = createServerClient()
  const tags = (formData.get("tags") as string)
    ?.split(",")
    .map((t) => t.trim())
    .filter(Boolean) || []
  try {
    const { error } = await supabase.from("leads").insert({
      name: formData.get("name") as string,
      company: (formData.get("company") as string) || null,
      lead_type: (formData.get("lead_type") as string) || "privatperson",
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      address: (formData.get("address") as string) || null,
      notes: (formData.get("notes") as string) || null,
      tags: tags.length > 0 ? tags : null,
    })
    if (error) return { success: false, error: error.message }
    revalidatePath("/leads")
    return { success: true }
  } catch {
    return { success: false, error: "Unbekannter Fehler beim Speichern" }
  }
}

export async function updateLeadStatus(id: string, status: string) {
  const supabase = createServerClient()
  const { error } = await supabase
    .from("leads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw error
  revalidatePath("/leads")
}

export async function addLeadActivity(formData: FormData) {
  const supabase = createServerClient()
  const { error } = await supabase.from("lead_activities").insert({
    lead_id: formData.get("lead_id") as string,
    activity_type: formData.get("activity_type") as string,
    description: formData.get("description") as string,
    contacted_by: (formData.get("contacted_by") as string) || null,
    event_id: (formData.get("event_id") as string) || null,
  })
  if (error) throw error
  revalidatePath(`/leads/${formData.get("lead_id")}`)
}
