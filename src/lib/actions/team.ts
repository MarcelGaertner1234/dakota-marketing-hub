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

export async function deleteTeamMember(id: string) {
  const supabase = createServerClient()
  const { error } = await supabase.from("team_members").delete().eq("id", id)
  if (error) throw error
  revalidatePath("/einstellungen")
}
