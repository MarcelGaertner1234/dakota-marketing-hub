/**
 * Generates the personalized social media caption for a Dakota post.
 *
 * Routes through Vercel AI Gateway using anthropic/claude-haiku-4.5 — same
 * model as the Tischkarten text generator. Cheap (~$0.001 per call), fast
 * (~2s), excellent at following the Dakota voice instructions.
 *
 * Output is strictly typed via generateObject + Zod, so the calling
 * server-action can rely on { caption, hashtags } shape.
 */

import { generateObject } from "ai"
import { z } from "zod"
import type { PlatformType } from "@/types/database"

// Verified against https://ai-gateway.vercel.sh/v1/models — slug uses DOT.
const TEXT_MODEL = "anthropic/claude-haiku-4.5"

// ──────────────────────────────────────────────────────────────
// Output schema
// ──────────────────────────────────────────────────────────────
const SocialCaptionSchema = z.object({
  caption: z
    .string()
    .min(20)
    .max(2000)
    .describe(
      "Der vollständige Caption-Text in Dakota-Stimme — warm, persönlich, lokal verankert. Ohne Hashtags am Ende (die kommen separat). Plattform-spezifisch in Länge und Tonalität."
    ),
  hashtags: z
    .array(z.string().min(2).max(30))
    .min(3)
    .max(10)
    .describe(
      "Hashtags ohne #-Zeichen, nur die Wörter. Lokal relevant (meiringen, berneroberland), markenspezifisch (dakotameiringen, hangarmeiringen) und thematisch passend zum Post."
    ),
})

export type GeneratedSocialCaption = z.infer<typeof SocialCaptionSchema>

// ──────────────────────────────────────────────────────────────
// Voice / System Prompt — Dakota voice + plattformspezifische Tonalität
// ──────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Du schreibst Social Media Captions für das Dakota Air Lounge — ein Restaurant in einem alten Flugzeug-Hangar in Meiringen, Berner Oberland, Schweiz.

DIE STIMME DAKOTA (gilt für ALLE Plattformen):
- Warm, persönlich, nahbar — wie ein Brief von guten Freunden
- Schweizerisches Hochdeutsch, NIE Mundart, nie Anglizismen
- Klar und schlicht — keine Floskeln, keine Marketing-Sprache, keine Superlative
- Lokal verankert: Meiringen, Reichenbachfall, Berner Oberland, der alte Hangar, das Flugzeug "Dakota"
- Die Crew ist eine Familie, nicht ein "Service-Team"
- Keine Übertreibungen ("unvergesslich", "einzigartig", "Highlight")
- Keine standardisierten Floskeln ("Wir freuen uns auf euren Besuch")
- Emojis nur sparsam und nur wenn sie wirklich passen (max. 2-3 pro Caption)

PLATTFORM-SPEZIFISCHE REGELN:

INSTAGRAM:
- Format: 1-3 kurze Absätze, jeder Absatz max. 2 Sätze
- Hook in Zeile 1 — eine Beobachtung, eine Frage, ein Bild im Kopf, NICHT der Anlass
- Maximal 800 Zeichen Caption
- 5-8 Hashtags
- Visuell-zuerst-Denken: das Bild trägt, der Text ergänzt
- Beispiel-Hook: "Sonntagmorgen im Hangar." oder "Zwölf warme Eierspeisen."

FACEBOOK:
- Format: 2-4 längere Absätze
- Erzählerischer, mehr Substanz, Community-Feel
- Maximal 1500 Zeichen Caption
- 3-5 Hashtags (Facebook-User klicken seltener auf Hashtags)
- Klarer CTA am Ende erlaubt: "Reservation lohnt sich" / "Wer dabei sein will, meldet sich"
- Beispiel-Opener: "Für alle die den Sonntag langsam mögen..."

TIKTOK:
- Format: 1-2 punchy Sätze, Maximum 200 Zeichen
- Hook in Zeile 1 muss in den ersten 3 Sekunden funktionieren
- 3-5 trendige Hashtags die das Thema präzise treffen
- Konversationeller, jugendlicher Ton — aber keine Überdrehtheit
- Beispiel: "Wir haben einen alten Hangar in einen Brunch-Tempel verwandelt."

WAS DU NIE TUN DARFST:
- Keine Aufzählung von Gerichten oder Werbung
- Keine Fragen die wie eine Verkaufsfrage klingen
- Keine Sterne, keine "5/5"-Wertungen
- Keine Hashtags MITTEN im Caption-Text — die kommen separat
- Keine Links (die werden später manuell ergänzt wenn nötig)`

// ──────────────────────────────────────────────────────────────
// Input
// ──────────────────────────────────────────────────────────────
export interface GenerateSocialCaptionInput {
  platform: PlatformType
  postTitle?: string | null
  conceptName?: string | null
  eventTitle?: string | null
  eventDate?: string | null
  scheduledDate?: string | null
  customHint?: string | null
}

// ──────────────────────────────────────────────────────────────
// Main function
// ──────────────────────────────────────────────────────────────
export async function generateSocialCaption(
  input: GenerateSocialCaptionInput
): Promise<GeneratedSocialCaption> {
  const userPromptParts: string[] = [
    `Schreibe eine Social Media Caption für die Plattform: ${input.platform.toUpperCase()}`,
    "",
  ]

  if (input.postTitle) {
    userPromptParts.push(`Post-Titel / Thema: ${input.postTitle}`)
  }
  if (input.conceptName) {
    userPromptParts.push(`Konzept: ${input.conceptName}`)
  }
  if (input.eventTitle) {
    userPromptParts.push(`Event: ${input.eventTitle}`)
  }

  // Format date as German "Sonntag, 7. April 2026"
  const dateString = input.eventDate ?? input.scheduledDate
  if (dateString) {
    try {
      const d = new Date(dateString)
      const formatted = d.toLocaleDateString("de-CH", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
      userPromptParts.push(`Datum: ${formatted}`)
    } catch {
      userPromptParts.push(`Datum: ${dateString}`)
    }
  }

  if (input.customHint && input.customHint.trim().length > 0) {
    userPromptParts.push("")
    userPromptParts.push(`Hinweis von der Crew: ${input.customHint.trim()}`)
  }

  userPromptParts.push(
    "",
    `Verfasse Caption + 3-10 Hashtags strikt nach den ${input.platform.toUpperCase()}-Regeln aus dem System-Prompt. Im Dakota-Ton, lokal verankert, ohne Marketing-Floskeln.`
  )

  const userPrompt = userPromptParts.join("\n")

  const result = await generateObject({
    model: TEXT_MODEL,
    schema: SocialCaptionSchema,
    system: SYSTEM_PROMPT,
    prompt: userPrompt,
    temperature: 0.85,
    providerOptions: {
      gateway: {
        tags: [
          "feature:social-caption",
          `platform:${input.platform}`,
          ...(input.conceptName
            ? [`concept:${input.conceptName.toLowerCase().replace(/\s+/g, "-")}`]
            : []),
        ],
      },
    },
  })

  return result.object
}
