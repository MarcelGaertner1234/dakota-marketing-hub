#!/usr/bin/env node
/**
 * One-time script: generates the default Tischkarten welcome illustration
 * via Vercel AI Gateway (OpenAI gpt-image-1.5) and writes it to
 * public/branding/tischkarten-default.png
 *
 * Usage:
 *   node scripts/generate-tischkarten-default.mjs
 *
 * Requires: AI_GATEWAY_API_KEY in .env.local (already configured for stories)
 *
 * Cost: ~$0.20 (one image at 1536×1024 high quality, one-time)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs"
import { resolve, dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Manually parse .env.local (same pattern as existing seed scripts) ──
const envFile = readFileSync(join(__dirname, "..", ".env.local"), "utf-8")
const env = Object.fromEntries(
  envFile
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=")
      return [
        l.slice(0, idx).trim(),
        l
          .slice(idx + 1)
          .trim()
          .replace(/^["']|["']$/g, ""),
      ]
    })
)

// Inject into process.env so the AI SDK picks up AI_GATEWAY_API_KEY automatically
for (const [k, v] of Object.entries(env)) {
  if (!process.env[k]) process.env[k] = v
}

if (!process.env.AI_GATEWAY_API_KEY) {
  console.error(
    "[generate-tischkarten-default] ERROR: AI_GATEWAY_API_KEY missing in .env.local"
  )
  process.exit(1)
}

// ── Now import the AI SDK (after env is set) ──
const { experimental_generateImage: generateImage } = await import("ai")

const OUTPUT_PATH = resolve(
  __dirname,
  "..",
  "public",
  "branding",
  "tischkarten-default.png"
)

const PROMPT = `Render this as a delicate hand-drawn editorial illustration in a vintage Swiss alpine mountain-inn culinary menu aesthetic.

SUBJECT: A warm welcome scene at a restaurant table inside an old DC-3 Dakota airplane hangar in Meiringen, Swiss Alps. The composition shows a beautifully set wooden bistro table viewed from a slight 3/4 angle from above: two stemmed wine glasses with subtle red wine, a small candle with a soft warm glow, a basket with rustic bread, a folded linen napkin, a sprig of alpine herbs, and the soft suggestion of mountain peaks visible through a hangar window in the far background. No people. The atmosphere is intimate, welcoming, and quiet — the moment just before guests arrive.

TECHNIQUE:
- Fine dip-pen ink line-art with slightly tremoring organic strokes
- Gentle partial watercolor washes in natural muted tones: warm ochres, soft sage greens, terracotta, cream, light grays, muted blues
- Some areas intentionally left uncolored so ink lines breathe
- Pure white background (no scenery patterns)
- Editorial minimalism — shadows suggested, not heavy
- Elegant and intimate, hand-painted recipe card feel
- Never photographic, never cartoonish

COMPOSITION:
- TIGHT CROP: the subject MUST fill the entire frame from edge to edge. The subject touches or nearly touches the top, bottom, left, and right edges of the image. NO whitespace margins around the subject.
- Compose like a magazine cover photograph cropped tight, with the subject zoomed in to fill 95% of the frame
- No text, no captions, no frames, no borders, no decorative elements
- No brand names, no product packaging, no labels`

console.log("[generate-tischkarten-default] Output:", OUTPUT_PATH)
console.log(
  "[generate-tischkarten-default] Calling AI Gateway → openai/gpt-image-1.5 ..."
)
console.log(
  "[generate-tischkarten-default] (~15-30s, ~$0.20)"
)

const dir = dirname(OUTPUT_PATH)
if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

const start = Date.now()
const result = await generateImage({
  model: "openai/gpt-image-1.5",
  prompt: PROMPT,
  size: "1536x1024",
  providerOptions: {
    openai: { quality: "high" },
    gateway: {
      tags: ["feature:tischkarte-default", "mode:setup"],
    },
  },
})
const elapsed = ((Date.now() - start) / 1000).toFixed(1)
console.log(`[generate-tischkarten-default] Generated in ${elapsed}s`)

const generated =
  result.image ?? (result.images && result.images[0]) ?? null

if (!generated || !generated.uint8Array) {
  console.error(
    "[generate-tischkarten-default] ERROR: AI Gateway returned no image. Raw result keys:",
    Object.keys(result)
  )
  process.exit(1)
}

writeFileSync(OUTPUT_PATH, generated.uint8Array)
const sizeKb = (generated.uint8Array.length / 1024).toFixed(1)
console.log(
  `[generate-tischkarten-default] ✓ Wrote ${sizeKb}KB to ${OUTPUT_PATH}`
)
