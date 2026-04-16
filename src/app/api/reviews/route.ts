import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { secureGoodyCode } from "@/lib/crypto-id"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const rl = rateLimit(request, { scope: "reviews", max: 5, windowMs: 60_000 })
  if (rl) return rl

  const body = await request.json()
  const { token, comment, guest_name } = body

  const food_rating = parseInt(body.food_rating, 10)
  const ambience_rating = parseInt(body.ambience_rating, 10)
  const service_rating = parseInt(body.service_rating, 10)

  if (!token || typeof token !== "string" || token.length < 6 || token.length > 64) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 })
  }

  if (!food_rating || !ambience_rating || !service_rating) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

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

  // Existing composite-token rows (legacy) start with `${token}-…`.
  // New rows use the original token directly → UNIQUE constraint handles races.
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .or(`token.eq.${token},token.like.${token}-%`)
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: "Already reviewed" }, { status: 429 })
  }

  const goodyCode = secureGoodyCode()

  const { error } = await supabase.from("reviews").insert({
    token,
    food_rating,
    ambience_rating,
    service_rating,
    comment: comment || null,
    guest_name: guest_name || null,
    goody_code: goodyCode,
  })

  if (error) {
    // 23505 = unique_violation → race condition where a concurrent request won
    if (error.code === "23505") {
      return NextResponse.json({ error: "Already reviewed" }, { status: 429 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ goody_code: goodyCode })
}
