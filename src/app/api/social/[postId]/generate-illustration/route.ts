import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generateStoryIllustration } from "@/lib/ai/generate-illustration"
import { rateLimit } from "@/lib/rate-limit"
import type { StoryCategory } from "@/types/database"

// Image generation takes 10-30 seconds — extend the timeout generously.
export const maxDuration = 120

// ──────────────────────────────────────────────────────────────
// Auto-mapping: linked concept name → StoryCategory
// ──────────────────────────────────────────────────────────────
function mapConceptToCategory(name: string | null | undefined): StoryCategory {
  if (!name) return "house"
  const lower = name.toLowerCase()
  if (
    /brunch|frühstück|fruehstueck|dinner|essen|gericht|menü|menue/.test(lower)
  )
    return "dish"
  if (/apero|aperitif|drink|cocktail|wein|bar/.test(lower)) return "drink"
  if (/crew|team|köche|koeche|service|personal/.test(lower)) return "crew"
  if (/reichenbachfall|meiringen|berg|landschaft|haslital|tal/.test(lower))
    return "location"
  // hangar / lounge / haus / manifest / default
  return "house"
}

// ──────────────────────────────────────────────────────────────
// Auto-mapping: platform → optimal aspect ratio
// ──────────────────────────────────────────────────────────────
const PLATFORM_SIZE_MAP: Record<
  string,
  "1024x1024" | "1536x1024" | "1024x1536"
> = {
  instagram: "1024x1024", // square — feed-optimal
  facebook: "1536x1024", // landscape — link-preview-optimal
  tiktok: "1024x1536", // portrait — closest to 9:16
}

/**
 * POST /api/social/[postId]/generate-illustration
 *
 * Body: multipart/form-data
 *   - file?       optional source photo (image-to-image mode)
 *   - hint?       extra style hint from the modal
 *   - size?       optional override of the auto-mapped size
 *   - category?   optional override of the auto-mapped StoryCategory
 *
 * Reuses generateStoryIllustration() — only the surrounding context differs.
 *
 * Flow:
 *   1. Load post + linked concept + linked event for context
 *   2. Auto-map platform → size and concept-name → category (or use overrides)
 *   3. Build a context-rich hint from the linked metadata
 *   4. Call AI Gateway (GPT Image 1.5) at the right aspect ratio
 *   5. Upload PNG to social-images bucket using the same folder convention
 *      as the existing /api/upload route (post-${id.slice(0,8)})
 *   6. Insert metadata row into social_post_images (matches /api/upload pattern)
 *   7. Return { url, path, mode, size, category }
 *
 * The post-detail page reloads images directly from the storage bucket via
 * /api/storage, so the new file appears in the gallery automatically after
 * the modal calls its onSuccess callback (which triggers loadImages).
 */
export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ postId: string }> }
) {
  const rl = rateLimit(request, { scope: "ai-image", max: 10, windowMs: 60_000 })
  if (rl) return rl

  try {
    const { postId } = await ctx.params
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const modalHint = (formData.get("hint") as string) || null
    const sizeOverride = (formData.get("size") as string) || null
    const categoryOverride = (formData.get("category") as string) || null

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 1. Load post with linked concept + event
    const { data: post, error: loadErr } = await supabase
      .from("social_posts")
      .select(
        "id, title, platform, caption, concept:concepts(id, name), event:events(id, title, start_date)"
      )
      .eq("id", postId)
      .single()

    if (loadErr || !post) {
      return NextResponse.json(
        { error: "Social post not found" },
        { status: 404 }
      )
    }

    // The Supabase join returns concept/event as objects (not arrays) when
    // using .single() with FK lookups, but TS infers them as arrays. Cast.
    const concept = (post.concept as unknown as { name?: string } | null) ?? null
    const event = (post.event as unknown as {
      title?: string
      start_date?: string
    } | null) ?? null

    // 2. Auto-map size + category, allow overrides from the modal
    const size =
      (sizeOverride as "1024x1024" | "1536x1024" | "1024x1536" | null) ??
      PLATFORM_SIZE_MAP[post.platform] ??
      "1024x1024"

    const category =
      (categoryOverride as StoryCategory | null) ??
      mapConceptToCategory(concept?.name)

    // 3. Source photo (image-to-image mode)
    let sourcePhoto: Uint8Array | null = null
    let sourcePhotoMediaType: string | null = null
    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer()
      sourcePhoto = new Uint8Array(arrayBuffer)
      sourcePhotoMediaType = file.type || "image/jpeg"
    }

    // 4. Build context-rich hint
    const hintParts = [
      concept?.name ? `Konzept: ${concept.name}` : null,
      event?.title ? `Event: ${event.title}` : null,
      modalHint,
    ].filter(Boolean) as string[]
    const combinedHint = hintParts.length > 0 ? hintParts.join(" — ") : null

    // 5. Generate via AI Gateway (size param flows through to gpt-image-2)
    const result = await generateStoryIllustration({
      category,
      title: post.title || "Dakota Social Post",
      subtitle: concept?.name ? `Für: ${concept.name}` : null,
      contextExcerpt: post.caption?.slice(0, 300) ?? null,
      hint: combinedHint,
      size,
      sourcePhoto,
      sourcePhotoMediaType,
      storyId: post.id,
    })

    // 6. Upload to social-images bucket using the same folder convention
    //    as /api/upload (post-${id.slice(0,8)}) so the existing loadImages()
    //    in post-detail.tsx finds the new file automatically.
    const ext = result.mediaType === "image/jpeg" ? "jpg" : "png"
    const folder = `post-${post.id.substring(0, 8)}`
    const fileName = `${folder}/ai-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from("social-images")
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
      .from("social-images")
      .getPublicUrl(fileName)

    // 7. Insert metadata row in social_post_images — matches /api/upload pattern
    //    so the audit trail is consistent. Display still works without this
    //    (gallery reads from storage), but tracking which images are KI-gen'd
    //    vs manual upload is useful later.
    await supabase.from("social_post_images").insert({
      post_id: post.id,
      storage_path: fileName,
      url: urlData.publicUrl,
      file_name: fileName.split("/").pop(),
      content_type: result.mediaType,
    })

    return NextResponse.json({
      url: urlData.publicUrl,
      path: fileName,
      mode: result.mode,
      size,
      category,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("social generate-illustration error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
