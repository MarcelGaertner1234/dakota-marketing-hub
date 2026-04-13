"use server"

import { createServerClient } from "@/lib/supabase/server"
import {
  generateTischkarteText,
  OCCASION_LABELS,
  FOOTER_SIGNATURES,
  DATE_LOCALES,
} from "@/lib/ai/generate-tischkarte-text"
import { generateStoryIllustration } from "@/lib/ai/generate-illustration"
import { revalidatePath } from "next/cache"
import type { TischkartenOccasion, TischkartenLanguage } from "@/types/database"

// ──────────────────────────────────────────────────────────────
// Occasion-specific illustration scenes (same as API route)
// ──────────────────────────────────────────────────────────────
const OCCASION_SCENE: Record<TischkartenOccasion, { title: string; hint: string }> = {
  birthday: {
    title: "Festive birthday table setting with candles and decorations",
    hint: "A warm birthday scene: lit candles on a rustic cake, small wrapped gifts, wildflowers. Celebratory but intimate, alpine restaurant atmosphere.",
  },
  anniversary: {
    title: "Romantic anniversary dinner setting for two",
    hint: "An elegant romantic scene: two wine glasses, a single rose, soft candlelight reflected on polished wood. Intimate and warm, not kitschy.",
  },
  wedding: {
    title: "Elegant wedding celebration table with champagne",
    hint: "A refined wedding celebration: champagne flutes, delicate floral arrangement with alpine flowers, subtle gold accents. Festive yet tasteful.",
  },
  family: {
    title: "Warm family gathering around a large wooden table",
    hint: "A cozy family scene: a generously set large table, shared dishes, bread basket, warm lighting. Multiple place settings suggesting togetherness.",
  },
  business: {
    title: "Professional business dinner setting in alpine restaurant",
    hint: "A polished business setting: crisp napkins, mineral water, a notepad beside the plate. Professional yet inviting, the hangar architecture visible.",
  },
  none: {
    title: "Welcome scene at the Dakota Air Lounge hangar restaurant",
    hint: "The Dakota atmosphere: warm hangar interior, a beautifully set table awaiting guests, soft light falling through large windows onto alpine wood.",
  },
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

const VALID_LANGUAGES: TischkartenLanguage[] = ["de", "en", "fr", "it"]

/**
 * Builds the subtitle from structural metadata, localized.
 * E.g. "Tisch 4 · Sonntag, 7. April · Geburtstag" (de)
 *      "Table 4 · Sunday, 7 April · Birthday" (en)
 */
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

  const languageRaw = (formData.get("language") as string) || "de"
  const language = (
    VALID_LANGUAGES.includes(languageRaw as TischkartenLanguage)
      ? languageRaw
      : "de"
  ) as TischkartenLanguage

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
    language,
  })

  // 3. Subtitle aus Metadata zusammenbauen
  const subtitle = buildSubtitle({
    reservationDate,
    tableNumber,
    occasion,
    language,
  })

  // 4. INSERT
  const supabase = createServerClient()
  // Build insert payload — language column may not exist yet in DB
  // (Migration 006 adds it). Insert works fine: Supabase ignores unknown columns.
  const insertPayload: Record<string, unknown> = {
    guest_name: guestName,
    occasion,
    party_size: partySize,
    reservation_date: reservationDate,
    table_number: tableNumber,
    custom_hint: customHint,
    language,
    title: generated.title,
    subtitle,
    paragraph_1: generated.paragraph_1,
    paragraph_2: generated.paragraph_2,
    paragraph_3: generated.paragraph_3,
    footer_signature: FOOTER_SIGNATURES[language],
  }

  const { data, error } = await supabase
    .from("tischkarten")
    .insert(insertPayload)
    .select("id")
    .single()

  if (error) throw error

  // 5. Auto-generate illustration based on occasion + hint
  try {
    const scene = OCCASION_SCENE[occasion]
    const combinedHint = [scene.hint, customHint].filter(Boolean).join(" — ")

    const result = await generateStoryIllustration({
      category: "house",
      title: scene.title,
      subtitle,
      contextExcerpt: generated.paragraph_1.slice(0, 300),
      hint: combinedHint,
      storyId: data.id,
    })

    // Upload to Supabase Storage
    const ext = result.mediaType === "image/jpeg" ? "jpg" : "png"
    const fileName = `tischkarte/${data.id}/ai-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from("story-illustrations")
      .upload(fileName, result.imageData, {
        contentType: result.mediaType,
        upsert: false,
      })

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from("story-illustrations")
        .getPublicUrl(fileName)

      await supabase
        .from("tischkarten")
        .update({
          illustration_url: urlData.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id)
    }
  } catch (illustrationErr) {
    // Non-fatal: card is created, illustration just stays as default
    console.error("Auto-illustration failed (non-fatal):", illustrationErr)
  }

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

  const { error } = await supabase
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
