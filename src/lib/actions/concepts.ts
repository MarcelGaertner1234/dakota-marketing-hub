"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getConcepts() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("concepts")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
  if (error) throw error
  return data
}

export async function getConcept(id: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("concepts")
    .select("*, events(*)")
    .eq("id", id)
    .single()
  if (error) throw error
  return data
}

export async function createConcept(formData: FormData) {
  const supabase = createServerClient()
  const name = formData.get("name") as string
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  const channels = (formData.get("channels") as string)
    ?.split(",")
    .map((c) => c.trim())
    .filter(Boolean) || []
  const { error } = await supabase.from("concepts").insert({
    name,
    slug,
    description: (formData.get("description") as string) || null,
    description_berndeutsch: (formData.get("description_berndeutsch") as string) || null,
    target_audience: (formData.get("target_audience") as string) || null,
    channels: channels.length > 0 ? channels : null,
    menu_description: (formData.get("menu_description") as string) || null,
    price_range: (formData.get("price_range") as string) || null,
  })
  if (error) throw error
  revalidatePath("/konzepte")
}

export async function getTeamMembers() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .order("name")
  if (error) throw error
  return data
}
