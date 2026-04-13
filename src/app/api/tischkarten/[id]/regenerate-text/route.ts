import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  generateTischkarteText,
  OCCASION_LABELS,
  FOOTER_SIGNATURES,
  DATE_LOCALES,
} from "@/lib/ai/generate-tischkarte-text"
import type { TischkartenOccasion, TischkartenLanguage } from "@/types/database"

export const maxDuration = 60

const VALID_LANGUAGES: TischkartenLanguage[] = ["de", "en", "fr", "it"]

function buildSubtitle(input: {
  reservationDate: string | null
  tableNumber: string | null
  occasion: TischkartenOccasion | null
  language: TischkartenLanguage
}): string | null {
  const lang = input.language
  const parts: string[] = []

  const tableLabels: Record<TischkartenLanguage, string> = {
    de: "Tisch",
    en: "Table",
    fr: "Table",
    it: "Tavolo",
  }

  if (input.tableNumber) {
    parts.push(`${tableLabels[lang]} ${input.tableNumber}`)
  }

  if (input.reservationDate) {
    try {
      const d = new Date(input.reservationDate)
      const formatted = d.toLocaleDateString(DATE_LOCALES[lang], {
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
    parts.push(OCCASION_LABELS[lang][input.occasion])
  }

  return parts.length > 0 ? parts.join(" · ") : null
}

/**
 * POST /api/tischkarten/[id]/regenerate-text
 *
 * Regenerates the KI text for an existing tischkarte.
 * Respects the stored language setting.
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

    const language: TischkartenLanguage =
      VALID_LANGUAGES.includes(row.language) ? row.language : "de"

    const generated = await generateTischkarteText({
      guestName: row.guest_name,
      occasion: row.occasion,
      partySize: row.party_size,
      reservationDate: row.reservation_date,
      customHint: row.custom_hint,
      language,
    })

    const subtitle = buildSubtitle({
      reservationDate: row.reservation_date,
      tableNumber: row.table_number,
      occasion: row.occasion,
      language,
    })

    const { data: updated, error: updateErr } = await supabase
      .from("tischkarten")
      .update({
        title: generated.title,
        subtitle,
        paragraph_1: generated.paragraph_1,
        paragraph_2: generated.paragraph_2,
        paragraph_3: generated.paragraph_3,
        footer_signature: FOOTER_SIGNATURES[language],
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
