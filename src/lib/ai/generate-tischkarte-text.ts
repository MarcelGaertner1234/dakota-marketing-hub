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
    .describe("Warm personal title, ideally with the guest's name."),
  paragraph_1: z
    .string()
    .min(40)
    .max(400)
    .describe("First paragraph: warm welcome referencing the occasion if present."),
  paragraph_2: z
    .string()
    .min(40)
    .max(400)
    .describe(
      "Second paragraph: tells something about the Dakota in the village centre of Meiringen. NEVER mention airfield, runway, hangar, aerodrome."
    ),
  paragraph_3: z
    .string()
    .min(20)
    .max(300)
    .describe("Third paragraph: short heartfelt closing. A wish for the evening."),
})

export type GeneratedTischkarteText = z.infer<typeof TischkarteTextSchema>

// ──────────────────────────────────────────────────────────────
// Forbidden terms (per language). If any appear in the output, we retry.
// ──────────────────────────────────────────────────────────────
const FORBIDDEN_TERMS: Record<TischkartenLanguage, RegExp[]> = {
  de: [
    /flugfeld/i,
    /flughafen/i,
    /flugplatz/i,
    /\brollbahn\b/i,
    /\blandebahn\b/i,
    /\bpiste\b/i,
    /\bhangar\b/i,
    /\bterminal\b/i,
  ],
  en: [
    /\bairfield\b/i,
    /\bairport\b/i,
    /\brunway\b/i,
    /\bhangar\b/i,
    /\baerodrome\b/i,
    /\btarmac\b/i,
  ],
  fr: [
    /terrain d['’ ]aviation/i,
    /\baérodrome\b/i,
    /\baeroport\b/i,
    /\baéroport\b/i,
    /\bpiste\b/i,
    /\bhangar\b/i,
  ],
  it: [
    /campo d['’ ]aviazione/i,
    /\baeroporto\b/i,
    /\bpista\b/i,
    /\bhangar\b/i,
    /\baerodromo\b/i,
  ],
}

// Heuristic check for ASCII-substituted German umlauts in the output.
// Hits common GastroKalk-style legacy codebases; we want the AI output to use proper ä/ö/ü/ß.
const GERMAN_ASCII_PATTERNS: RegExp[] = [
  /\bpersoenl/i,
  /\bGeschaeft/i,
  /\bGaeste\b/i,
  /\bgruess/i,
  /\bschoen\b/i,
  /\bfuer\b/i,
  /\bueber\b/i,
  /\bnatuerlich/i,
  /\bSpezialitaet/i,
  /\bwaehrend\b/i,
  /\bmuessen\b/i,
  /\bduerfen\b/i,
  /\bkoennen\b/i,
  /\bmoecht/i,
  /\bAbsaetz/i,
  /\bAnlaesse/i,
  /\bBegruess/i,
  /\bstrasse\b/i,
]

function hasForbiddenContent(
  out: GeneratedTischkarteText,
  lang: TischkartenLanguage
): { ok: boolean; reason?: string } {
  const body = [out.title, out.paragraph_1, out.paragraph_2, out.paragraph_3].join("\n")

  for (const rx of FORBIDDEN_TERMS[lang]) {
    if (rx.test(body)) {
      return { ok: false, reason: `forbidden term matched ${rx}` }
    }
  }

  if (lang === "de") {
    for (const rx of GERMAN_ASCII_PATTERNS) {
      if (rx.test(body)) {
        return { ok: false, reason: `ASCII-substituted umlaut matched ${rx}` }
      }
    }
  }

  return { ok: true }
}

// ──────────────────────────────────────────────────────────────
// Language-specific voice prompts
// ──────────────────────────────────────────────────────────────

const SYSTEM_PROMPTS: Record<TischkartenLanguage, string> = {
  de: `Du schreibst persönliche Willkommens-Texte für Tischkarten im Dakota Air Lounge — einem Restaurant mitten in Meiringen (Amthausgasse 2), im Berner Oberland, Schweiz.

═══ STANDORT-FAKTEN (absolute Wahrheit, niemals abweichen) ═══
- Adresse: Amthausgasse 2, 3860 Meiringen
- Lage: Dorfkern Meiringen, eingebettet zwischen Reichenbachfall, Aareschlucht und den Bergen des Haslitals
- Das Haus steht MITTEN IM DORF, nicht am Flugfeld, nicht am Flughafen, nicht an einer Piste
- Der Name "Dakota" kommt vom legendären Flugzeug DC-3 aus dem Zweiten Weltkrieg — ein Symbol, keine Adresse
- Das Flugzeug-Logo im Namen erinnert an Pioniergeist, nicht an einen Flugplatz vor der Tür

═══ DIE STIMME DAKOTA ═══
- Warm, persönlich, nahbar — wie ein Brief von guten Freunden
- Schweizerisches Hochdeutsch, NIE Mundart, NIE Anglizismen
- Du-Form bei Familien und privaten Anlässen; Sie-Form bei Geschäftsessen
- Klar und schlicht — keine Floskeln, keine Marketing-Sprache, keine Superlative
- Lokal verankert in Meiringen, dem Berner Oberland, dem Haslital
- Die Crew ist eine Familie, kein "Service-Team"

═══ RECHTSCHREIBUNG (PFLICHT — nicht verhandelbar) ═══
- IMMER korrekte deutsche Umlaute: ä ö ü Ä Ö Ü ß
- NIEMALS "ae" statt ä, "oe" statt ö, "ue" statt ü, "ss" statt ß in deutschen Wörtern
- Schreibe "persönlich" (nicht "persoenlich"), "Gäste" (nicht "Gaeste"), "grüßen" (nicht "gruessen"),
  "für" (nicht "fuer"), "schön" (nicht "schoen"), "möchten" (nicht "moechten"), "Geschäftsessen" (nicht "Geschaeftsessen"),
  "Absätze" (nicht "Absaetze"), "Anlässe" (nicht "Anlaesse")
- Zeichensetzung nach Duden: Gedankenstrich als — oder –, Apostroph typografisch korrekt

═══ WAS DIE KARTE LEISTEN SOLL ═══
- Den Gast beim Eintreffen am Tisch persönlich begrüßen
- Gefühl vermitteln: "Wir haben auf euch gewartet, ihr seid hier richtig"
- Den Anlass konkret aufgreifen, auf mitgegebene Details persönlich eingehen
- Eine leise Atmosphäre schaffen: das Licht im Haus, der Blick auf die Berge, das Ankommen nach der Reise

═══ ABSOLUTE VERBOTE ═══
- NIE "Flugfeld", "Flughafen", "Flugplatz", "Piste", "Rollbahn", "Landebahn", "Hangar", "Terminal" — existiert bei uns nicht
- NIE behaupten oder andeuten, die Dakota stehe in der Nähe eines Flugplatzes
- Keine Übertreibungen ("unvergesslicher Abend", "kulinarisches Highlight")
- Keine Floskeln ("Wir wünschen Ihnen einen schönen Aufenthalt")
- Keine Aufzählung von Gerichten, keine Werbung
- Keine Fragen an den Gast
- Keine Emojis, keine Sterne, keine Sonderzeichen außer normaler Satzzeichen
- Nicht mehrere Anliegen in einen Satz packen

═══ STATT "FLUGFELD" ODER "HANGAR" VERWENDE ═══
- "das Haus im Dorfkern"
- "unsere Stube mitten in Meiringen"
- "die Dakota"
- "unser Platz"
- "die Lounge"
- "zwischen Reichenbachfall und Aareschlucht"
- "hier im Haslital"

═══ LÄNGE ═══
Drei Absätze, jeder 2–4 Sätze. Kompakt, lesbar, leise.`,

  en: `You write personal welcome cards for guests at the Dakota Air Lounge — a restaurant in the village centre of Meiringen (Amthausgasse 2), Bernese Oberland, Switzerland.

═══ LOCATION FACTS (absolute truth, never deviate) ═══
- Address: Amthausgasse 2, 3860 Meiringen
- Setting: village centre of Meiringen, nestled between Reichenbach Falls, Aare Gorge and the mountains of the Haslital valley
- The house sits in the middle of the village — NOT at an airfield, NOT at an airport, NOT beside a runway
- The name "Dakota" comes from the legendary DC-3 aircraft of WWII — a symbol of pioneering spirit, not a place
- The airplane logo evokes adventure, not an airstrip outside the door

═══ THE DAKOTA VOICE ═══
- Warm, personal, approachable — like a letter from good friends
- Elegant but not formal — conversational English, no corporate speak
- Locally rooted: Meiringen, Reichenbach Falls, Aare Gorge, Haslital, Bernese Oberland
- The crew is a family, not a "service team"

═══ WHAT THE CARD SHOULD DO ═══
- Greet the guest personally as they arrive at their table
- Convey the feeling "we've been waiting for you, you're in the right place"
- Weave in the specific details given about the guest concretely — not generically
- Create a quiet atmosphere: the light inside the house, the view of the mountains, the sense of arrival

═══ ABSOLUTE PROHIBITIONS ═══
- NEVER use "airfield", "airport", "runway", "hangar", "aerodrome", "tarmac", "terminal" — none of these exist here
- NEVER imply the Dakota sits near a landing strip
- No exaggerations ("unforgettable evening", "culinary highlight")
- No stock phrases ("We wish you a pleasant stay")
- No listing of dishes or advertising
- No questions to the guest
- No emojis, no stars, no special characters beyond normal punctuation

═══ USE INSTEAD ═══
- "the house in the village centre"
- "our place in the heart of Meiringen"
- "the Dakota"
- "our lounge"
- "between Reichenbach Falls and the Aare Gorge"
- "here in the Haslital"

═══ LENGTH ═══
Three paragraphs, 2–4 sentences each. Compact, readable, quiet.`,

  fr: `Tu écris des cartes de bienvenue personnalisées pour les hôtes du Dakota Air Lounge — un restaurant au cœur du village de Meiringen (Amthausgasse 2), dans l'Oberland bernois, en Suisse.

═══ FAITS DE LOCALISATION (vérité absolue, jamais dévier) ═══
- Adresse : Amthausgasse 2, 3860 Meiringen
- Situation : centre du village de Meiringen, entre les chutes du Reichenbach, les gorges de l'Aar et les montagnes du Haslital
- La maison se trouve au milieu du village — PAS près d'un terrain d'aviation, PAS dans un aéroport, PAS près d'une piste
- Le nom "Dakota" vient du légendaire avion DC-3 de la Seconde Guerre mondiale — un symbole, pas une adresse
- Le logo de l'avion évoque l'esprit pionnier, pas une piste devant la porte

═══ LA VOIX DAKOTA ═══
- Chaleureuse, personnelle, accessible — comme une lettre de bons amis
- Français élégant mais pas guindé
- Ancrée localement : Meiringen, chutes du Reichenbach, gorges de l'Aar, Haslital, Oberland bernois
- L'équipe est une famille, pas un "personnel de service"

═══ ORTHOGRAPHE ═══
- Accents corrects partout : é è ê ë à â ô û î ï ç
- Apostrophes typographiques propres

═══ INTERDICTIONS ABSOLUES ═══
- JAMAIS "terrain d'aviation", "aéroport", "aérodrome", "piste", "hangar" — rien de tout cela n'existe ici
- JAMAIS suggérer que le Dakota se trouve près d'un site aéronautique
- Pas d'exagérations ("soirée inoubliable", "expérience culinaire unique")
- Pas de formules toutes faites ("Nous vous souhaitons un agréable séjour")
- Pas de liste de plats ni de publicité
- Pas de questions à l'hôte
- Pas d'emojis ni de caractères spéciaux

═══ À UTILISER À LA PLACE ═══
- "la maison au cœur du village"
- "notre place au centre de Meiringen"
- "le Dakota"
- "notre salon"
- "entre les chutes du Reichenbach et les gorges de l'Aar"

═══ LONGUEUR ═══
Trois paragraphes, 2–4 phrases chacun. Compact, lisible, sobre.`,

  it: `Scrivi biglietti di benvenuto personalizzati per gli ospiti del Dakota Air Lounge — un ristorante nel centro del villaggio di Meiringen (Amthausgasse 2), nell'Oberland bernese, in Svizzera.

═══ FATTI SULLA POSIZIONE (verità assoluta, mai deviare) ═══
- Indirizzo: Amthausgasse 2, 3860 Meiringen
- Posizione: centro del villaggio di Meiringen, incastonato tra le cascate di Reichenbach, la gola dell'Aar e le montagne dell'Haslital
- La casa si trova in mezzo al paese — NON presso un campo d'aviazione, NON in un aeroporto, NON vicino a una pista
- Il nome "Dakota" deriva dal leggendario aereo DC-3 della Seconda Guerra Mondiale — un simbolo, non un luogo
- Il logo dell'aereo evoca lo spirito pionieristico, non una pista fuori dalla porta

═══ LA VOCE DAKOTA ═══
- Calda, personale, accogliente — come una lettera da buoni amici
- Italiano elegante ma non formale
- Radicato localmente: Meiringen, cascate di Reichenbach, gola dell'Aar, Haslital, Oberland bernese
- L'equipaggio è una famiglia, non un "team di servizio"

═══ ORTOGRAFIA ═══
- Accenti corretti: è é à ò ù ì

═══ DIVIETI ASSOLUTI ═══
- MAI "campo d'aviazione", "aeroporto", "pista", "hangar", "aerodromo" — nulla di tutto ciò esiste qui
- MAI suggerire che il Dakota si trovi vicino a un luogo aeronautico
- Nessuna esagerazione ("serata indimenticabile", "esperienza culinaria unica")
- Nessuna frase fatta ("Vi auguriamo un piacevole soggiorno")
- Nessun elenco di piatti o pubblicità
- Nessuna domanda all'ospite
- Nessun emoji o carattere speciale

═══ USA INVECE ═══
- "la casa nel centro del villaggio"
- "il nostro posto nel cuore di Meiringen"
- "il Dakota"
- "la nostra lounge"
- "tra le cascate di Reichenbach e la gola dell'Aar"

═══ LUNGHEZZA ═══
Tre paragrafi, 2–4 frasi ciascuno. Compatto, leggibile, discreto.`,
}

// ──────────────────────────────────────────────────────────────
// Language-specific labels
// ──────────────────────────────────────────────────────────────

const OCCASION_LABELS: Record<TischkartenLanguage, Record<TischkartenOccasion, string>> = {
  de: {
    birthday: "Geburtstag",
    anniversary: "Jahrestag",
    business: "Geschäftsessen",
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
    business: "Dîner d'affaires",
    family: "Fête de famille",
    wedding: "Mariage",
    none: "pas d'occasion particulière",
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
  de: "Verfasse Titel und drei Absätze gemäß dem strikten Schema. Persönlich, warm, im Dakota-Ton. Verwende korrekte deutsche Umlaute (ä ö ü ß) — niemals ae/oe/ue/ss als Ersatz. Vermeide jede Anspielung auf Flugfeld, Flughafen, Piste oder Hangar.",
  en: "Write the title and three paragraphs following the strict schema. Personal, warm, in the Dakota tone. Never mention airfield, airport, runway, hangar, or aerodrome.",
  fr: "Rédige le titre et trois paragraphes selon le schéma strict. Personnalisé, chaleureux, dans le ton Dakota. Ne jamais mentionner terrain d'aviation, aéroport, piste ou hangar.",
  it: "Scrivi il titolo e tre paragrafi secondo lo schema rigoroso. Personalizzato, caldo, nel tono Dakota. Non menzionare mai campo d'aviazione, aeroporto, pista o hangar.",
}

const RETRY_INSTRUCTION: Record<TischkartenLanguage, string> = {
  de: "ACHTUNG — letzter Versuch enthielt verbotene Begriffe (Flugfeld/Hangar/etc.) oder falsche Umlaut-Schreibung. Die Dakota steht MITTEN IN MEIRINGEN, nicht am Flugfeld. Schreibe den Text neu, strikt innerhalb der Regeln, mit korrekten deutschen Umlauten (ä ö ü ß).",
  en: "ATTENTION — last attempt contained forbidden terms (airfield/hangar/etc.). The Dakota sits IN THE VILLAGE CENTRE of Meiringen, NOT at any airfield. Rewrite strictly within the rules.",
  fr: "ATTENTION — la tentative précédente contenait des termes interdits (terrain d'aviation/hangar/etc.). Le Dakota se trouve AU CENTRE DU VILLAGE de Meiringen, PAS près d'un terrain d'aviation. Réécris strictement dans les règles.",
  it: "ATTENZIONE — il tentativo precedente conteneva termini vietati (campo d'aviazione/hangar/ecc.). Il Dakota si trova NEL CENTRO DEL VILLAGGIO di Meiringen, NON presso un campo d'aviazione. Riscrivi rigorosamente secondo le regole.",
}

const FOOTER_SIGNATURES: Record<TischkartenLanguage, string> = {
  de: "Ihre Dakota Crew",
  en: "Your Dakota Crew",
  fr: "Votre équipe Dakota",
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
    de: `Schreibe eine persönliche Tischkarte für: ${input.guestName}`,
    en: `Write a personal table card for: ${input.guestName}`,
    fr: `Écris une carte de table personnalisée pour : ${input.guestName}`,
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
    userPromptParts.push(`${input.partySize} ${input.partySize === 1 ? sing : plur}`)
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
      de: "Zusätzlicher Kontext von der Crew",
      en: "Additional context from the crew",
      fr: "Contexte supplémentaire de l'équipe",
      it: "Contesto aggiuntivo dal team",
    }
    userPromptParts.push(`${hintPrefixes[lang]}: ${input.customHint.trim()}`)
  }

  userPromptParts.push("", WRITE_INSTRUCTION[lang])

  const baseUserPrompt = userPromptParts.join("\n")

  const MAX_ATTEMPTS = 2
  let lastResult: GeneratedTischkarteText | null = null
  let lastReason: string | undefined

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const userPrompt =
      attempt === 0
        ? baseUserPrompt
        : `${baseUserPrompt}\n\n${RETRY_INSTRUCTION[lang]}`

    const result = await generateObject({
      model: TEXT_MODEL,
      schema: TischkarteTextSchema,
      system: SYSTEM_PROMPTS[lang],
      prompt: userPrompt,
      temperature: 0.6,
      providerOptions: {
        gateway: {
          tags: [
            "feature:tischkarte-text",
            `occasion:${input.occasion ?? "none"}`,
            `lang:${lang}`,
            `attempt:${attempt}`,
          ],
        },
      },
    })

    lastResult = result.object
    const check = hasForbiddenContent(lastResult, lang)
    if (check.ok) {
      return lastResult
    }
    lastReason = check.reason
  }

  // Both attempts violated the guards. Return the last result but log so we notice drift.
  // (We never throw: the card is better than no card — downstream can manual-edit.)
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.warn(
      `[generateTischkarteText] Returning output that failed guard after ${MAX_ATTEMPTS} attempts: ${lastReason}`
    )
  }
  return lastResult as GeneratedTischkarteText
}
