"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getReviews() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw error
  return data
}

export async function getReviewStats() {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("reviews").select("food_rating, ambience_rating, service_rating")
  if (error) throw error

  if (!data || data.length === 0) {
    return { food: 0, ambience: 0, service: 0, total: 0 }
  }

  const total = data.length
  const food = data.reduce((sum, r) => sum + (r.food_rating || 0), 0) / total
  const ambience = data.reduce((sum, r) => sum + (r.ambience_rating || 0), 0) / total
  const service = data.reduce((sum, r) => sum + (r.service_rating || 0), 0) / total

  return {
    food: Math.round(food * 10) / 10,
    ambience: Math.round(ambience * 10) / 10,
    service: Math.round(service * 10) / 10,
    total,
  }
}

export async function createReview(data: {
  token: string
  food_rating: number
  ambience_rating: number
  service_rating: number
  comment?: string
  guest_name?: string
  guest_email?: string
}) {
  const supabase = createServerClient()
  const goodyCode = `DAKOTA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  const { error } = await supabase.from("reviews").insert({
    ...data,
    goody_code: goodyCode,
  })
  if (error) throw error
  return goodyCode
}

export async function createReviewToken() {
  const supabase = createServerClient()
  const token = Math.random().toString(36).substring(2, 10)
  // Pre-create the review record with just the token
  const { error } = await supabase.from("reviews").insert({
    token,
  })
  if (error) throw error
  return token
}
