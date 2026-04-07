"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getStories(opts?: {
  status?: string
  category?: string
}) {
  const supabase = createServerClient()
  let query = supabase
    .from("stories")
    .select(
      "*, linked_event:events(id, title, start_date), linked_concept:concepts(id, name, slug)"
    )
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })

  if (opts?.status) query = query.eq("status", opts.status)
  if (opts?.category) query = query.eq("category", opts.category)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getStory(id: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("stories")
    .select(
      "*, linked_event:events(id, title, start_date), linked_concept:concepts(id, name, slug)"
    )
    .eq("id", id)
    .single()
  if (error) throw error
  return data
}

export async function createStory(formData: FormData) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("stories")
    .insert({
      title: formData.get("title") as string,
      subtitle: (formData.get("subtitle") as string) || null,
      category: (formData.get("category") as string) || "dish",
      paragraph_1: formData.get("paragraph_1") as string,
      paragraph_2: (formData.get("paragraph_2") as string) || null,
      paragraph_3: (formData.get("paragraph_3") as string) || null,
      footer_signature:
        (formData.get("footer_signature") as string) || "Ihre Dakota Crew",
      linked_event_id: (formData.get("linked_event_id") as string) || null,
      linked_concept_id: (formData.get("linked_concept_id") as string) || null,
      status: (formData.get("status") as string) || "draft",
    })
    .select("id")
    .single()
  if (error) throw error
  revalidatePath("/stories")
  return data
}

export async function updateStory(id: string, formData: FormData) {
  const supabase = createServerClient()
  const { error } = await supabase
    .from("stories")
    .update({
      title: formData.get("title") as string,
      subtitle: (formData.get("subtitle") as string) || null,
      category: (formData.get("category") as string) || undefined,
      paragraph_1: formData.get("paragraph_1") as string,
      paragraph_2: (formData.get("paragraph_2") as string) || null,
      paragraph_3: (formData.get("paragraph_3") as string) || null,
      footer_signature:
        (formData.get("footer_signature") as string) || "Ihre Dakota Crew",
      linked_event_id: (formData.get("linked_event_id") as string) || null,
      linked_concept_id: (formData.get("linked_concept_id") as string) || null,
      status: (formData.get("status") as string) || undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
  if (error) throw error
  revalidatePath("/stories")
  revalidatePath(`/stories/${id}`)
  revalidatePath(`/stories/${id}/preview`)
  revalidatePath(`/story/${id}`)
}

export async function updateStoryIllustration(
  id: string,
  url: string | null
) {
  const supabase = createServerClient()
  const { error } = await supabase
    .from("stories")
    .update({ illustration_url: url, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw error
  revalidatePath("/stories")
  revalidatePath(`/stories/${id}`)
  revalidatePath(`/stories/${id}/preview`)
  revalidatePath(`/story/${id}`)
}

export async function deleteStory(id: string) {
  const supabase = createServerClient()
  const { error } = await supabase.from("stories").delete().eq("id", id)
  if (error) throw error
  revalidatePath("/stories")
}

export async function publishStory(id: string) {
  const supabase = createServerClient()
  const { error } = await supabase
    .from("stories")
    .update({ status: "published", updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw error
  revalidatePath("/stories")
  revalidatePath(`/stories/${id}`)
}

export async function unpublishStory(id: string) {
  const supabase = createServerClient()
  const { error } = await supabase
    .from("stories")
    .update({ status: "draft", updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw error
  revalidatePath("/stories")
  revalidatePath(`/stories/${id}`)
}
