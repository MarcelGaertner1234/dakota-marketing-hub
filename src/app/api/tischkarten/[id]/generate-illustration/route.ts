import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generateStoryIllustration } from "@/lib/ai/generate-illustration"
import { rateLimit } from "@/lib/rate-limit"
import type { TischkartenOccasion } from "@/types/database"

// Image generation takes 10-30 seconds — extend the timeout generously.
export const maxDuration = 120

// ──────────────────────────────────────────────────────────────
// Occasion-specific illustration prompts — each occasion gets a
// distinct visual scene so cards look truly different.
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

/**
 * POST /api/tischkarten/[id]/generate-illustration
 *
 * Generates an occasion-specific KI illustration for a Tischkarte.
 * Each occasion (birthday, wedding, business, etc.) gets a distinct
 * visual scene — no more generic "house" images for everything.
 */
export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const rl = rateLimit(request, { scope: "ai-image", max: 10, windowMs: 60_000 })
  if (rl) return rl

  try {
    const { id } = await ctx.params
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const modalHint = (formData.get("hint") as string) || null

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 1. Load tischkarte
    const { data: tischkarte, error: loadErr } = await supabase
      .from("tischkarten")
      .select(
        "id, guest_name, title, subtitle, paragraph_1, custom_hint, occasion"
      )
      .eq("id", id)
      .single()

    if (loadErr || !tischkarte) {
      return NextResponse.json(
        { error: "Tischkarte not found" },
        { status: 404 }
      )
    }

    // 2. Source photo
    let sourcePhoto: Uint8Array | null = null
    let sourcePhotoMediaType: string | null = null
    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer()
      sourcePhoto = new Uint8Array(arrayBuffer)
      sourcePhotoMediaType = file.type || "image/jpeg"
    }

    // 3. Build occasion-specific prompt
    const occasion = (tischkarte.occasion as TischkartenOccasion) || "none"
    const scene = OCCASION_SCENE[occasion]

    const combinedHint = [
      scene.hint,
      tischkarte.custom_hint,
      modalHint,
    ]
      .filter(Boolean)
      .join(" — ")

    const result = await generateStoryIllustration({
      category: "house",
      title: scene.title,
      subtitle: tischkarte.subtitle,
      contextExcerpt: tischkarte.paragraph_1?.slice(0, 300) ?? null,
      hint: combinedHint,
      sourcePhoto,
      sourcePhotoMediaType,
      storyId: tischkarte.id,
    })

    // 4. Upload to existing story-illustrations bucket — namespaced by
    //    "tischkarte/" prefix so it doesn't collide with story files.
    const ext = result.mediaType === "image/jpeg" ? "jpg" : "png"
    const fileName = `tischkarte/${tischkarte.id}/ai-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from("story-illustrations")
      .upload(fileName, result.imageData, {
        contentType: result.mediaType,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    const { data: urlData } = supabase.storage
      .from("story-illustrations")
      .getPublicUrl(fileName)

    // 5. Update tischkarte
    const { error: updateError } = await supabase
      .from("tischkarten")
      .update({
        illustration_url: urlData.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tischkarte.id)

    if (updateError) {
      return NextResponse.json(
        { error: `Tischkarte update failed: ${updateError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      url: urlData.publicUrl,
      path: fileName,
      mode: result.mode,
      mediaType: result.mediaType,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("tischkarten generate-illustration error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
