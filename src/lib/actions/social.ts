"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getSocialPosts() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("social_posts")
    .select("*, event:events(id, title), concept:concepts(id, name)")
    .order("scheduled_at", { ascending: true, nullsFirst: false })
  if (error) throw error
  return data
}

export async function createSocialPost(formData: FormData) {
  const supabase = createServerClient()
  const hashtags = (formData.get("hashtags") as string)
    ?.split(",")
    .map((t) => t.trim())
    .filter(Boolean) || []
  const { error } = await supabase.from("social_posts").insert({
    title: formData.get("title") as string,
    platform: formData.get("platform") as string,
    post_type: (formData.get("post_type") as string) || "post",
    caption: (formData.get("caption") as string) || null,
    hashtags: hashtags.length > 0 ? hashtags : null,
    scheduled_at: (formData.get("scheduled_at") as string) || null,
    status: (formData.get("status") as string) || "draft",
    event_id: (formData.get("event_id") as string) || null,
    concept_id: (formData.get("concept_id") as string) || null,
    series_id: (formData.get("series_id") as string) || null,
    series_order: Number(formData.get("series_order")) || null,
  })
  if (error) throw error
  revalidatePath("/social")
}

export async function getSocialPost(id: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("social_posts")
    .select("*, event:events(id, title, start_date), concept:concepts(id, name)")
    .eq("id", id)
    .single()
  if (error) throw error
  return data
}

export async function updateSocialPost(id: string, data: Record<string, unknown>) {
  const supabase = createServerClient()
  const { error } = await supabase.from("social_posts").update({
    ...data,
    updated_at: new Date().toISOString(),
  }).eq("id", id)
  if (error) throw error
  revalidatePath(`/social/${id}`)
  revalidatePath("/social")
}

export async function updatePostStatus(id: string, status: string) {
  const supabase = createServerClient()
  const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (status === "published") {
    update.published_at = new Date().toISOString()
  }
  const { error } = await supabase.from("social_posts").update(update).eq("id", id)
  if (error) throw error
  revalidatePath("/social")
}
