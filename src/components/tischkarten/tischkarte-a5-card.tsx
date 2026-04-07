import { StoryA5Card } from "@/components/stories/story-a5-card"
import type { Tischkarte } from "@/types/database"

/**
 * Default-Illustration für Tischkarten ohne eigenes KI-Bild.
 * Liegt unter public/branding/ — wird ein-mal initial via Script generiert
 * (siehe scripts/generate-tischkarten-default.mjs).
 */
const DEFAULT_ILLUSTRATION = "/branding/tischkarten-default.png"

/**
 * TischkarteA5Card — dünner Wrapper um StoryA5Card.
 *
 * Mappt eine Tischkarte 1:1 auf das Story-Card-Shape (gleiche Feldnamen),
 * fällt für die Illustration auf das Default-Bild zurück wenn nichts
 * KI-generiert wurde.
 *
 * Bewusst ein eigener Wrapper statt Refactor von StoryA5Card —
 * null Risiko für den existierenden Stories-Stack.
 */
export function TischkarteA5Card({
  tischkarte,
  scale = 1,
}: {
  tischkarte: Tischkarte
  scale?: number
}) {
  return (
    <StoryA5Card
      story={{
        title: tischkarte.title,
        subtitle: tischkarte.subtitle,
        paragraph_1: tischkarte.paragraph_1,
        paragraph_2: tischkarte.paragraph_2,
        paragraph_3: tischkarte.paragraph_3,
        illustration_url:
          tischkarte.illustration_url ?? DEFAULT_ILLUSTRATION,
        footer_signature: tischkarte.footer_signature,
      }}
      scale={scale}
    />
  )
}
