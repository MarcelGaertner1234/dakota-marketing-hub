/**
 * Single source of truth for the Dakota brand-entity facts + the forbidden-term
 * guard, shared across ALL KI generators (Tischkarte text, social captions,
 * illustrations) and ALL languages.
 *
 * Background: the entity facts used to be duplicated per generator, and two of
 * them carried the WRONG fact ("Flugzeug-Hangar / Flugfeld" as the restaurant's
 * location) — the P0 "two brand truths" bug. The truth lives here now; import it
 * everywhere instead of re-stating it.
 *
 * The truth: the Dakota Air Lounge is the restaurant inside Hotel Dakota, in the
 * VILLAGE CENTRE of Meiringen (Berner Oberland). "Dakota" is a homage to the
 * 1940s DC-3 "Dakota" aircraft — a name, never a location. There is no hangar,
 * airfield, runway or airport here.
 */

import type { TischkartenLanguage } from "@/types/database"

// ──────────────────────────────────────────────────────────────
// Entity facts per language — inject into every TEXT system prompt.
// ──────────────────────────────────────────────────────────────
export const DAKOTA_ENTITY: Record<TischkartenLanguage, string> = {
  de: `WAHRHEIT ÜBER DEN ORT (verbindlich):
- Das Dakota Air Lounge ist das Restaurant im Hotel Dakota, MITTEN IM DORFKERN von Meiringen (Berner Oberland, Schweiz) — ein gemütliches, holzvertäfeltes Haus.
- "Dakota" ist eine Hommage an das DC-3-Flugzeug "Dakota" aus den 1940ern — nur ein Name, KEINE Ortsangabe.
- Das Restaurant ist NICHT in einem Flugzeug-Hangar, nicht am Flugfeld, Flughafen, an einer Piste oder Rollbahn. Solche Orte gibt es hier nicht.
- Lokal verankert: Meiringen, Reichenbachfall, Aareschlucht, Haslital, Berner Oberland.`,
  en: `TRUTH ABOUT THE PLACE (binding):
- The Dakota Air Lounge is the restaurant inside Hotel Dakota, in the VILLAGE CENTRE of Meiringen (Berner Oberland, Switzerland) — a cosy, wood-panelled house.
- "Dakota" is a homage to the 1940s DC-3 "Dakota" aircraft — only a name, never a location.
- The restaurant is NOT in an aircraft hangar, airfield, airport, runway or aerodrome. None of these exist here.
- Locally rooted: Meiringen, Reichenbach Falls, Aare Gorge, Haslital, Berner Oberland.`,
  fr: `VÉRITÉ SUR LE LIEU (impérative) :
- Le Dakota Air Lounge est le restaurant de l'Hôtel Dakota, AU CENTRE DU VILLAGE de Meiringen (Oberland bernois, Suisse) — une maison chaleureuse, lambrissée de bois.
- « Dakota » est un hommage à l'avion DC-3 « Dakota » des années 1940 — seulement un nom, jamais un lieu.
- Le restaurant n'est PAS dans un hangar, un terrain d'aviation, un aéroport ou près d'une piste. Rien de tout cela n'existe ici.
- Ancré localement : Meiringen, chutes de Reichenbach, gorges de l'Aar, Haslital, Oberland bernois.`,
  it: `VERITÀ SUL LUOGO (vincolante):
- Il Dakota Air Lounge è il ristorante dell'Hotel Dakota, NEL CENTRO DEL PAESE di Meiringen (Oberland bernese, Svizzera) — una casa accogliente, rivestita in legno.
- "Dakota" è un omaggio all'aereo DC-3 "Dakota" degli anni '40 — solo un nome, mai un luogo.
- Il ristorante NON si trova in un hangar, un campo d'aviazione, un aeroporto o vicino a una pista. Niente di tutto ciò esiste qui.
- Radicato localmente: Meiringen, cascate di Reichenbach, gole dell'Aar, Haslital, Oberland bernese.`,
}

// ──────────────────────────────────────────────────────────────
// Image-prompt guardrail — append to every illustration prompt so the image
// model can't drift to aviation scenery even when "Dakota" appears in context.
// ──────────────────────────────────────────────────────────────
export const LOCATION_GUARDRAIL =
  "SETTING: alpine village restaurant in Meiringen (Berner Oberland), inside Hotel Dakota in the village centre — a cozy wood-panelled inn. NEVER depict a hangar, airport, airfield, runway, airplane, aircraft or aviation scenery. 'Dakota' is only the name (after the DC-3 aircraft), never the location."

// ──────────────────────────────────────────────────────────────
// Forbidden entity terms per language. If any appears in generated TEXT, the
// caller should retry. Kept verbatim from the original tischkarte-text guard so
// behaviour is identical — this is now the single source for all generators.
// ──────────────────────────────────────────────────────────────
export const FORBIDDEN_ENTITY_TERMS: Record<TischkartenLanguage, RegExp[]> = {
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

/**
 * Returns the forbidden entity terms found in `text` for the given language
 * (empty array = clean). Falls back to the German term set for unknown langs.
 */
export function findForbiddenTerms(
  text: string,
  language: TischkartenLanguage = "de"
): string[] {
  const patterns = FORBIDDEN_ENTITY_TERMS[language] ?? FORBIDDEN_ENTITY_TERMS.de
  const hits: string[] = []
  for (const re of patterns) {
    const m = text.match(re)
    if (m) hits.push(m[0])
  }
  return hits
}
