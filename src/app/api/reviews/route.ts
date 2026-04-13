import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { token, comment, guest_name } = body

  // Fix 3: Coerce ratings to integers
  const food_rating = parseInt(body.food_rating, 10)
  const ambience_rating = parseInt(body.ambience_rating, 10)
  const service_rating = parseInt(body.service_rating, 10)

  if (!token || !food_rating || !ambience_rating || !service_rating) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  // Fix 1: Validate ratings are integers between 1-5
  const ratings = { food_rating, ambience_rating, service_rating }
  for (const [key, value] of Object.entries(ratings)) {
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      return NextResponse.json(
        { error: `${key} must be an integer between 1 and 5` },
        { status: 400 }
      )
    }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Fix 2: Check if a review with the same base token already exists
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .like("token", `${token}%`)
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: "Already reviewed" }, { status: 429 })
  }

  const goodyCode = `DAKOTA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

  const goodyToken = `${token}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`

  const { error } = await supabase.from("reviews").insert({
    token: goodyToken,
    food_rating,
    ambience_rating,
    service_rating,
    comment: comment || null,
    guest_name: guest_name || null,
    goody_code: goodyCode,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ goody_code: goodyCode })
}
