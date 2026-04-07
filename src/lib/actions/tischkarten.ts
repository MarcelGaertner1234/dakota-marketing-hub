"use server"

import { createServerClient } from "@/lib/supabase/server"
import { generateTischkarteText } from "@/lib/ai/generate-tischkarte-text"
import { revalidatePath } from "next/cache"
import type { TischkartenOccasion } from "@/types/database"

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

const OCCASION_LABELS: Record<TischkartenOccasion, string> = {
  birthday: "Geburtstag",
  anniversary: "Jahrestag",
  business: "Geschäftsessen",
  family: "Familienfeier",
  wedding: "Hochzeit",
  none: "",
}

/**
 * Builds the offizieller-Schild Subtitle from the structural metadata.
 * Looks like: "Tisch 4 · Sonntag, 7. April · Geburtstag"
 */
function buildSubtitle(input: {
  reservationDate: string | null
  tableNumber: string | null
  occasion: TischkartenOccasion | null
}): string | null {
  const parts: string[] = []

  if (input.tableNumber) {
    parts.push(`Tisch ${input.tableNumber}`)
  }

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

// ──────────────────────────────────────────────────────────────
// Read
// ──────────────────────────────────────────────────────────────

export async function listTischkarten() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("tischkarten")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw error
  return data
}

export async function getTischkarte(id: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("tischkarten")
    .select("*")
    .eq("id", id)
    .single()
  if (error) throw error
  return data
}

// ──────────────────────────────────────────────────────────────
// Create — generates KI text + inserts row
// ──────────────────────────────────────────────────────────────

export async function createTischkarte(formData: FormData) {
  // 1. Parse Eingaben
  const guestName = ((formData.get("guest_name") as string) || "").trim()
  if (!guestName) {
    throw new Error("Gastname ist Pflicht")
  }

  const occasionRaw = (formData.get("occasion") as string) || "none"
  const occasion = (
    ["birthday", "anniversary", "business", "family", "wedding", "none"].includes(
      occasionRaw
    )
      ? occasionRaw
      : "none"
  ) as TischkartenOccasion

  const partySizeRaw = formData.get("party_size") as string
  const partySize =
    partySizeRaw && !isNaN(parseInt(partySizeRaw, 10))
      ? parseInt(partySizeRaw, 10)
      : null

  const reservationDate =
    (formData.get("reservation_date") as string) || null

  const tableNumber = (formData.get("table_number") as string) || null
  const customHint = (formData.get("custom_hint") as string) || null

  // 2. KI-Text generieren
  const generated = await generateTischkarteText({
    guestName,
    occasion,
    partySize,
    reservationDate,
    customHint,
  })

  // 3. Subtitle aus Metadata zusammenbauen (überschreibt KI-Subtitle —
  //    der strukturierte Footer-Subtitle wirkt offizieller wie ein
  //    Reservierungs-Schild)
  const subtitle = buildSubtitle({
    reservationDate,
    tableNumber,
    occasion,
  })

  // 4. INSERT
  const supabase = createServerClient()
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
    .select("id")
    .single()

  if (error) throw error
  revalidatePath("/tischkarten")
  return data
}

// ──────────────────────────────────────────────────────────────
// Regenerate text — same inputs, fresh KI run
// ──────────────────────────────────────────────────────────────

export async function regenerateTischkarteText(id: string) {
  const supabase = createServerClient()

  const { data: row, error: loadErr } = await supabase
    .from("tischkarten")
    .select("*")
    .eq("id", id)
    .single()
  if (loadErr || !row) throw loadErr ?? new Error("Tischkarte nicht gefunden")

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

  const { error } = await supabase
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

  if (error) throw error
  revalidatePath("/tischkarten")
  revalidatePath(`/tischkarten/${id}`)
  revalidatePath(`/tischkarten/${id}/preview`)
}

// ──────────────────────────────────────────────────────────────
// Edit & manage
// ──────────────────────────────────────────────────────────────

export async function updateTischkarteIllustration(
  id: string,
  url: string | null
) {
  const supabase = createServerClient()
  const { error } = await supabase
    .from("tischkarten")
    .update({ illustration_url: url, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw error
  revalidatePath("/tischkarten")
  revalidatePath(`/tischkarten/${id}`)
  revalidatePath(`/tischkarten/${id}/preview`)
}

export async function deleteTischkarte(id: string) {
  const supabase = createServerClient()
  const { error } = await supabase.from("tischkarten").delete().eq("id", id)
  if (error) throw error
  revalidatePath("/tischkarten")
}
