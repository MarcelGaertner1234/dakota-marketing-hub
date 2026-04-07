/**
 * Generates the personalized welcome text for a Dakota Tischkarte.
 *
 * Routes through Vercel AI Gateway using a small fast model — text generation
 * is cheap (~$0.001 per call) and fast (~2s) so Marcel can iterate at the
 * speed of "Name eintippen → Generieren → drucken".
 *
 * Authentication: same OIDC token / AI_GATEWAY_API_KEY as the existing
 * generate-illustration.ts — no extra env setup required.
 *
 * Output is strictly typed via generateObject + Zod, so the calling
 * server-action can rely on the shape and never has to parse free text.
 */

import { generateObject } from "ai"
import { z } from "zod"
import type { TischkartenOccasion } from "@/types/database"

// ──────────────────────────────────────────────────────────────
// Model — small, fast, instruction-following
// ──────────────────────────────────────────────────────────────
// Anthropic Claude Haiku 4.5 via AI Gateway. Excellent at following
// the Dakota voice instructions, generates warm German prose, ~2s/call.
// Verified against https://ai-gateway.vercel.sh/v1/models — slug uses DOT
// (claude-haiku-4.5), not hyphen. Updating this single string swaps providers.
const TEXT_MODEL = "anthropic/claude-haiku-4.5"

// ──────────────────────────────────────────────────────────────
// Output shape — what the LLM must return
// ──────────────────────────────────────────────────────────────
const TischkarteTextSchema = z.object({
  title: z
    .string()
    .min(3)
    .max(80)
    .describe(
      "Warmer persönlicher Titel, idealerweise mit dem Gastnamen. Z.B. 'Willkommen, Familie Müller' oder 'Schön, dass ihr da seid'."
    ),
  paragraph_1: z
    .string()
    .min(40)
    .max(400)
    .describe(
      "Erster Absatz: warmes Willkommen, das den Anlass aufgreift wenn vorhanden. Spricht den Gast persönlich an."
    ),
  paragraph_2: z
    .string()
    .min(40)
    .max(400)
    .describe(
      "Zweiter Absatz: erzählt etwas vom Dakota — der Hangar, Meiringen, das Gefühl des Ankommens. Webt eine kleine Geschichte."
    ),
  paragraph_3: z
    .string()
    .min(20)
    .max(300)
    .describe(
      "Dritter Absatz: kurzer, herzlicher Schlusssatz. Wunsch für den Abend, eine Einladung sich zuhause zu fühlen."
    ),
})

export type GeneratedTischkarteText = z.infer<typeof TischkarteTextSchema>

// ──────────────────────────────────────────────────────────────
// Voice / System Prompt — definiert die Dakota-Stimme
// ──────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Du schreibst persönliche Willkommens-Texte für Tischkarten im Dakota Air Lounge — einem Restaurant in einem alten Flugzeug-Hangar in Meiringen, Berner Oberland, Schweiz.

DIE STIMME DAKOTA:
- Warm, persönlich, nahbar — wie ein Brief von guten Freunden
- Schweizerisches Hochdeutsch, NIE Mundart, nie Anglizismen
- Du-Form bei Familien und privaten Anlässen, Sie-Form bei Geschäftsessen
- Klar und schlicht — keine Floskeln, keine Marketing-Sprache, keine Superlative
- Lokal verankert: Meiringen, Reichenbachfall, Berner Oberland, der alte Hangar, das Flugzeug "Dakota"
- Die Crew ist eine Familie, nicht ein "Service-Team"

WAS DIE KARTE LEISTEN SOLL:
- Den Gast beim Eintreffen am Tisch persönlich begrüssen
- Das Gefühl vermitteln "wir haben auf euch gewartet, ihr seid hier richtig"
- Den Anlass beiläufig aufgreifen wenn vorhanden, aber nicht überladen
- Eine kleine Atmosphäre schaffen — der Hangar, das Licht, das Ankommen

WAS DU NIE TUN DARFST:
- Keine Übertreibungen ("unvergesslicher Abend", "kulinarisches Highlight")
- Keine standardisierten Floskeln ("Wir wünschen Ihnen einen schönen Aufenthalt")
- Keine Aufzählung von Gerichten oder Werbung
- Keine Fragen an den Gast
- Keine Emojis, keine Sterne, keine Sonderzeichen ausser normaler Satzzeichen
- Nicht mehrere Anliegen in einen Satz packen

LÄNGE: Drei Absätze, jeder 2-4 Sätze. Kompakt, lesbar, leise.`

// ──────────────────────────────────────────────────────────────
// Input Type
// ──────────────────────────────────────────────────────────────
export interface GenerateTischkarteTextInput {
  guestName: string
  occasion?: TischkartenOccasion | null
  partySize?: number | null
  reservationDate?: string | null
  customHint?: string | null
}

const OCCASION_LABELS: Record<TischkartenOccasion, string> = {
  birthday: "Geburtstag",
  anniversary: "Jahrestag",
  business: "Geschäftsessen",
  family: "Familienfeier",
  wedding: "Hochzeit",
  none: "kein besonderer Anlass",
}

// ──────────────────────────────────────────────────────────────
// Main Function
// ──────────────────────────────────────────────────────────────
export async function generateTischkarteText(
  input: GenerateTischkarteTextInput
): Promise<GeneratedTischkarteText> {
  const userPromptParts: string[] = [
    `Schreibe eine persönliche Tischkarte für: ${input.guestName}`,
  ]

  if (input.occasion && input.occasion !== "none") {
    userPromptParts.push(`Anlass: ${OCCASION_LABELS[input.occasion]}`)
  }

  if (input.partySize && input.partySize > 0) {
    userPromptParts.push(
      `Personenanzahl: ${input.partySize} ${input.partySize === 1 ? "Person" : "Personen"}`
    )
  }

  if (input.reservationDate) {
    // Format date as German "Sonntag, 7. April 2026"
    try {
      const d = new Date(input.reservationDate)
      const formatted = d.toLocaleDateString("de-CH", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
      userPromptParts.push(`Datum der Reservierung: ${formatted}`)
    } catch {
      userPromptParts.push(`Datum der Reservierung: ${input.reservationDate}`)
    }
  }

  if (input.customHint && input.customHint.trim().length > 0) {
    userPromptParts.push(
      `Zusätzlicher Kontext von der Crew: ${input.customHint.trim()}`
    )
  }

  userPromptParts.push(
    "",
    "Verfasse Titel und drei Absätze gemäss dem strikten Schema. Personalisiert, warm, im Dakota-Ton."
  )

  const userPrompt = userPromptParts.join("\n")

  const result = await generateObject({
    model: TEXT_MODEL,
    schema: TischkarteTextSchema,
    system: SYSTEM_PROMPT,
    prompt: userPrompt,
    temperature: 0.8,
    providerOptions: {
      gateway: {
        tags: [
          "feature:tischkarte-text",
          `occasion:${input.occasion ?? "none"}`,
        ],
      },
    },
  })

  return result.object
}
