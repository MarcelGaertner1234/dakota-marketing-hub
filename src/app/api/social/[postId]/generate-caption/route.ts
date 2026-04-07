import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generateSocialCaption } from "@/lib/ai/generate-social-caption"
import type { PlatformType } from "@/types/database"

// Text generation is fast (~2s) but allow some headroom.
export const maxDuration = 60

/**
 * POST /api/social/[postId]/generate-caption
 *
 * Body: multipart/form-data
 *   - hint?    optional extra context from Marcel ("Fokus auf Familien",
 *              "Erwähn das Wetter", etc.)
 *
 * Reads the post + linked concept + linked event from Supabase, builds
 * a context-rich prompt, calls the Dakota-voice text generator and
 * returns the result WITHOUT persisting it.
 *
 * The modal previews the generated caption + hashtags so Marcel can
 * regenerate, then explicitly clicks "Übernehmen" — at which point the
 * modal calls updateSocialPost() (existing server action) to persist.
 *
 * This separation gives Marcel safe regeneration without overwriting
 * his existing manual caption until he confirms.
 */
export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await ctx.params
    const formData = await request.formData()
    const hint = (formData.get("hint") as string) || null

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: post, error: loadErr } = await supabase
      .from("social_posts")
      .select(
        "id, title, platform, scheduled_at, concept:concepts(id, name), event:events(id, title, start_date)"
      )
      .eq("id", postId)
      .single()

    if (loadErr || !post) {
      return NextResponse.json(
        { error: "Social post not found" },
        { status: 404 }
      )
    }

    // Cast joined records (Supabase types as arrays, runtime returns objects).
    const concept = (post.concept as unknown as { name?: string } | null) ?? null
    const event = (post.event as unknown as {
      title?: string
      start_date?: string
    } | null) ?? null

    const result = await generateSocialCaption({
      platform: post.platform as PlatformType,
      postTitle: post.title,
      conceptName: concept?.name ?? null,
      eventTitle: event?.title ?? null,
      eventDate: event?.start_date ?? null,
      scheduledDate: post.scheduled_at,
      customHint: hint,
    })

    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("social generate-caption error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
