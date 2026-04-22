import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"
import { secureGoodyCode } from "@/lib/crypto-id"
import { rateLimit } from "@/lib/rate-limit"

const reviewSchema = z.object({
  token: z.string().min(6).max(64),
  food_rating: z.coerce.number().int().min(1).max(5),
  ambience_rating: z.coerce.number().int().min(1).max(5),
  service_rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(2000).optional().nullable(),
  guest_name: z.string().max(100).optional().nullable(),
  guest_email: z.string().email().max(200).optional().nullable(),
})

export async function POST(request: NextRequest) {
  const rl = rateLimit(request, { scope: "reviews", max: 5, windowMs: 60_000 })
  if (rl) return rl

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = reviewSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 }
    )
  }

  const { token, food_rating, ambience_rating, service_rating, comment, guest_name, guest_email } =
    parsed.data

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
    guest_email: guest_email || null,
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
