"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { secureGoodyCode } from "@/lib/crypto-id"

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
  const { data, error } = await supabase
    .from("reviews")
    .select("food_rating, ambience_rating, service_rating")
  if (error) throw error

  if (!data || data.length === 0) {
    return { food: 0, ambience: 0, service: 0, total: 0 }
  }

  const total = data.length

  const foodRatings = data.filter((r) => r.food_rating != null)
  const ambienceRatings = data.filter((r) => r.ambience_rating != null)
  const serviceRatings = data.filter((r) => r.service_rating != null)

  const food = foodRatings.length > 0
    ? foodRatings.reduce((sum, r) => sum + r.food_rating, 0) / foodRatings.length
    : 0
  const ambience = ambienceRatings.length > 0
    ? ambienceRatings.reduce((sum, r) => sum + r.ambience_rating, 0) / ambienceRatings.length
    : 0
  const service = serviceRatings.length > 0
    ? serviceRatings.reduce((sum, r) => sum + r.service_rating, 0) / serviceRatings.length
    : 0

  return {
    food: Math.round(food * 10) / 10,
    ambience: Math.round(ambience * 10) / 10,
    service: Math.round(service * 10) / 10,
    total,
  }
}

export async function getGoodyReviews() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .not("goody_code", "is", null)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data
}

export async function claimGoodyCode(reviewId: string) {
  const supabase = createServerClient()
  const { error } = await supabase
    .from("reviews")
    .update({ goody_claimed: true })
    .eq("id", reviewId)
  if (error) throw error
  revalidatePath("/bewertungen")
}

export async function unclaimGoodyCode(reviewId: string) {
  const supabase = createServerClient()
  const { error } = await supabase
    .from("reviews")
    .update({ goody_claimed: false })
    .eq("id", reviewId)
  if (error) throw error
  revalidatePath("/bewertungen")
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
  const goodyCode = secureGoodyCode()
  const { error } = await supabase.from("reviews").insert({
    ...data,
    goody_code: goodyCode,
  })
  if (error) throw error
  return goodyCode
}