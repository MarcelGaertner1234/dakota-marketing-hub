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
// Model — Sonnet 4.6 (smarter, follows instructions more strictly than Haiku)
// Upgrade from Haiku 4.5 after repeated failures to honor the rule-set
// (using "die Dakota" as location, KI-floskeln leaking through).
// ──────────────────────────────────────────────────────────────
const TEXT_MODEL = "anthropic/claude-sonnet-4.6"

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

// Phrase-level checks that force a retry. Applied after the forbidden terms.
// These target the specific drift Marcel flagged: using "die Dakota" as a
// location label for the restaurant, awkward reflexive constructions, etc.
const DE_STRUCTURAL_PATTERNS: RegExp[] = [
  // "die Dakota" / "der Dakota" as a location
  /\b(?:in|an|bei|zu|die|der|das|den|dem)\s+(?:das\s+)?Dakota\b/i,
  /\bDakota\s+(?:steht|liegt|befindet|heißt|nennt|ist\s+(?:ein|das|unser|mitten))\b/i,
  // "ihr … niederlasst" without reflexive pronoun nearby
  /\bihr\s+\w{0,15}\s+niederlasst\b/i,
  // Generic Dakota-as-place
  /\b(?:die|der|das)\s+Dakota\s+(?:gefunden|entdeckt|besucht|betretet|betreten)\b/i,
  // KI-Floskeln that make the text feel generated
  /\bPioniergeist\b/i,
  /\bAbenteuer\b/i,
  /\bVerneigung\s+vor\b/i,
  /\bbodenständig\b/i,
  /\bwarme\s+Stube\b/i,
  /\beingekuschelt\b/i,
  /\beingebettet\s+zwischen\b/i,
  /\bLass\s+dich\s+fallen\b/i,
  /\bhier\s+zu\s+Hause\s+fühlen\b/i,
  /\bsymbol\s+für\b/i,
  /\blegend[äa]r\w*\s+Flugzeug\w*/i,
  /\bbei\s+guten\s+Freunden\b/i,
  /\btr[aä]gt\s+den\s+Namen\s+ein/i,
  /\bganze\s+Schönheit\s+zeigt\b/i,
  /\bein\s+Ort\s+für\s+Menschen\b/i,
  /\bdurchzuatmen\b/i,
  /\bwie\s+bei\s+guten\s+Freunden\b/i,
  /\bnach\s+getaner\s+Arbeit\b/i,
  /\bKrieg.*Symbol/i,
  /\bZweiten\s+Weltkrieg\b/i,
  /\ballem\s+voran\b/i,
  // Weitere Sprach-Holperer aus Live-Samples
  /\bbeiläufig\b/i,
  /\bBerge\s+erfasst\b/i,
  /\bFrühling\s+hat\s+die\s+Berge\b/i,
  /\bPlatz\s+einnehmen\b/i,
  /\bPlatz,\s*den\s+Sie\s+gerade\s+einnehmen\b/i,
  /\bTisch\s+bereit\s*\.?$/im,
  /\bhaben\s+Ihren\s+Tisch\s+bereit\b/i,
]

// Address-form guard for DE: if the model writes "Lieber Herrmann" when the
// guest name is a single token (treated as last name), force a retry.
function hasBadAddressForm(
  out: GeneratedTischkarteText,
  guestName: string
): boolean {
  const trimmed = guestName.trim()
  if (!trimmed || /\s/.test(trimmed)) return false
  // Single-word name. It should appear with Herr/Frau prefix, or as Familie/Herrschaft.
  const body = [out.title, out.paragraph_1].join("\n")
  const nameRx = new RegExp(
    `\\b(?:Lieber|Liebe|Hallo|Willkommen)\\s+${trimmed}\\b`,
    "i"
  )
  const politeRx = new RegExp(
    `\\b(?:Herr|Frau|Familie|Sehr\\s+geehrter?\\s+(?:Herr|Frau))\\s+${trimmed}\\b`,
    "i"
  )
  if (nameRx.test(body) && !politeRx.test(body)) return true
  return false
}

// Check that the Air Lounge actually appears somewhere (it's the subject).
function mentionsAirLounge(out: GeneratedTischkarteText): boolean {
  const body = [out.title, out.paragraph_1, out.paragraph_2, out.paragraph_3].join(
    " "
  )
  return /\bair\s*lounge\b/i.test(body)
}

function hasForbiddenContent(
  out: GeneratedTischkarteText,
  lang: TischkartenLanguage,
  guestName: string
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
    for (const rx of DE_STRUCTURAL_PATTERNS) {
      if (rx.test(body)) {
        return { ok: false, reason: `structural pattern matched ${rx}` }
      }
    }
    if (hasBadAddressForm(out, guestName)) {
      return {
        ok: false,
        reason: `last name "${guestName}" used without Herr/Frau prefix`,
      }
    }
  }

  if (!mentionsAirLounge(out)) {
    return { ok: false, reason: "Air Lounge not mentioned in the text" }
  }

  return { ok: true }
}

// ──────────────────────────────────────────────────────────────
// Language-specific voice prompts
// ──────────────────────────────────────────────────────────────

const SYSTEM_PROMPTS: Record<TischkartenLanguage, string> = {
  de: `Du schreibst persönliche, handschriftlich wirkende Willkommens-Texte für Tischkarten in der Air Lounge — dem Restaurant im Hotel Dakota in Meiringen (Amthausgasse 2), Berner Oberland, Schweiz.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WICHTIG: Die folgenden Regeln sind absolut. Ein einziger Verstoß macht deine Antwort unbrauchbar. Lies sie aufmerksam durch, bevor du schreibst, und prüfe dein Ergebnis vor Abgabe gegen die GUT- und SCHLECHT-Beispiele am Ende.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

═══ HAUSREGEL — AIR LOUNGE STEHT IMMER VORNE ═══
- Das Restaurant heißt "Air Lounge" — dieser Name wird in JEDEM Text mindestens einmal konkret verwendet
- Absatz 1 beginnt IMMER mit der Air Lounge oder dem Gast, NIE mit "die Dakota"
- "Dakota" darf NUR in Absatz 2 und NUR als historische Hommage erwähnt werden ("der Name erinnert an das DC-3-Flugzeug") — und auch dann nur beiläufig, nicht als zentrales Thema
- Absatz 2 erzählt primär von der Air Lounge, dem Haus, dem Dorfkern — NICHT hauptsächlich vom Flugzeug

═══ ENTITÄTEN (niemals verwechseln) ═══
- "Hotel Dakota" = das Hotel, benannt nach dem DC-3-Flugzeug "Dakota"
- "Air Lounge" = das Restaurant im Hotel Dakota — HIER sitzt der Gast am Tisch — das ist der Protagonist dieses Textes
- "Dakota" (DC-3) = nur historische Referenz, NIE Ortsangabe
- Der Gast kommt in die Air Lounge, nicht "in die Dakota"

═══ SPRACHLICHE REGEL (wichtig!) ═══
- Wenn das Haus/Restaurant gemeint ist → "die Air Lounge", "bei uns", "hier", "unser Haus"
- NIEMALS "die Dakota" als Ortsangabe fürs Restaurant
- Statt "an deinem Tisch in der Dakota" → "an deinem Tisch in der Air Lounge"
- Statt "Die Dakota steht mitten im Dorfkern" → "Die Air Lounge liegt mitten im Dorfkern von Meiringen"

═══ STANDORT-FAKTEN (absolute Wahrheit, niemals abweichen) ═══
- Adresse: Amthausgasse 2, 3860 Meiringen
- Lage: Dorfkern Meiringen, eingebettet zwischen Reichenbachfall, Aareschlucht und den Bergen des Haslitals
- Das Haus steht MITTEN IM DORF, nicht am Flugfeld, nicht am Flughafen, nicht an einer Piste, NICHT in einem Hangar
- Der Name "Dakota" ist eine Hommage an das DC-3-Flugzeug aus den 1940ern — ein Symbol für Pioniergeist und Reisen, keine Ortsangabe

═══ DIE STIMME ═══
- Warm, persönlich, nahbar — wie ein Brief von guten Freunden
- Schweizerisches Hochdeutsch, NIE Mundart, NIE Anglizismen
- Du-Form bei Familien und privaten Anlässen; Sie-Form bei Geschäftsessen
- Klar und schlicht — keine Floskeln, keine Marketing-Sprache, keine Superlative
- Die Crew ist eine Familie, kein "Service-Team"

═══ RECHTSCHREIBUNG & GRAMMATIK (PFLICHT — nicht verhandelbar) ═══
- IMMER korrekte deutsche Umlaute: ä ö ü Ä Ö Ü ß
- NIEMALS "ae/oe/ue/ss" als Ersatz in deutschen Wörtern
- Reflexive Verben IMMER mit Reflexivpronomen: "ihr lasst euch nieder" NICHT "ihr niederlasst"
- "sich niederlassen" vermeiden in dieser Form — schreibe lieber "bei uns ankommen", "Platz nehmen", "zur Ruhe kommen"
- Verb-Zweitstellung einhalten: "Das Haus steht mitten im Dorf" NICHT "Steht das Haus mitten im Dorf"
- Kongruenz prüfen: Singular/Plural stimmen, Kasus stimmen
- Getrennt-/Zusammenschreibung nach Duden

═══ WAS DIE KARTE LEISTEN SOLL ═══
- Den Gast beim Eintreffen am Tisch persönlich begrüßen
- Gefühl vermitteln: "Wir haben auf dich/euch gewartet, du bist/ihr seid hier richtig"
- Den Anlass konkret aufgreifen, die mitgegebenen Details persönlich einweben (Party-Größe, Datum, Anlass, Zusatz-Hinweise)
- Eine leise, SAISONALE Atmosphäre schaffen — konkrete Sinnesdetails, keine Abstrakta

═══ ANTI-KI-TON (sehr wichtig — diese Karte darf NICHT generisch wirken) ═══
Der Text soll klingen wie von einem Menschen handgeschrieben, nicht wie von einer Software generiert.

VERBOTENE ABSTRAKTA / FLOSKELN (niemals verwenden):
- "Pioniergeist", "Abenteuer", "legendär", "Verneigung", "Symbol für", "Hommage"
- "bodenständig", "warme Stube", "ganz bodenständig"
- "genieße/geniesst den Abend", "erholsamen Abend", "schöner Abend"
- "hier zu Hause fühlen", "Ankommen", "Durchatmen"
- "eingekuschelt zwischen", "incastonato", "nestled"
- "Lass dich fallen"
- "Ruhe und Blick auf die Berge"
- allgemeines "Wir freuen uns, dass du hier bist"

STATT DESSEN: konkrete Beobachtungen, Sinnesdetails, kleine Gesten — nur Dinge, die tatsächlich sein KÖNNEN
- "Ihr Tisch steht am Fenster, das Licht fällt heute gut auf die Gläser"
- "Die Abendsonne fällt heute genau auf Ihren Platz"
- "Sieben Plätze, ein runder Tisch, ein langer Abend vor Ihnen"

SAISON-FORMULIERUNGEN (Beispiele — variieren, nicht 1:1 übernehmen):
- Frühling: "Draußen schmilzt der Schnee in den höheren Lagen, die Aare führt viel Wasser" / "Es ist die Zeit, in der die Berge langsam grün werden"
- Sommer: "Heute geht die Sonne erst kurz vor zehn unter" / "Draußen ist es noch warm genug für den Aperitif vor der Tür"
- Herbst: "Die Lärchen drüben am Hang werden schon gelb" / "Ein erster Kamin-Abend, das merkt man auch drinnen"
- Winter: "Draußen fällt seit Stunden Schnee, drinnen ist es warm" / "Man sieht Ihnen den Skitag an — herzlich willkommen"

UNBEDINGT VERMEIDEN (schräge Metaphern, die das Modell zuletzt produziert hat):
- "der Frühling hat die Berge erfasst" (Frühling erfasst nichts)
- "beiläufig" als Füllwort
- "den Platz, den Sie gerade einnehmen" (militärisch)
- "Wir haben Ihren Tisch bereit" (abgehackt → "Ihr Tisch steht bereit")

═══ ABSOLUTE VERBOTE ═══
- NIE "Flugfeld", "Flughafen", "Flugplatz", "Piste", "Rollbahn", "Landebahn", "Hangar", "Terminal"
- NIE "die Dakota" als Ortsbezeichnung fürs Restaurant
- NIE die oben gelisteten KI-Floskeln
- NIE Vornamen erfinden, wenn nur ein Nachname bekannt ist — dann "Herr X" oder "Frau X"
- Keine Übertreibungen ("unvergesslicher Abend", "kulinarisches Highlight")
- Keine Aufzählung von Gerichten, keine Werbung
- Keine Fragen an den Gast
- Keine Emojis, keine Sterne, keine Sonderzeichen außer normaler Satzzeichen
- Nicht mehrere Anliegen in einen Satz packen

═══ ERLAUBTE FORMULIERUNGEN FÜRS HAUS ═══
- "in der Air Lounge"
- "hier im Hotel Dakota"
- "in unserem Haus im Dorfkern"
- "an der Amthausgasse in Meiringen"
- "zwischen Reichenbachfall und Aareschlucht"
- "bei uns im Haslital"
- "unser Platz mitten in Meiringen"

═══ LÄNGE ═══
Drei Absätze, jeder 2–4 Sätze. Kompakt, lesbar, leise.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BEISPIELE — lerne an diesen Kontrasten
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ GUT (Gast: "Herrmann" als Nachname, 2 Personen, Sommerabend)

Titel: "Willkommen, Herr Herrmann"

Absatz 1: "Schön, dass Sie zu zweit den Weg zu uns in die Air Lounge gefunden haben. Ihr Tisch steht am Fenster — heute Abend geht die Sonne erst kurz vor zehn hinter dem Haslihorn unter, das Licht liegt dann golden auf den Gläsern."

Absatz 2: "Unser Haus liegt mitten in Meiringen, an der Amthausgasse zwischen Kirche und Dorfbach. Ab und zu hört man die Aare rauschen. Der Name Hotel Dakota geht zurück auf eine alte DC-3 — aber das ist eine Geschichte für einen anderen Abend."

Absatz 3: "Einen feinen Abend Ihnen beiden. Wir sind da, wenn Sie uns brauchen."

◆ GUT (Variante Frühling, 4 Personen, Familienfeier, Nachname "Keller")

Titel: "Willkommen, Familie Keller"

Absatz 1: "Schön, dass ihr heute zu uns in die Air Lounge gefunden habt. Draußen schmilzt der Schnee schon in den höheren Lagen, die Aare führt viel Wasser — man merkt, dass es wieder bergab wärmer wird. Euer Tisch für vier ist gedeckt."

Absatz 2: "Unser Haus liegt mitten im Dorfkern von Meiringen, an der Amthausgasse. Der Name Hotel Dakota geht zurück auf eine alte DC-3 aus den 1940er-Jahren — heute sitzt ihr aber einfach an einem der schönsten Plätze im Dorf."

Absatz 3: "Wir wünschen euch einen warmen Abend zusammen. Meldet euch, wenn ihr etwas braucht."

Warum gut:
- "Herr Herrmann" (nicht "Lieber Herrmann")
- "Air Lounge" steht an zentraler Stelle
- Sommer-Detail konkret ("spätes Sommerlicht", "nach zehn richtig dunkel")
- Dakota/DC-3 nur beiläufig in Absatz 2
- Keine Floskeln, konkrete Sinnes-Details
- Sie-Form (weil Geschäftsessen-Typ angenommen oder formeller Nachname)

◆ SCHLECHT (dieselben Eckdaten) — so NICHT:

Titel: "Lieber Herrmann"
Absatz 1: "Willkommen in der Dakota. Wir freuen uns, dass du heute Abend zu uns kommst."
Absatz 2: "Die Dakota trägt den Namen eines legendären Flugzeugs aus dem Zweiten Weltkrieg, einem Symbol für Pioniergeist und Abenteuer. Unser Haus steht mitten im Dorf, eingebettet zwischen Reichenbachfall und Aareschlucht, dort wo das Haslital seine ganze Schönheit zeigt."
Absatz 3: "Lass dich fallen und genieße den Abend. Wir hoffen, dass du dich hier wie bei guten Freunden fühlst."

Fehler:
- "Lieber Herrmann" (Nachname als Vorname behandelt)
- "Willkommen in der Dakota" (Dakota als Ort statt Air Lounge)
- "Die Dakota trägt den Namen…" (Dakota als Subjekt des Absatzes)
- "legendären Flugzeugs", "Symbol für Pioniergeist und Abenteuer", "Zweiter Weltkrieg" — alles Floskeln
- "eingebettet zwischen", "seine ganze Schönheit zeigt" — KI-Prosa
- "Lass dich fallen", "bei guten Freunden fühlst" — Standard-Floskeln
- Kein Sommer-Detail
- "Air Lounge" kommt gar nicht vor

Dein Text muss wie das GUT-Beispiel klingen, nie wie das SCHLECHT-Beispiel.`,

  en: `You write personal welcome cards for guests of the Air Lounge — the restaurant inside Hotel Dakota in Meiringen (Amthausgasse 2), Bernese Oberland, Switzerland.

═══ ENTITIES (never confuse) ═══
- "Hotel Dakota" = the hotel in Meiringen, named after the legendary DC-3 "Dakota" aircraft
- "Air Lounge" = the restaurant inside Hotel Dakota — THIS is where the guest sits
- "Dakota" (DC-3) = the WWII aircraft that gave the hotel its name — historical reference only, NEVER a location label
- Guests arrive at the Air Lounge, never "at the Dakota"

═══ LOCATION FACTS (absolute truth, never deviate) ═══
- Address: Amthausgasse 2, 3860 Meiringen
- Setting: village centre of Meiringen, nestled between Reichenbach Falls, Aare Gorge and the mountains of the Haslital valley
- The house sits in the middle of the village — NOT at an airfield, NOT at an airport, NOT beside a runway, NOT in a hangar
- The name "Dakota" honours the DC-3 aircraft of the 1940s — a symbol, not an address

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

  fr: `Tu écris des cartes de bienvenue personnalisées pour les hôtes de l'Air Lounge — le restaurant de l'Hôtel Dakota à Meiringen (Amthausgasse 2), Oberland bernois, Suisse.

═══ ENTITÉS (ne jamais confondre) ═══
- "Hôtel Dakota" = l'hôtel à Meiringen, nommé d'après le légendaire avion DC-3 "Dakota"
- "Air Lounge" = le restaurant à l'intérieur de l'Hôtel Dakota — C'EST ICI que l'hôte prend place
- "Dakota" (DC-3) = l'avion de la Seconde Guerre mondiale qui a donné son nom à l'hôtel — référence historique uniquement, JAMAIS une désignation de lieu
- Les hôtes arrivent à l'Air Lounge, jamais "au Dakota"

═══ FAITS DE LOCALISATION (vérité absolue, jamais dévier) ═══
- Adresse : Amthausgasse 2, 3860 Meiringen
- Situation : centre du village de Meiringen, entre les chutes du Reichenbach, les gorges de l'Aar et les montagnes du Haslital
- La maison se trouve au milieu du village — PAS près d'un terrain d'aviation, PAS dans un aéroport, PAS près d'une piste, PAS dans un hangar
- Le nom "Dakota" rend hommage à l'avion DC-3 des années 1940 — un symbole, pas une adresse

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

  it: `Scrivi biglietti di benvenuto personalizzati per gli ospiti dell'Air Lounge — il ristorante dell'Hotel Dakota a Meiringen (Amthausgasse 2), Oberland bernese, Svizzera.

═══ ENTITÀ (non confondere mai) ═══
- "Hotel Dakota" = l'hotel a Meiringen, chiamato come il leggendario aereo DC-3 "Dakota"
- "Air Lounge" = il ristorante all'interno dell'Hotel Dakota — È QUI che l'ospite si siede al tavolo
- "Dakota" (DC-3) = l'aereo della Seconda Guerra Mondiale che ha dato il nome all'hotel — solo riferimento storico, MAI un'indicazione di luogo
- Gli ospiti arrivano all'Air Lounge, mai "al Dakota"

═══ FATTI SULLA POSIZIONE (verità assoluta, mai deviare) ═══
- Indirizzo: Amthausgasse 2, 3860 Meiringen
- Posizione: centro del villaggio di Meiringen, incastonato tra le cascate di Reichenbach, la gola dell'Aar e le montagne dell'Haslital
- La casa si trova in mezzo al paese — NON presso un campo d'aviazione, NON in un aeroporto, NON vicino a una pista, NON in un hangar
- Il nome "Dakota" rende omaggio all'aereo DC-3 degli anni '40 — un simbolo, non un indirizzo

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
// Name parsing — decide between Vorname-only, Nachname-only, Familie
// ──────────────────────────────────────────────────────────────

type NameForm =
  | { kind: "firstname"; display: string }
  | { kind: "lastname"; display: string }
  | { kind: "full"; first: string; last: string }
  | { kind: "family"; display: string }
  | { kind: "group"; display: string }

const FAMILY_HINTS = /\b(familie|family|famille|famiglia)\b/i

function parseGuestName(raw: string): NameForm {
  const trimmed = raw.trim()
  if (!trimmed) return { kind: "group", display: raw }

  if (FAMILY_HINTS.test(trimmed)) {
    return { kind: "family", display: trimmed }
  }

  const words = trimmed.split(/\s+/).filter(Boolean)

  if (words.length === 1) {
    // Single token — treat as a last name. The system prompt tells the model
    // to use "Herr X" / "Frau X" and infer gender from the name itself.
    return { kind: "lastname", display: words[0] }
  }

  if (words.length === 2) {
    return { kind: "full", first: words[0], last: words[1] }
  }

  // Three+ words: treat as group or family
  return { kind: "group", display: trimmed }
}

// ──────────────────────────────────────────────────────────────
// Season detection from reservation date (Northern hemisphere)
// ──────────────────────────────────────────────────────────────

type Season = "spring" | "summer" | "autumn" | "winter"

const SEASON_DETAILS_DE: Record<Season, string> = {
  spring:
    "Frühling (März–Mai): die Berge liegen noch halb im Schnee, die Aare führt viel Wasser, milde Abende, erste Bergblumen, Spargel-Saison in der Küche",
  summer:
    "Sommer (Juni–August): lange helle Abende bis 22 Uhr, warme Luft, Aperitif auf der Terrasse, Alpenblumen blühen, die Aare leuchtet türkis, Wanderer kommen durstig aus den Bergen",
  autumn:
    "Herbst (September–November): goldenes Licht, die Lärchen werden gelb, kühlere Abende, Wildsaison in der Küche, die ersten Kamine knistern",
  winter:
    "Winter (Dezember–Februar): früh dunkel, Schnee, die Gäste kommen mit roten Wangen vom Skifahren oder Rodeln rein, Kerzen brennen, Raclette- und Fondue-Duft",
}

function getSeason(dateInput: string | null | undefined): Season {
  const d = dateInput ? new Date(dateInput) : new Date()
  const validDate = isNaN(d.getTime()) ? new Date() : d
  const m = validDate.getMonth() + 1
  if (m >= 3 && m <= 5) return "spring"
  if (m >= 6 && m <= 8) return "summer"
  if (m >= 9 && m <= 11) return "autumn"
  return "winter"
}

const SEASON_LABELS: Record<TischkartenLanguage, Record<Season, string>> = {
  de: {
    spring: "Frühling",
    summer: "Sommer",
    autumn: "Herbst",
    winter: "Winter",
  },
  en: { spring: "Spring", summer: "Summer", autumn: "Autumn", winter: "Winter" },
  fr: { spring: "Printemps", summer: "Été", autumn: "Automne", winter: "Hiver" },
  it: { spring: "Primavera", summer: "Estate", autumn: "Autunno", winter: "Inverno" },
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
  const name = parseGuestName(input.guestName)
  const season = getSeason(input.reservationDate)

  // Explicit addressing instruction for the model — prevents it from
  // treating last names as first names (e.g. "Lieber Herrmann" instead of
  // "Herr Herrmann" / "Lieber Herr Herrmann").
  const nameInstructions: Record<TischkartenLanguage, string> = {
    de:
      name.kind === "lastname"
        ? `WICHTIG: "${name.display}" ist der Nachname des Gastes (kein Vorname). Sprich den Gast mit "Herr ${name.display}" oder "Frau ${name.display}" an — entscheide das Geschlecht anhand des Namens. Wenn du dir unsicher bist, verwende "Liebe Familie ${name.display}" oder neutral "Liebe Gäste". NIEMALS "Lieber ${name.display}" oder "Liebe ${name.display}".`
        : name.kind === "family"
        ? `Anrede als Familie: "Liebe ${name.display}" oder "Willkommen, ${name.display}".`
        : name.kind === "full"
        ? `Der Gast heißt "${name.first} ${name.last}" — Vorname und Nachname. Bei privaten Anlässen (Geburtstag, Familienfeier, Hochzeit, Jahrestag) darfst du den Vornamen nutzen: "Lieber ${name.first}" oder "Liebe ${name.first}". Bei Geschäftsessen immer formell: "Sehr geehrter Herr ${name.last}" oder "Sehr geehrte Frau ${name.last}".`
        : name.kind === "group"
        ? `"${name.display}" scheint eine Gruppe oder Familie zu sein. Wähle eine passende Gruppen-Anrede ("Liebe ${name.display}", "Willkommen, ${name.display}").`
        : `Der Gast heißt "${name.display}". Sprich freundlich, aber ohne Vornamen zu erfinden.`,
    en:
      name.kind === "lastname"
        ? `IMPORTANT: "${name.display}" is the guest's last name. Address them as "Mr ${name.display}" or "Ms ${name.display}" — decide the gender from the name. NEVER use "Dear ${name.display}" as if it were a first name.`
        : name.kind === "family"
        ? `Address as family: "Dear ${name.display}".`
        : name.kind === "full"
        ? `Guest is "${name.first} ${name.last}" (first + last). For private occasions you may use the first name "Dear ${name.first}"; for business always formal "Dear Mr/Ms ${name.last}".`
        : `Address the party naturally without inventing a first name.`,
    fr:
      name.kind === "lastname"
        ? `IMPORTANT : "${name.display}" est le nom de famille. Utilise "Monsieur ${name.display}" ou "Madame ${name.display}" — décide selon le nom. JAMAIS "Cher ${name.display}" comme un prénom.`
        : name.kind === "full"
        ? `"${name.first} ${name.last}" — prénom et nom. Occasions privées : "Cher ${name.first}" ; affaires : "Monsieur/Madame ${name.last}".`
        : `Adresse naturelle, sans inventer de prénom.`,
    it:
      name.kind === "lastname"
        ? `IMPORTANTE: "${name.display}" è il cognome. Usa "Signor ${name.display}" o "Signora ${name.display}" — decidi dal nome. MAI "Caro ${name.display}" come fosse un nome.`
        : name.kind === "full"
        ? `"${name.first} ${name.last}" — nome e cognome. Occasioni private: "Caro/Cara ${name.first}"; affari: "Signor/Signora ${name.last}".`
        : `Saluta l'ospite senza inventare un nome.`,
  }

  // Season block — embeds concrete sensory hints for this time of year
  const seasonBlockDe = `JAHRESZEIT: ${SEASON_LABELS.de[season]}. ${SEASON_DETAILS_DE[season]}. Verwebe MINDESTENS EIN konkretes saisonales Detail in den Text (nicht alles, nur eines das passt).`
  const seasonBlockEn = `SEASON: ${SEASON_LABELS.en[season]}. Weave at least one concrete seasonal detail into the text (long daylight for summer, red cheeks from skiing for winter, etc.).`
  const seasonBlockFr = `SAISON: ${SEASON_LABELS.fr[season]}. Intègre au moins un détail saisonnier concret.`
  const seasonBlockIt = `STAGIONE: ${SEASON_LABELS.it[season]}. Inserisci almeno un dettaglio stagionale concreto.`

  const seasonBlock: Record<TischkartenLanguage, string> = {
    de: seasonBlockDe,
    en: seasonBlockEn,
    fr: seasonBlockFr,
    it: seasonBlockIt,
  }

  const promptIntro: Record<TischkartenLanguage, string> = {
    de: `Schreibe eine persönliche, handschriftlich wirkende Tischkarte für den Gast: ${input.guestName}`,
    en: `Write a personal, hand-written style table card for: ${input.guestName}`,
    fr: `Écris une carte de table personnelle, style manuscrit : ${input.guestName}`,
    it: `Scrivi un biglietto da tavolo personale, stile manoscritto: ${input.guestName}`,
  }

  const userPromptParts: string[] = [
    promptIntro[lang],
    "",
    nameInstructions[lang],
    "",
    seasonBlock[lang],
  ]

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

  const MAX_ATTEMPTS = 4
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
      temperature: 0.5,
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
    const check = hasForbiddenContent(lastResult, lang, input.guestName)
    if (check.ok) {
      return lastResult
    }
    lastReason = check.reason
  }

  // All attempts violated the guards. Throw so the API returns a 500 and the
  // user knows to retry — this is much better than silently surfacing a
  // broken card.
  // eslint-disable-next-line no-console
  console.error(
    `[generateTischkarteText] All ${MAX_ATTEMPTS} attempts failed guard. Last reason: ${lastReason}`
  )
  throw new Error(
    `Tischkarten-Text konnte nach ${MAX_ATTEMPTS} Versuchen nicht in Dakota-Qualitaet erstellt werden. ` +
      `Grund: ${lastReason ?? "unbekannt"}. Bitte erneut versuchen.`
  )
}
