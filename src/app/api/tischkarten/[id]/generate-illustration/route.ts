import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generateStoryIllustration } from "@/lib/ai/generate-illustration"
import { rateLimit } from "@/lib/rate-limit"
import type { TischkartenOccasion } from "@/types/database"

// Image generation takes 10-30 seconds — extend the timeout generously.
export const maxDuration = 120

// ──────────────────────────────────────────────────────────────
// Scene pools per occasion — each generation picks a random scene so
// successive cards for the same occasion look visibly different.
//
// IMPORTANT: No hangar, no airfield, no runway, no airport imagery.
// The Air Lounge is the restaurant inside Hotel Dakota in the village
// centre of Meiringen (Amthausgasse 2) — alpine village atmosphere,
// NOT an airport setting.
// ──────────────────────────────────────────────────────────────

type Scene = { title: string; hint: string }

const OCCASION_SCENES: Record<TischkartenOccasion, Scene[]> = {
  birthday: [
    {
      title: "Hand-drawn birthday table scene with a single lit candle on a small cake",
      hint: "A warm intimate birthday moment: one lit candle on a small rustic cake, wildflowers beside it, soft alpine restaurant atmosphere. Ink and watercolor wash.",
    },
    {
      title: "Birthday greeting scene with wildflowers and a handwritten card",
      hint: "A quiet birthday gesture: a small bouquet of alpine wildflowers, a folded handwritten card, a wooden table surface. Calm, intimate, not festive-loud.",
    },
    {
      title: "Celebration scene with sparkling wine and small gift",
      hint: "Two champagne coupes gently touching, a small wrapped gift with twine, ink-drawn composition on warm wood. Celebratory but restrained.",
    },
    {
      title: "Birthday cake slice on a porcelain plate with a single candle",
      hint: "A single slice of layered cake on a delicate porcelain plate, one small lit candle, a silver fork beside it. Magazine-cover cropped close.",
    },
  ],
  anniversary: [
    {
      title: "Anniversary dinner setting for two with a single rose",
      hint: "Two wine glasses across a wooden table, a single rose, soft candlelight reflected on polished wood. Intimate, warm, not kitschy.",
    },
    {
      title: "Anniversary toast with red wine and linked rings motif",
      hint: "Two hands raising red wine glasses in a toast gesture, linen napkins below, muted warm palette. Line-art with partial watercolor.",
    },
    {
      title: "Anniversary table with candle between two place settings",
      hint: "A single tall candle between two place settings, polished flatware, a folded linen napkin, alpine wood surface. Editorial minimalism.",
    },
    {
      title: "Two wine glasses beside an aged leather-bound book",
      hint: "An aged leather-bound book next to two wine glasses, suggesting years shared. A dried flower as a bookmark. Quiet, nostalgic.",
    },
  ],
  wedding: [
    {
      title: "Elegant wedding toast with champagne flutes and alpine wildflowers",
      hint: "Champagne flutes rising together, a delicate bouquet of alpine wildflowers beside them, linen tablecloth. Festive yet tasteful.",
    },
    {
      title: "Wedding table with tiered cake and delicate florals",
      hint: "A small multi-tier wedding cake with subtle floral decoration, alpine wildflowers around the base, soft watercolor palette.",
    },
    {
      title: "Wedding place setting with calligraphy name card and rose",
      hint: "A place setting with a hand-lettered name card, a single white rose, polished silver, crisp linen. Refined, intimate.",
    },
    {
      title: "Interlocked wedding rings on an open linen napkin",
      hint: "Two plain wedding rings resting on an open folded linen napkin, a sprig of eucalyptus beside them. Minimalist, quiet.",
    },
  ],
  family: [
    {
      title: "Large family table set with shared dishes and bread basket",
      hint: "A generously set long wooden table, several place settings, a woven bread basket at the centre, shared platters. Warm togetherness.",
    },
    {
      title: "Hands passing a serving dish across a family table",
      hint: "Two pairs of hands passing a rustic ceramic serving dish, wooden spoons, a pitcher of water nearby. Everyday warmth.",
    },
    {
      title: "Family-style soup tureen with ladles and multiple bowls",
      hint: "A central soup tureen steaming gently, a wooden ladle, several ceramic bowls around it. Homely and generous.",
    },
    {
      title: "Children's drawing beside the adult place settings",
      hint: "A crayon drawing placed beside adult cutlery, a glass of water with a striped paper straw, warm lamplight hinted. Tender family detail.",
    },
  ],
  business: [
    {
      title: "Professional business dinner setting with notepad beside plate",
      hint: "Crisp white napkin folded precisely, mineral water glass, a closed leather notepad with a pen. Alpine wooden table surface. Polished, calm.",
    },
    {
      title: "Business lunch with espresso cup and leather portfolio",
      hint: "An espresso cup on a saucer, a closed leather portfolio, a fountain pen. Early afternoon light suggested. Understated professional.",
    },
    {
      title: "Two water glasses across a clean business table",
      hint: "Two sparkling water glasses across from each other, linen napkins folded, cutlery placed precisely. Minimal, serious, respectful.",
    },
    {
      title: "Business dinner table with single orchid and menu card",
      hint: "A single white orchid stem in a narrow vase, a closed menu card, a wine glass set for tasting. Quietly refined.",
    },
  ],
  none: [
    {
      title: "Welcome table in the Air Lounge with bread basket and candle",
      hint: "A beautifully set table in an alpine village restaurant: a woven bread basket, a lit candle, a small herb sprig, soft window light suggested. Wood panelling hinted.",
    },
    {
      title: "Wine glasses and bread on a wooden table with window light",
      hint: "Two wine glasses and a sliced rustic loaf on a wooden surface, a linen napkin, warm daylight falling from the side. Village-inn atmosphere, NOT hangar or airport.",
    },
    {
      title: "Alpine tea service with herbal sprigs and honey jar",
      hint: "A ceramic teapot, two small cups, a honey jar with a wooden dipper, fresh herb sprigs. Cozy, quiet, grounded in Meiringen village warmth.",
    },
    {
      title: "Mountain view through a window with a cup of coffee in foreground",
      hint: "A coffee cup and saucer in the foreground, a window behind it framing the Haslital mountains with loose line-art peaks. Soft watercolor sky. Arrival, rest.",
    },
    {
      title: "Open recipe book beside a small vase of alpine wildflowers",
      hint: "An open handwritten recipe book, a small glass vase with alpine wildflowers, a wooden spoon. Restaurant-kitchen warmth, editorial crop.",
    },
  ],
}

function pickScene(occasion: TischkartenOccasion): Scene {
  const pool = OCCASION_SCENES[occasion]
  const idx = Math.floor(Math.random() * pool.length)
  return pool[idx]
}

/**
 * POST /api/tischkarten/[id]/generate-illustration
 *
 * Generates an occasion-specific KI illustration for a Tischkarte.
 * Each call picks a fresh random scene from the pool so re-generating
 * the image produces a visibly different illustration.
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

    // 2. Source photo (image-to-image when the user uploaded a reference)
    let sourcePhoto: Uint8Array | null = null
    let sourcePhotoMediaType: string | null = null
    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer()
      sourcePhoto = new Uint8Array(arrayBuffer)
      sourcePhotoMediaType = file.type || "image/jpeg"
    }

    // 3. Build occasion-specific prompt with a RANDOM scene for variety
    const occasion = (tischkarte.occasion as TischkartenOccasion) || "none"
    const scene = pickScene(occasion)

    // Anti-hangar guard appended to every prompt so the image model can't drift
    // back to airport imagery even when the story text mentions "Dakota".
    const LOCATION_GUARDRAIL =
      "SETTING: alpine village restaurant in Meiringen (Berner Oberland). NEVER depict a hangar, airport, airfield, runway, airplane, aircraft or aviation scenery. The restaurant is inside Hotel Dakota in the village centre — cozy wood-panelled inn, NOT an aircraft hangar."

    const combinedHint = [
      scene.hint,
      LOCATION_GUARDRAIL,
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
      scene: scene.title,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("tischkarten generate-illustration error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
