/**
 * Generates a hand-drawn illustration for a Dakota Story in the
 * Chesa-Rosatsch aesthetic — either from a photo (image-to-image) or
 * from text alone (when no photo is provided).
 *
 * Routes through Vercel AI Gateway using Google Gemini 3.1 Flash Image Preview
 * — the 2026 default for multimodal image generation via AI Gateway.
 *
 * Authentication: OIDC via VERCEL_OIDC_TOKEN (the recommended default).
 * The ai-sdk picks it up automatically — no provider-specific API keys.
 *
 * Setup (one-time):
 *   1. vercel link                 (done — .vercel/ exists in the repo)
 *   2. Enable AI Gateway in Vercel dashboard → project settings
 *   3. vercel env pull .env.local  (writes VERCEL_OIDC_TOKEN, 24h validity)
 *   4. On Vercel production, OIDC tokens auto-refresh — zero maintenance
 *
 * When the local OIDC token expires (~24h), re-run `vercel env pull .env.local`.
 */

import { experimental_generateImage as generateImage } from "ai"
import type { StoryCategory } from "@/types/database"

// ──────────────────────────────────────────────────────────────
// STYLE PROMPT — based on Chesa Rosatsch reference illustrations
// (Hatecke madürà, Vogelnest — fine ink + partial watercolor wash)
// ──────────────────────────────────────────────────────────────

const BASE_STYLE = `Render this as a delicate hand-drawn editorial illustration in a vintage Swiss alpine mountain-inn culinary menu aesthetic.

TECHNIQUE:
- Fine dip-pen ink line-art with slightly tremoring organic strokes
- Gentle partial watercolor washes in natural muted tones: warm ochres, soft sage greens, terracotta, cream, light grays, muted blues
- Some areas intentionally left uncolored so ink lines breathe
- Pure white background (no scenery, no texture, no patterns)
- Subject in slight 3/4 perspective from above
- TIGHT CROP: the subject MUST fill the entire frame from edge to edge. The subject touches or nearly touches the top, bottom, left, and right edges of the image. NO whitespace margins around the subject. The subject IS the entire image — not a tiny element floating in empty space.
- Compose like a magazine cover photograph cropped tight, with the subject zoomed in to fill 95% of the frame
- Editorial minimalism — shadows suggested, not heavy
- Elegant and intimate, hand-painted recipe card feel
- Never photographic, never cartoonish

COMPOSITION:
- Single subject isolated on pure white
- No text, no captions, no frames, no borders, no decorative elements
- No props or additional scenery beyond the main subject
- No brand names, no product packaging, no labels

Preserve the subject's essential identity while rendering it entirely in this hand-drawn aesthetic. Focus on the form, ingredients, and materials — not any branding or packaging from the reference.`

const CATEGORY_HINTS: Record<StoryCategory, string> = {
  dish: "Render the plated dish showing its ingredients and textures. Partial watercolor coloring on the food — the plate itself mostly line-art with minimal wash.",
  drink:
    "Render the glass or cup showing transparent liquid with subtle color hints. Garnish gently colored. The glass itself mostly line-art.",
  house:
    "Render the architectural or interior element emphasizing materials (wood grain, stone, glass) through line variation. Partial watercolor hints on surfaces.",
  crew: "Render a stylized gesture — hands at work, a chef's tool, an apron detail. Minimal face details if any. Suggestive rather than photographic.",
  location:
    "Render the landscape or place element with atmospheric minimalism. Lines suggest depth without filling areas. Very light watercolor hints only.",
}

// Default model — GPT Image 1.5 via AI Gateway.
// OpenAI's 2026 state-of-the-art image model with excellent instruction
// following and prompt adherence — crucial for the Chesa Rosatsch style.
// Change this single string to swap providers without touching the rest.
//
// Alternatives:
//   - "openai/gpt-image-1"              (older, cheaper)
//   - "google/gemini-3.1-flash-image-preview"  (fast, cheap, preview status)
const IMAGE_MODEL = "openai/gpt-image-1.5"

// ──────────────────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────────────────

export interface GenerateIllustrationInput {
  category: StoryCategory
  /** Story title — used for context */
  title: string
  /** Optional subtitle for richer context */
  subtitle?: string | null
  /** Optional excerpt from paragraph 1 (kept short) */
  contextExcerpt?: string | null
  /** Optional user hint for fine-tuning ("more rustic", "cooler tones", etc.) */
  hint?: string | null
  /** Optional source photo as Uint8Array — when provided, does image-to-image transform */
  sourcePhoto?: Uint8Array | null
  /** Optional MIME type of the source photo (e.g. "image/png", "image/jpeg") */
  sourcePhotoMediaType?: string | null
  /** Optional story id for tracking/tagging (cost attribution per story) */
  storyId?: string
}

export interface GenerateIllustrationResult {
  /** PNG/JPEG image as Uint8Array, ready to upload to Supabase Storage */
  imageData: Uint8Array
  /** Media type of the generated image */
  mediaType: string
  /** Whether image-to-image (with photo) or text-to-image was used */
  mode: "edit" | "text"
}

// ──────────────────────────────────────────────────────────────
// MAIN GENERATION FUNCTION
// ──────────────────────────────────────────────────────────────

export async function generateStoryIllustration(
  input: GenerateIllustrationInput
): Promise<GenerateIllustrationResult> {
  const subjectDescription = [
    `Story title: "${input.title}"`,
    input.subtitle ? `Subtitle: "${input.subtitle}"` : null,
    input.contextExcerpt ? `Context: ${input.contextExcerpt}` : null,
  ]
    .filter(Boolean)
    .join("\n")

  const fullPrompt = [
    BASE_STYLE,
    "",
    "CATEGORY-SPECIFIC GUIDANCE:",
    CATEGORY_HINTS[input.category],
    "",
    "STORY CONTEXT (for subject identification):",
    subjectDescription,
    input.hint ? `\nUSER HINT: ${input.hint}` : "",
  ].join("\n")

  const hasPhoto = !!input.sourcePhoto && input.sourcePhoto.length > 0
  const mode: "edit" | "text" = hasPhoto ? "edit" : "text"

  // GPT Image 1.5 is an image-only model — use experimental_generateImage,
  // not generateText. For image-edit mode, pass a prompt object with
  // { text, images }. For text-only mode, pass a plain string prompt.
  const result = await generateImage({
    model: IMAGE_MODEL,
    prompt: hasPhoto
      ? {
          text: fullPrompt,
          images: [input.sourcePhoto!],
        }
      : fullPrompt,
    size: "1536x1024",
    providerOptions: {
      openai: { quality: "high" },
      gateway: {
        tags: [
          "feature:story-illustration",
          `category:${input.category}`,
          `mode:${mode}`,
          ...(input.storyId ? [`story:${input.storyId}`] : []),
        ],
      },
    },
  })

  // experimental_generateImage returns { image } (singular) for single generations.
  // Handle both shapes defensively in case SDK behavior varies.
  const generated =
    (result as unknown as { image?: { uint8Array: Uint8Array; mediaType?: string } }).image ??
    (result as unknown as { images?: Array<{ uint8Array: Uint8Array; mediaType?: string }> }).images?.[0]

  if (!generated) {
    throw new Error(
      "AI Gateway returned no image. Check model slug and API key."
    )
  }

  return {
    imageData: generated.uint8Array,
    mediaType: generated.mediaType ?? "image/png",
    mode,
  }
}
