"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getTeamMembers() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .order("name")
  if (error) throw error
  return data
}

export async function createTeamMember(formData: FormData) {
  const supabase = createServerClient()
  const name = formData.get("name") as string
  const role = formData.get("role") as string
  const color = (formData.get("color") as string) || "#3B82F6"

  if (!name || !role) throw new Error("Name und Rolle sind erforderlich")

  const { error } = await supabase.from("team_members").insert({
    name,
    role,
    color,
  })
  if (error) throw error
  revalidatePath("/einstellungen")
}

export async function updateTeamMember(
  id: string,
  data: { name?: string; role?: string; color?: string }
) {
  const supabase = createServerClient()
  const { error } = await supabase
    .from("team_members")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw error
  revalidatePath("/einstellungen")
}

export async function deleteTeamMember(id: string): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = createServerClient()
  // Offene Aufgaben und Kontakt-Historie hängen per Fremdschlüssel an der Person
  const [tasks, acts] = await Promise.all([
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("assigned_to", id).neq("status", "done"),
    supabase.from("lead_activities").select("id", { count: "exact", head: true }).eq("contacted_by", id),
  ])
  const openTasks = tasks.count ?? 0
  if (openTasks > 0) {
    return { success: false, error: `${openTasks} offene Aufgabe${openTasks === 1 ? "" : "n"} sind dieser Person zugewiesen. Bitte zuerst unter «Aufgaben» umverteilen.` }
  }
  // Erledigte Aufgaben und Aktivitäten behalten, aber Verweis lösen; Events/Leads «erstellt von» ebenfalls
  const nulls = [
    supabase.from("tasks").update({ assigned_to: null }).eq("assigned_to", id),
    supabase.from("tasks").update({ created_by: null }).eq("created_by", id),
    supabase.from("events").update({ created_by: null }).eq("created_by", id),
    supabase.from("leads").update({ created_by: null }).eq("created_by", id),
    supabase.from("lead_activities").update({ contacted_by: null }).eq("contacted_by", id),
    supabase.from("lead_rounds").update({ started_by: null }).eq("started_by", id),
    supabase.from("social_posts").update({ assigned_to: null }).eq("assigned_to", id),
    supabase.from("social_posts").update({ created_by: null }).eq("created_by", id),
  ]
  for (const q of nulls) { const { error } = await q; if (error && !/does not exist|column/i.test(error.message)) return { success: false, error: error.message } }
  const { error } = await supabase.from("team_members").delete().eq("id", id)
  if (error) return { success: false, error: error.message }
  revalidatePath("/einstellungen"); revalidatePath("/aufgaben"); revalidatePath("/")
  void acts
  return { success: true }
}
