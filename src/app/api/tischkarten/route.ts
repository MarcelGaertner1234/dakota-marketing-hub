import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"
import { generateTischkarteText } from "@/lib/ai/generate-tischkarte-text"
import { rateLimit } from "@/lib/rate-limit"
import { requireSameOriginOrSecret } from "@/lib/api-auth"
import type { TischkartenOccasion } from "@/types/database"

// Text gen takes ~2s but allow headroom for KI cold-start
export const maxDuration = 60

const VALID_OCCASIONS: TischkartenOccasion[] = [
  "birthday",
  "anniversary",
  "business",
  "family",
  "wedding",
  "none",
]

const OCCASION_LABELS: Record<TischkartenOccasion, string> = {
  birthday: "Geburtstag",
  anniversary: "Jahrestag",
  business: "Geschäftsessen",
  family: "Familienfeier",
  wedding: "Hochzeit",
  none: "",
}

// Length caps bound the prompt-injection surface that flows into the KI prompt
// (guest_name + custom_hint). occasion is validated against VALID_OCCASIONS
// below, so a loose max here is enough.
const createTischkarteSchema = z.object({
  guest_name: z.string().trim().min(1).max(100),
  occasion: z.string().max(40).optional().nullable(),
  // Loose on purpose: the handler below normalises party_size via `> 0 ? : null`,
  // matching the previous tolerant behaviour. The real prompt-injection vectors
  // are the free-text fields (guest_name / custom_hint), which are length-capped.
  party_size: z.number().max(100000).optional().nullable(),
  reservation_date: z.string().max(40).optional().nullable(),
  table_number: z.string().max(50).optional().nullable(),
  custom_hint: z.string().max(500).optional().nullable(),
})

/**
 * Builds the offizieller-Schild Subtitle from the structural metadata.
 * Mirrors the buildSubtitle helper in the createTischkarte server action.
 */
function buildSubtitle(input: {
  reservationDate: string | null
  tableNumber: string | null
  occasion: TischkartenOccasion | null
}): string | null {
  const parts: string[] = []
  if (input.tableNumber) parts.push(`Tisch ${input.tableNumber}`)
  if (input.reservationDate) {
    try {
      const d = new Date(input.reservationDate)
      const formatted = d.toLocaleDateString("de-CH", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
      parts.push(formatted)
    } catch {
      parts.push(input.reservationDate)
    }
  }
  if (input.occasion && input.occasion !== "none") {
    parts.push(OCCASION_LABELS[input.occasion])
  }
  return parts.length > 0 ? parts.join(" · ") : null
}

/**
 * POST /api/tischkarten
 *
 * REST wrapper around the createTischkarte server action — used by the
 * MCP server to create a tischkarte programmatically without going
 * through the web form.
 *
 * Body: JSON
 *   {
 *     guest_name: string             // REQUIRED
 *     occasion?: TischkartenOccasion // birthday/anniversary/business/family/wedding/none
 *     party_size?: number
 *     reservation_date?: string      // ISO date (YYYY-MM-DD)
 *     table_number?: string
 *     custom_hint?: string           // free-text context for the KI
 *   }
 *
 * Flow (mirrors the server action exactly):
 *   1. Validate guest_name
 *   2. Generate KI text via generateTischkarteText (Claude Haiku 4.5)
 *   3. Build subtitle from metadata
 *   4. INSERT into tischkarten
 *   5. Return the full row
 */
export async function POST(request: NextRequest) {
  const rl = rateLimit(request, { scope: "ai-text", max: 20, windowMs: 60_000 })
  if (rl) return rl

  const denied = requireSameOriginOrSecret(request)
  if (denied) return denied

  try {
    let rawBody: unknown
    try {
      rawBody = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    const parsed = createTischkarteSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", issues: parsed.error.issues },
        { status: 400 }
      )
    }
    const body = parsed.data

    // guest_name is already trimmed + length-capped by zod
    const guestName = body.guest_name

    const occasionRaw = body.occasion || "none"
    const occasion: TischkartenOccasion = VALID_OCCASIONS.includes(
      occasionRaw as TischkartenOccasion
    )
      ? (occasionRaw as TischkartenOccasion)
      : "none"

    const partySize =
      typeof body.party_size === "number" && body.party_size > 0
        ? body.party_size
        : null

    const reservationDate = body.reservation_date || null
    const tableNumber = body.table_number || null
    const customHint = body.custom_hint || null

    // 1. Generate KI text
    const generated = await generateTischkarteText({
      guestName,
      occasion,
      partySize,
      reservationDate,
      customHint,
    })

    // 2. Build subtitle
    const subtitle = buildSubtitle({
      reservationDate,
      tableNumber,
      occasion,
    })

    // 3. Insert
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase
      .from("tischkarten")
      .insert({
        guest_name: guestName,
        occasion,
        party_size: partySize,
        reservation_date: reservationDate,
        table_number: tableNumber,
        custom_hint: customHint,
        title: generated.title,
        subtitle,
        paragraph_1: generated.paragraph_1,
        paragraph_2: generated.paragraph_2,
        paragraph_3: generated.paragraph_3,
        footer_signature: "Ihre Dakota Crew",
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      ...data,
      preview_url: `https://dakota-marketing-hub.vercel.app/tischkarten/${data.id}/preview`,
      detail_url: `https://dakota-marketing-hub.vercel.app/tischkarten/${data.id}`,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("POST /api/tischkarten error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
