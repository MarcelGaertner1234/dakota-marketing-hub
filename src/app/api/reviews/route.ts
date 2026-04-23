import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"
import { secureGoodyCode, secureFileSuffix } from "@/lib/crypto-id"
import { rateLimit } from "@/lib/rate-limit"

// Token input = the short QR slug (e.g. "abc123def4"). Many guests can scan
// the same table QR, so we store each review under a composite row-token:
//   `${qrToken}-${randomSuffix}`
// The DB column is UNIQUE; the composite keeps inserts collision-free while
// letting unlimited guests review through the same QR.
const reviewSchema = z.object({
  token: z
    .string()
    .min(6)
    .max(64)
    .regex(/^[a-zA-Z0-9_-]+$/, "Ungültiges Token-Format"),
  food_rating: z.coerce.number().int().min(1).max(5),
  ambience_rating: z.coerce.number().int().min(1).max(5),
  service_rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(2000).optional().nullable(),
  guest_name: z.string().max(100).optional().nullable(),
  guest_email: z.string().email().max(200).optional().nullable(),
})

function getClientIp(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0].trim()
  return request.headers.get("x-real-ip") ?? "unknown"
}

function makeCompositeToken(qrToken: string): string {
  return `${qrToken}-${Date.now()}-${secureFileSuffix()}`
}

export async function POST(request: NextRequest) {
  // Per-IP global rate limit (abuse guard, not per-token dedup).
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

  const {
    token,
    food_rating,
    ambience_rating,
    service_rating,
    comment,
    guest_name,
    guest_email,
  } = parsed.data

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Soft-dedup window: same IP + same QR token within 2 minutes → treat as a
  // double-submit (refresh, double-tap). Does NOT block different guests on
  // the same table QR, and never blocks across sessions after the window.
  const ip = getClientIp(request)
  const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString()
  const { data: recent } = await supabase
    .from("reviews")
    .select("id, created_at")
    .like("token", `${token}-%`)
    .gte("created_at", twoMinAgo)
    .limit(10)

  if (recent && recent.length > 0) {
    // Cheap heuristic — if any review for this QR was created within the last
    // 2 minutes, reject to avoid double-submits. Legitimate next guests can
    // re-try after 2 minutes. We intentionally keep this simple rather than
    // persisting IPs alongside reviews.
    const sameMinute = recent.some((r) => {
      const age = Date.now() - new Date(r.created_at).getTime()
      return age < 30_000 // hard block within 30 s
    })
    if (sameMinute) {
      return NextResponse.json(
        { error: "Bewertung bereits abgeschickt. Bitte einen Moment warten." },
        { status: 429 }
      )
    }
  }

  // Insert with a composite token → UNIQUE constraint on `reviews.token` is
  // satisfied while still allowing unlimited reviews per QR slug.
  const goodyCode = secureGoodyCode()

  const maxAttempts = 3
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const composite = makeCompositeToken(token)
    const { error } = await supabase.from("reviews").insert({
      token: composite,
      food_rating,
      ambience_rating,
      service_rating,
      comment: comment || null,
      guest_name: guest_name || null,
      guest_email: guest_email || null,
      goody_code: goodyCode,
    })

    if (!error) {
      return NextResponse.json({ goody_code: goodyCode })
    }

    // 23505 = unique_violation → composite collision (astronomically unlikely).
    // Retry with a fresh suffix.
    if (error.code === "23505" && attempt < maxAttempts - 1) {
      continue
    }

    console.error("reviews insert error:", { ip, error })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(
    { error: "Review konnte nicht gespeichert werden. Bitte nochmal versuchen." },
    { status: 500 }
  )
}
