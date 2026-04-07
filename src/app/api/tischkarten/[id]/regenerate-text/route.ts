import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generateTischkarteText } from "@/lib/ai/generate-tischkarte-text"
import type { TischkartenOccasion } from "@/types/database"

export const maxDuration = 60

const OCCASION_LABELS: Record<TischkartenOccasion, string> = {
  birthday: "Geburtstag",
  anniversary: "Jahrestag",
  business: "Geschäftsessen",
  family: "Familienfeier",
  wedding: "Hochzeit",
  none: "",
}

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
 * POST /api/tischkarten/[id]/regenerate-text
 *
 * Regenerates the KI text for an existing tischkarte using its stored
 * inputs (guest_name, occasion, party_size, etc.) — useful when the
 * first generation didn't quite hit the right tone.
 *
 * Mirrors the regenerateTischkarteText server action for HTTP access.
 */
export async function POST(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: row, error: loadErr } = await supabase
      .from("tischkarten")
      .select("*")
      .eq("id", id)
      .single()

    if (loadErr || !row) {
      return NextResponse.json(
        { error: "Tischkarte not found" },
        { status: 404 }
      )
    }

    const generated = await generateTischkarteText({
      guestName: row.guest_name,
      occasion: row.occasion,
      partySize: row.party_size,
      reservationDate: row.reservation_date,
      customHint: row.custom_hint,
    })

    const subtitle = buildSubtitle({
      reservationDate: row.reservation_date,
      tableNumber: row.table_number,
      occasion: row.occasion,
    })

    const { data: updated, error: updateErr } = await supabase
      .from("tischkarten")
      .update({
        title: generated.title,
        subtitle,
        paragraph_1: generated.paragraph_1,
        paragraph_2: generated.paragraph_2,
        paragraph_3: generated.paragraph_3,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (updateErr) throw updateErr

    return NextResponse.json(updated)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("regenerate-text error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
