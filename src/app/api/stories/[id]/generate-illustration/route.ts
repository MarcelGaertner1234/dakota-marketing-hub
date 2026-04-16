import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generateStoryIllustration } from "@/lib/ai/generate-illustration"
import { rateLimit } from "@/lib/rate-limit"
import type { StoryCategory } from "@/types/database"

// Image generation takes 10-30 seconds — extend the timeout generously.
export const maxDuration = 120

/**
 * POST /api/stories/[id]/generate-illustration
 *
 * Body: multipart/form-data
 *   - file?      (optional) source photo — if provided, does image-to-image
 *   - hint?      (optional) user hint for style tweaking
 *
 * Flow:
 *   1. Load story from Supabase (for title/category/context)
 *   2. Call AI Gateway (GPT Image 1.5) to generate illustration
 *   3. Upload resulting PNG to story-illustrations bucket
 *   4. Update story.illustration_url
 *   5. Return { url, mode }
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
    const hint = (formData.get("hint") as string) || null

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 1. Load story for context
    const { data: story, error: storyErr } = await supabase
      .from("stories")
      .select(
        "id, title, subtitle, category, paragraph_1, footer_signature"
      )
      .eq("id", id)
      .single()

    if (storyErr || !story) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      )
    }

    // 2. Prepare source photo (if provided)
    let sourcePhoto: Uint8Array | null = null
    let sourcePhotoMediaType: string | null = null
    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer()
      sourcePhoto = new Uint8Array(arrayBuffer)
      sourcePhotoMediaType = file.type || "image/jpeg"
    }

    // 3. Generate illustration via AI Gateway
    const result = await generateStoryIllustration({
      category: story.category as StoryCategory,
      title: story.title,
      subtitle: story.subtitle,
      contextExcerpt: story.paragraph_1?.slice(0, 300) ?? null,
      hint,
      sourcePhoto,
      sourcePhotoMediaType,
      storyId: story.id,
    })

    // 4. Upload to Supabase Storage
    const ext = result.mediaType === "image/jpeg" ? "jpg" : "png"
    const fileName = `${story.id}/ai-${Date.now()}.${ext}`

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

    // 5. Update story.illustration_url
    const { error: updateError } = await supabase
      .from("stories")
      .update({
        illustration_url: urlData.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", story.id)

    if (updateError) {
      return NextResponse.json(
        { error: `Story update failed: ${updateError.message}` },
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
    console.error("generate-illustration error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
