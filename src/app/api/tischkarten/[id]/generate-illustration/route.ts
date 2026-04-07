import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generateStoryIllustration } from "@/lib/ai/generate-illustration"

// Image generation takes 10-30 seconds — extend the timeout generously.
export const maxDuration = 120

/**
 * POST /api/tischkarten/[id]/generate-illustration
 *
 * Body: multipart/form-data
 *   - file?      (optional) source photo — if provided, does image-to-image
 *   - hint?      (optional) extra style hint from the modal (overrides custom_hint)
 *
 * Reuses the existing generateStoryIllustration() with category "house" —
 * the closest fit for "warm welcome scene at a Dakota table".
 *
 * Flow:
 *   1. Load tischkarte for context (title, hint, etc.)
 *   2. Call AI Gateway (GPT Image 1.5) to generate illustration
 *   3. Upload PNG to story-illustrations bucket (reused — no new bucket needed)
 *   4. Update tischkarten.illustration_url
 *   5. Return { url, mode }
 */
export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
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

    // 3. Build a context-rich prompt — combine the guest, the occasion,
    //    and any user-supplied hints into one string for the illustration.
    const combinedHint = [
      tischkarte.custom_hint,
      modalHint,
      tischkarte.occasion && tischkarte.occasion !== "none"
        ? `occasion: ${tischkarte.occasion}`
        : null,
    ]
      .filter(Boolean)
      .join(" — ")

    const result = await generateStoryIllustration({
      // "house" is the closest existing category — emphasises the welcome
      // scene / interior / atmosphere over a single dish.
      category: "house",
      title: `Welcome scene for ${tischkarte.guest_name}`,
      subtitle: tischkarte.subtitle,
      contextExcerpt: tischkarte.paragraph_1?.slice(0, 300) ?? null,
      hint: combinedHint || null,
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
