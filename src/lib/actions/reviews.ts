"use server"

import { cache } from "react"
import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

const REVIEW_COLS = "id, token, food_rating, ambience_rating, service_rating, comment, guest_name, guest_email, goody_claimed, goody_code, created_at"

type Rating = { food_rating: number | null; ambience_rating: number | null; service_rating: number | null }

function statsFrom(rows: Rating[]) {
  if (rows.length === 0) return { food: 0, ambience: 0, service: 0, total: 0 }
  const avg = (key: keyof Rating) => {
    const vals = rows.map((r) => r[key]).filter((v): v is number => v != null)
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0
  }
  return { food: avg("food_rating"), ambience: avg("ambience_rating"), service: avg("service_rating"), total: rows.length }
}

/** Neueste Bewertungen (eine Abfrage) plus Stats und Goody-Liste daraus. */
export async function getReviewsOverview(limit = 300) {
  const supabase = createServerClient()
  const [{ data, error }, { count }] = await Promise.all([
    supabase.from("reviews").select(REVIEW_COLS).order("created_at", { ascending: false }).limit(limit),
    supabase.from("reviews").select("id", { count: "exact", head: true }),
  ])
  if (error) throw error
  const reviews = data ?? []
  const stats = { ...statsFrom(reviews), total: count ?? reviews.length }
  const goodyReviews = reviews.filter((r) => r.goody_code)
  return { reviews, stats, goodyReviews, hasMore: (count ?? 0) > reviews.length }
}

export async function getReviews() {
  return (await getReviewsOverview()).reviews
}

/** Nur die drei Rating-Spalten, pro Request einmal (Dashboard + Bewertungen). */
export const getReviewStats = cache(async () => {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("reviews").select("food_rating, ambience_rating, service_rating")
  if (error) throw error
  return statsFrom(data ?? [])
})

export async function getGoodyReviews() {
  return (await getReviewsOverview()).goodyReviews
}

export async function claimGoodyCode(reviewId: string) {
  const supabase = createServerClient()
  const { error } = await supabase.from("reviews").update({ goody_claimed: true }).eq("id", reviewId)
  if (error) throw error
  revalidatePath("/bewertungen")
}

export async function unclaimGoodyCode(reviewId: string) {
  const supabase = createServerClient()
  const { error } = await supabase.from("reviews").update({ goody_claimed: false }).eq("id", reviewId)
  if (error) throw error
  revalidatePath("/bewertungen")
}
