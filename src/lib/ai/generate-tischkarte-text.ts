/**
 * Generates the personalized welcome text for a Dakota Tischkarte.
 *
 * Supports 4 languages: de, en, fr, it.
 * Routes through Vercel AI Gateway using a small fast model.
 */

import { generateObject } from "ai"
import { z } from "zod"
import type { TischkartenOccasion, TischkartenLanguage } from "@/types/database"

// ──────────────────────────────────────────────────────────────
// Model
// ──────────────────────────────────────────────────────────────
const TEXT_MODEL = "anthropic/claude-haiku-4.5"

// ──────────────────────────────────────────────────────────────
// Output shape
// ──────────────────────────────────────────────────────────────
const TischkarteTextSchema = z.object({
  title: z
    .string()
    .min(3)
    .max(80)
    .describe(
      "Warm personal title, ideally with the guest's name."
    ),
  paragraph_1: z
    .string()
    .min(40)
    .max(400)
    .describe(
      "First paragraph: warm welcome referencing the occasion if present."
    ),
  paragraph_2: z
    .string()
    .min(40)
    .max(400)
    .describe(
      "Second paragraph: tells something about the Dakota — Meiringen, the house, the feeling of arriving. Never use the word 'hangar'."
    ),
  paragraph_3: z
    .string()
    .min(20)
    .max(300)
    .describe(
      "Third paragraph: short heartfelt closing. A wish for the evening."
    ),
})

export type GeneratedTischkarteText = z.infer<typeof TischkarteTextSchema>

// ──────────────────────────────────────────────────────────────
// Language-specific voice prompts
// ──────────────────────────────────────────────────────────────

const SYSTEM_PROMPTS: Record<TischkartenLanguage, string> = {
  de: `Du schreibst persoenliche Willkommens-Texte fuer Tischkarten im Dakota Air Lounge — einem Restaurant am Flugfeld in Meiringen, Berner Oberland, Schweiz, benannt nach dem legendaeren Flugzeug "Dakota" (DC-3).

DIE STIMME DAKOTA:
- Warm, persoenlich, nahbar — wie ein Brief von guten Freunden
- Schweizerisches Hochdeutsch, NIE Mundart, nie Anglizismen
- Du-Form bei Familien und privaten Anlaessen, Sie-Form bei Geschaeftsessen
- Klar und schlicht — keine Floskeln, keine Marketing-Sprache, keine Superlative
- Lokal verankert: Meiringen, Reichenbachfall, Berner Oberland, das Haus am Flugfeld, das Flugzeug "Dakota"
- Die Crew ist eine Familie, nicht ein "Service-Team"

WAS DIE KARTE LEISTEN SOLL:
- Den Gast beim Eintreffen am Tisch persoenlich begruessen
- Das Gefuehl vermitteln "wir haben auf euch gewartet, ihr seid hier richtig"
- Den Anlass konkret aufgreifen und persoenlich auf die mitgegebenen Details eingehen
- Eine kleine Atmosphaere schaffen — das Licht, die Weite, das Ankommen

WAS DU NIE TUN DARFST:
- NIE das Wort "Hangar" verwenden — nenne es stattdessen "die Dakota", "das Haus", "unser Platz" oder "die Lounge"
- Keine Uebertreibungen ("unvergesslicher Abend", "kulinarisches Highlight")
- Keine standardisierten Floskeln ("Wir wuenschen Ihnen einen schoenen Aufenthalt")
- Keine Aufzaehlung von Gerichten oder Werbung
- Keine Fragen an den Gast
- Keine Emojis, keine Sterne, keine Sonderzeichen ausser normaler Satzzeichen
- Nicht mehrere Anliegen in einen Satz packen
- Kein Zwei-Absatz-Floskel-Schema — wenn der Gast-Kontext reich ist, mach den zweiten Absatz konkret ueber den Gast statt generisch ueber das Haus

LAENGE: Drei Absaetze, jeder 2-4 Saetze. Kompakt, lesbar, leise.`,

  en: `You write personal welcome cards for guests at the Dakota Air Lounge — a restaurant at the airfield in Meiringen, Bernese Oberland, Switzerland, named after the legendary "Dakota" aircraft (DC-3).

THE DAKOTA VOICE:
- Warm, personal, approachable — like a letter from good friends
- Elegant but not formal — conversational English, no corporate speak
- Locally rooted: Meiringen, Reichenbach Falls, Bernese Oberland, the house at the airfield, the "Dakota" airplane
- The crew is a family, not a "service team"

WHAT THE CARD SHOULD DO:
- Greet the guest personally as they arrive at their table
- Convey the feeling "we've been waiting for you, you're in the right place"
- Weave in the specific details given about the guest concretely — not generically
- Create a sense of atmosphere — the light, the wide view, the feeling of arrival

WHAT YOU MUST NEVER DO:
- NEVER use the word "hangar" — say "the Dakota", "the house", "our place" or "the lounge" instead
- No exaggerations ("unforgettable evening", "culinary highlight")
- No stock phrases ("We wish you a pleasant stay")
- No listing of dishes or advertising
- No questions to the guest
- No emojis, no stars, no special characters beyond normal punctuation

LENGTH: Three paragraphs, 2-4 sentences each. Compact, readable, quiet.`,

  fr: `Tu ecris des cartes de bienvenue personnalisees pour les hotes du Dakota Air Lounge — un restaurant situe au terrain d'aviation de Meiringen, dans l'Oberland bernois, en Suisse, nomme d'apres le legendaire avion "Dakota" (DC-3).

LA VOIX DAKOTA:
- Chaleureuse, personnelle, accessible — comme une lettre de bons amis
- Francais elegant mais pas guinde — ni trop familier, ni corporatif
- Ancre localement: Meiringen, les chutes du Reichenbach, l'Oberland bernois, la maison au terrain d'aviation, l'avion "Dakota"
- L'equipe est une famille, pas un "personnel de service"

CE QUE LA CARTE DOIT ACCOMPLIR:
- Accueillir l'hote personnellement a son arrivee a table
- Transmettre le sentiment "nous vous attendions, vous etes au bon endroit"
- Integrer concretement les details specifiques donnes sur l'hote — pas de generalites
- Creer une atmosphere — la lumiere, l'etendue, le sentiment d'arriver

CE QUE TU NE DOIS JAMAIS FAIRE:
- NE JAMAIS utiliser le mot "hangar" — dis plutot "le Dakota", "la maison", "notre place" ou "le lounge"
- Pas d'exagerations ("soiree inoubliable", "experience culinaire unique")
- Pas de formules toutes faites ("Nous vous souhaitons un agreable sejour")
- Pas de liste de plats ni de publicite
- Pas de questions a l'hote
- Pas d'emojis, d'etoiles ou de caracteres speciaux

LONGUEUR: Trois paragraphes, 2-4 phrases chacun. Compact, lisible, sobre.`,

  it: `Scrivi biglietti di benvenuto personalizzati per gli ospiti del Dakota Air Lounge — un ristorante al campo d'aviazione di Meiringen, nell'Oberland bernese, in Svizzera, chiamato come il leggendario aereo "Dakota" (DC-3).

LA VOCE DAKOTA:
- Calda, personale, accogliente — come una lettera da buoni amici
- Italiano elegante ma non formale — ne troppo confidenziale, ne aziendale
- Radicato localmente: Meiringen, le cascate di Reichenbach, l'Oberland bernese, la casa al campo d'aviazione, l'aereo "Dakota"
- L'equipaggio e una famiglia, non un "team di servizio"

COSA DEVE FARE IL BIGLIETTO:
- Accogliere l'ospite personalmente al suo arrivo al tavolo
- Trasmettere la sensazione "vi stavamo aspettando, siete nel posto giusto"
- Integrare concretamente i dettagli specifici sull'ospite — non generalizzare
- Creare un'atmosfera — la luce, l'ampiezza, la sensazione di arrivare

NON USARE MAI:
- MAI la parola "hangar" — di' invece "la Dakota", "la casa", "il nostro posto" o "la lounge"

COSA NON DEVI MAI FARE:
- Nessuna esagerazione ("serata indimenticabile", "esperienza culinaria")
- Nessuna frase fatta ("Vi auguriamo un piacevole soggiorno")
- Nessun elenco di piatti o pubblicita
- Nessuna domanda all'ospite
- Nessun emoji, stelle o caratteri speciali

LUNGHEZZA: Tre paragrafi, 2-4 frasi ciascuno. Compatto, leggibile, discreto.`,
}

// ──────────────────────────────────────────────────────────────
// Language-specific labels
// ──────────────────────────────────────────────────────────────

const OCCASION_LABELS: Record<TischkartenLanguage, Record<TischkartenOccasion, string>> = {
  de: {
    birthday: "Geburtstag",
    anniversary: "Jahrestag",
    business: "Geschaeftsessen",
    family: "Familienfeier",
    wedding: "Hochzeit",
    none: "kein besonderer Anlass",
  },
  en: {
    birthday: "Birthday",
    anniversary: "Anniversary",
    business: "Business dinner",
    family: "Family celebration",
    wedding: "Wedding",
    none: "no special occasion",
  },
  fr: {
    birthday: "Anniversaire",
    anniversary: "Anniversaire de mariage",
    business: "Diner d'affaires",
    family: "Fete de famille",
    wedding: "Mariage",
    none: "pas d'occasion particuliere",
  },
  it: {
    birthday: "Compleanno",
    anniversary: "Anniversario",
    business: "Cena di lavoro",
    family: "Festa di famiglia",
    wedding: "Matrimonio",
    none: "nessuna occasione particolare",
  },
}

const WRITE_INSTRUCTION: Record<TischkartenLanguage, string> = {
  de: "Verfasse Titel und drei Absaetze gemaess dem strikten Schema. Personalisiert, warm, im Dakota-Ton.",
  en: "Write the title and three paragraphs following the strict schema. Personalized, warm, in the Dakota tone.",
  fr: "Redige le titre et trois paragraphes selon le schema strict. Personnalise, chaleureux, dans le ton Dakota.",
  it: "Scrivi il titolo e tre paragrafi secondo lo schema rigoroso. Personalizzato, caldo, nel tono Dakota.",
}

const FOOTER_SIGNATURES: Record<TischkartenLanguage, string> = {
  de: "Ihre Dakota Crew",
  en: "Your Dakota Crew",
  fr: "Votre equipe Dakota",
  it: "Il vostro team Dakota",
}

// ──────────────────────────────────────────────────────────────
// Date locale mapping
// ──────────────────────────────────────────────────────────────

const DATE_LOCALES: Record<TischkartenLanguage, string> = {
  de: "de-CH",
  en: "en-GB",
  fr: "fr-CH",
  it: "it-CH",
}

// ──────────────────────────────────────────────────────────────
// Input Type
// ──────────────────────────────────────────────────────────────
export interface GenerateTischkarteTextInput {
  guestName: string
  occasion?: TischkartenOccasion | null
  partySize?: number | null
  reservationDate?: string | null
  customHint?: string | null
  language?: TischkartenLanguage | null
}

// ──────────────────────────────────────────────────────────────
// Exports for shared use
// ──────────────────────────────────────────────────────────────
export { OCCASION_LABELS, FOOTER_SIGNATURES, DATE_LOCALES }

// ──────────────────────────────────────────────────────────────
// Main Function
// ──────────────────────────────────────────────────────────────
export async function generateTischkarteText(
  input: GenerateTischkarteTextInput
): Promise<GeneratedTischkarteText> {
  const lang: TischkartenLanguage = input.language ?? "de"
  const labels = OCCASION_LABELS[lang]

  const promptIntro: Record<TischkartenLanguage, string> = {
    de: `Schreibe eine persoenliche Tischkarte fuer: ${input.guestName}`,
    en: `Write a personal table card for: ${input.guestName}`,
    fr: `Ecris une carte de table personnalisee pour: ${input.guestName}`,
    it: `Scrivi un biglietto da tavolo personalizzato per: ${input.guestName}`,
  }

  const userPromptParts: string[] = [promptIntro[lang]]

  if (input.occasion && input.occasion !== "none") {
    const occasionLabel = labels[input.occasion]
    const prefixes: Record<TischkartenLanguage, string> = {
      de: "Anlass",
      en: "Occasion",
      fr: "Occasion",
      it: "Occasione",
    }
    userPromptParts.push(`${prefixes[lang]}: ${occasionLabel}`)
  }

  if (input.partySize && input.partySize > 0) {
    const personLabels: Record<TischkartenLanguage, [string, string]> = {
      de: ["Person", "Personen"],
      en: ["person", "people"],
      fr: ["personne", "personnes"],
      it: ["persona", "persone"],
    }
    const [sing, plur] = personLabels[lang]
    userPromptParts.push(
      `${input.partySize} ${input.partySize === 1 ? sing : plur}`
    )
  }

  if (input.reservationDate) {
    try {
      const d = new Date(input.reservationDate)
      const formatted = d.toLocaleDateString(DATE_LOCALES[lang], {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
      userPromptParts.push(formatted)
    } catch {
      userPromptParts.push(input.reservationDate)
    }
  }

  if (input.customHint && input.customHint.trim().length > 0) {
    const hintPrefixes: Record<TischkartenLanguage, string> = {
      de: "Zusaetzlicher Kontext von der Crew",
      en: "Additional context from the crew",
      fr: "Contexte supplementaire de l'equipe",
      it: "Contesto aggiuntivo dal team",
    }
    userPromptParts.push(
      `${hintPrefixes[lang]}: ${input.customHint.trim()}`
    )
  }

  userPromptParts.push("", WRITE_INSTRUCTION[lang])

  const userPrompt = userPromptParts.join("\n")

  const result = await generateObject({
    model: TEXT_MODEL,
    schema: TischkarteTextSchema,
    system: SYSTEM_PROMPTS[lang],
    prompt: userPrompt,
    temperature: 0.8,
    providerOptions: {
      gateway: {
        tags: [
          "feature:tischkarte-text",
          `occasion:${input.occasion ?? "none"}`,
          `lang:${lang}`,
        ],
      },
    },
  })

  return result.object
}
