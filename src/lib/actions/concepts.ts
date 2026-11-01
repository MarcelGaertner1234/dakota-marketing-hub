"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getConcepts(includeInactive = false) {
  const supabase = createServerClient()
  let q = supabase.from("concepts").select("*").order("sort_order")
  if (!includeInactive) q = q.eq("is_active", true)
  const { data, error } = await q
  if (error) throw error
  return data
}

/** URL-Slug mit Umlauten (Menü → menue) und Kollisionsschutz (-2, -3 …). */
async function uniqueSlug(name: string, supabase: ReturnType<typeof createServerClient>): Promise<string> {
  const base = name
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "konzept"
  const { data } = await supabase.from("concepts").select("slug").like("slug", `${base}%`)
  const taken = new Set((data ?? []).map((r) => r.slug))
  if (!taken.has(base)) return base
  let i = 2
  while (taken.has(`${base}-${i}`)) i++
  return `${base}-${i}`
}

export async function setConceptActive(id: string, active: boolean): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = createServerClient()
  const { error } = await supabase.from("concepts").update({ is_active: active, updated_at: new Date().toISOString() }).eq("id", id)
  if (error) return { success: false, error: error.message }
  revalidatePath("/konzepte"); revalidatePath(`/konzepte/${id}`); revalidatePath("/")
  return { success: true }
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
  const name = ((formData.get("name") as string) || "").trim()
  if (!name) throw new Error("Name ist erforderlich")
  const slug = await uniqueSlug(name, supabase)
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

export async function updateConcept(id: string, formData: FormData) {
  const supabase = createServerClient()
  const channels = (formData.get("channels") as string)
    ?.split(",")
    .map((c) => c.trim())
    .filter(Boolean) || []
  const { error } = await supabase
    .from("concepts")
    .update({
      name: (formData.get("name") as string) || undefined,
      description: (formData.get("description") as string) || null,
      description_berndeutsch: (formData.get("description_berndeutsch") as string) || null,
      target_audience: (formData.get("target_audience") as string) || null,
      channels: channels.length > 0 ? channels : null,
      menu_description: (formData.get("menu_description") as string) || null,
      price_range: (formData.get("price_range") as string) || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
  if (error) throw error
  revalidatePath(`/konzepte/${id}`)
  revalidatePath("/konzepte")
}

export async function updateConceptImage(id: string, imageUrl: string | null) {
  const supabase = createServerClient()
  const { error } = await supabase
    .from("concepts")
    .update({ image_url: imageUrl, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw error
  revalidatePath(`/konzepte/${id}`)
  revalidatePath("/konzepte")
}

