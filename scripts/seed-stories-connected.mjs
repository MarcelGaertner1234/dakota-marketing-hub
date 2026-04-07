// Seed 10 neue Stories + Update die 3 existierenden mit Konzept/Event-Verknüpfungen.
// Alle IDs stammen aus realen Konzepten/Events via MCP (list_concepts, list_events).
// Jede Story hat eine klare semantische Verbindung: Konzept → Event → Ziel-Lead-Segment.

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envFile = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8')
const env = Object.fromEntries(
  envFile
    .split('\n')
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => {
      const idx = l.indexOf('=')
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^["']|["']$/g, '')]
    })
)

const sb = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
)

// ============================================
// KONZEPT-IDs (aus list_concepts)
// ============================================
const C = {
  afterwork: 'fc8eb6dd-3e84-47eb-b2f6-9f821fd1a83a',
  friday_lounge: 'c085e751-819d-4976-8b37-218f8b1d3f33',
  sonntagsbrunch: 'faf7a192-48e1-442b-9bbe-3d64b5630de4',
  biker_treff: 'a287c0ee-88d8-4814-8514-15381b8f5e5b',
  sportler_menu: '71e3a765-a89f-48d7-b689-5cb771f1cdeb',
  nachbarschafts_apero: 'c484a43a-0e26-4450-9d2a-3b094bb7d520',
  themenabend: '24ed6617-9c59-4042-a313-980d40d123fe',
  vereinsstube: '8f69db02-1d36-40e1-ba0d-1245d80b247d',
  zmittag_im_dorf: 'ad2e2f71-4be7-44ac-a334-57d3d7910ba3',
  produzenten: 'f79350f8-d22e-43da-9cb8-29944715867f',
  vorhang_teller: '87bf89c1-6b62-4446-8599-226ee291aa3a',
  dakota_1946: '733fe28f-1975-44bd-b029-ed4d0a9a4d95',
}

// ============================================
// EVENT-IDs (aus list_events)
// ============================================
const E = {
  bii_de_grossmuetter_fruehling: 'c876f50f-9104-4636-9a47-035c6e27817c', // 2026-04-18
  afterwork_launch: '027d4142-0b3c-43a3-bf7f-d2b2a77d85bf', // 2026-04-24
  friday_lounge_opening: '38da2613-c2ad-4be7-9174-446e37c1b4ec', // 2026-05-01
  muttertag: '9c3422a1-62c0-4b97-af43-546c9210d991', // 2026-05-10
  bauernmarkt_brunch: 'fa305091-b46e-4c72-b16b-6bd4ffbb5ba3', // 2026-06-01
  biker_saisonstart: '498b7b7a-0636-4284-aca2-1cd046e64b2a', // 2026-06-07
  volkstheaterfestival: '05a0dd76-8c26-4524-b381-028c542f2f04', // 2026-06-10
  grill_am_berg_erster: 'd02c6d4d-be54-4c72-84a0-5b0de4097004', // 2026-07-03
  jagd_eroeffnung: '756a603d-4a41-4656-a94e-f13844ffdad5', // 2026-09-06
  dakota_gedenkwoche: '50dae096-bddf-4b96-bc8e-f534bd13014b', // 2026-11-19
  jodlerklub_jahreskonzert: 'ab14dc00-15d3-4d23-9fb3-7d0f350fc92d', // 2026-03-07
  stiftung_alpbach_mittagstisch: '708ead3c-e10c-43ab-a032-840137d52548', // 2026-04-20
  warenmarkt_fruehling: '1e8c3053-e26d-4461-90ae-e7d0953ced96', // 2026-04-08
}

// ============================================
// 10 NEUE STORIES
// ============================================
const NEW_STORIES = [
  {
    title: 'Bii de Grossmuetter',
    subtitle: 'Ein Abend, den wir uns von unseren Nanis geklaut haben',
    category: 'dish',
    paragraph_1:
      '"Bii de Grossmuetter" — das sagt man im Haslital, wenn man irgendwo hingeht, wo noch richtig gekocht wird. Wo der Tisch lang ist, die Schüsseln gross sind, und niemand fragt, wie viele Kalorien drinstecken.',
    paragraph_2:
      'Heute Abend ist unsere Küche genau so. Ghackts mit Hörnli, Chabis, Surchruut, Chästorte, Apfelmues aus dem Keller — nichts ist neu, alles ist alt. Die Rezepte haben wir bei den Grossmüttern im Dorf zusammengesammelt, jede hat etwas beigesteuert, jede hat etwas anders gemacht. So ist es geworden wie es ist: ehrlich, nahrhaft, laut an langen Tischen.',
    paragraph_3:
      'Bring jemanden mit, der sich nicht zu fein ist für zweimal nachschöpfen.',
    linked_concept_id: C.themenabend,
    linked_event_id: E.bii_de_grossmuetter_fruehling,
    status: 'published',
    sort_order: 10,
  },
  {
    title: 'Donnerstag, 17 Uhr',
    subtitle: 'Warum wir einen Tag pro Woche für den Feierabend reservieren',
    category: 'house',
    paragraph_1:
      'Im Haslital gibt es viele Orte zum Arbeiten. Die Klinik, die Gemeinde, die Handwerker-Betriebe, der Militärflugplatz, die Geschäfte entlang der Hauptstrasse. Was es zu wenig gibt, ist ein Ort, der am Donnerstagabend einfach da ist, wenn man noch nicht nach Hause will.',
    paragraph_2:
      'Ab diesem Donnerstag sind wir genau das. Ab 17 Uhr. Aperol Spritz für zwölf Franken, Bier vom Fass für sechs, ein Snack-Plättli für fünfzehn. Kein DJ, kein Tam-Tam, keine Reservierung nötig. Einfach rein, hinsetzen, die Schuhe ausziehen, wenn du willst.',
    paragraph_3:
      'Der Feierabend gehört dir. Wir stellen nur den Platz dafür hin.',
    linked_concept_id: C.afterwork,
    linked_event_id: E.afterwork_launch,
    status: 'published',
    sort_order: 11,
  },
  {
    title: 'Die Forelle aus dem Reichenbach',
    subtitle: 'Zwölf Minuten vom Becken auf deinen Teller',
    category: 'dish',
    paragraph_1:
      'Wenige hundert Meter von unserer Tür steht eine Forellenzucht, die seit Jahrzehnten dasselbe macht: die Fische aus dem Wasser holen, das aus demselben Fels kommt, über den Sherlock Holmes gestürzt ist. Dasselbe Wasser, dieselbe Ruhe, dieselbe Sorgfalt.',
    paragraph_2:
      'Wir holen sie morgens, zubereitet wird mittags. Dazwischen liegen zwölf Minuten Weg und vielleicht zehn Minuten in unserer Küche. Keine Tiefkühlkette, keine Umverpackung, kein Rätselraten, woher sie kommt. Butter, Zitrone, Salz, ein Zweig aus dem Garten daneben — mehr braucht eine Forelle nicht, die so frisch ist.',
    paragraph_3:
      'Näher kommst du dem Reichenbach nicht, ohne nass zu werden.',
    linked_concept_id: C.produzenten,
    linked_event_id: E.warenmarkt_fruehling,
    status: 'published',
    sort_order: 12,
  },
  {
    title: 'Die Freitagslichter',
    subtitle: 'Warum wir das Wochenende nicht warten lassen',
    category: 'drink',
    paragraph_1:
      'Die ganze Woche arbeitet das Haslital. In der Klinik, auf der Baustelle, am Berg, am Flugplatz, am Schreibtisch. Und irgendwann am Freitag — so gegen fünf, manchmal früher — passiert etwas: die Schultern gehen runter, die Stimmen werden leiser, die Lichter im Dorf werden wärmer.',
    paragraph_2:
      'Genau dann geht bei uns der DJ an. Signature Cocktails für sechzehn Franken, Sharing Boards in der Mitte des Tisches, Musik, die dich nicht zwingt zu tanzen, aber dich darin bestärkt, wenn du willst. Lounge-Food, keine Dresscode-Polizei, kein Mindestumsatz.',
    paragraph_3: 'Stylish. Entspannt. Bezahlbar. So wie ein Freitag sein sollte.',
    linked_concept_id: C.friday_lounge,
    linked_event_id: E.friday_lounge_opening,
    status: 'published',
    sort_order: 13,
  },
  {
    title: 'Der Biker-Kaffee um 9',
    subtitle: 'Warum der Saisonstart bei uns mit einem Helm beginnt',
    category: 'drink',
    paragraph_1:
      'Wer im Haslital wohnt, kennt das Geräusch: irgendwann im Mai, wenn die Strassen zum Susten, Grimsel und Brünig wieder aufgehen, beginnt es. Hundert Meter vor dem Dorf hört man sie schon — die Töffs, die nach monatelanger Winterpause endlich wieder atmen dürfen.',
    paragraph_2:
      'Wir haben die Parkplätze direkt vor der Tür reserviert, den Kaffee schon vor sieben aufgesetzt, den Biker-Zmorge für zweiundzwanzig Franken auf der Karte. Grosse Portionen, ehrlicher Preis, keine Fragen. Nur ein Ort, wo man den Helm ablegen, die Karte studieren, die Route aufzeichnen und einfach kurz nichts tun kann, bevor es weitergeht.',
    paragraph_3:
      'Ein Sommer beginnt hier. Bei uns. Mit dem ersten Espresso nach dem ersten Pass.',
    linked_concept_id: C.biker_treff,
    linked_event_id: E.biker_saisonstart,
    status: 'published',
    sort_order: 14,
  },
  {
    title: 'Bauernmarkt am Sonntag',
    subtitle: 'Was am Samstag gepflückt wird, liegt am Sonntag auf deinem Teller',
    category: 'dish',
    paragraph_1:
      'Am Samstagmorgen steht das halbe Dorf auf dem Warenmarkt. Bauern aus dem Haslital, Gemüse aus den Gärten von Schattenhalb, Käse von der Alp oberhalb Meiringen, Brot vom Beck Imboden, Honig aus den Wabenkästen am Hasliberg.',
    paragraph_2:
      'Sonntagmorgen geht das alles in unsere Küche. Frisches Brot, warme Eierspeisen, Alpkäse, Birchermüesli mit regionalen Früchten, Lachs, warmer Rösti, Patisserie aus dem eigenen Ofen. Kein Buffet, das von irgendwoher kommt — sondern eines, das vor zwölf Stunden noch auf dem Marktstand lag.',
    paragraph_3:
      'So nah am Ursprung, dass der Bauer noch weiss, welche Kuh es war.',
    linked_concept_id: C.sonntagsbrunch,
    linked_event_id: E.bauernmarkt_brunch,
    status: 'published',
    sort_order: 15,
  },
  {
    title: 'Zmittag im Dorf',
    subtitle: 'Ein warmer Teller für alle, die heute noch etwas vorhaben',
    category: 'house',
    paragraph_1:
      'Manchmal ist ein Mittagessen nur ein Mittagessen. Keine Degustation, kein Chef\'s Table, kein Sechs-Gang-Menü. Einfach: warm, gut, pünktlich, bezahlbar. Damit der Nachmittag weitergehen kann.',
    paragraph_2:
      'Unser Tagesteller ist genau das. Wochenhit zum fairen Preis, halbe Portionen auf Wunsch, Dessert und Kaffee im Paket, wenn du magst. Wir reservieren auch für Gruppen: die Kollegen aus dem Büro, den Verein in der Mittagspause, die Senioren vom Alterszentrum, die sich einmal in der Woche zum Essen treffen.',
    paragraph_3:
      'Ohni Gstuerm. Ohne grosse Worte. Ohne dich lange warten zu lassen.',
    linked_concept_id: C.zmittag_im_dorf,
    linked_event_id: E.stiftung_alpbach_mittagstisch,
    status: 'published',
    sort_order: 16,
  },
  {
    title: 'Die Vereinsstube nach der Probe',
    subtitle: 'Wo das Schlusslied weitergeht',
    category: 'house',
    paragraph_1:
      'Im Haslital gibt es mehr Vereine als Strassennamen. Jodlerklub, Musikgesellschaft, Turnverein, Schwingklub, Schützen, Frauenchor, Singkreis, SAC. Jeden Abend wird irgendwo geprobt, trainiert, gesungen, getroffen. Und dann ist die Probe fertig — und wohin geht man?',
    paragraph_2:
      'Zu uns, wenn ihr wollt. Wir haben die langen Tische dafür. Die Vereinsplatte zum Teilen, Schnitzel mit Pommes, Ghackets mit Hörnli, ein Bier zum Runterkommen. Reservierbar für Gruppen von zehn bis vierzig. Unkompliziert. Warm. Laut, wenn ihr laut sein wollt. Ruhig, wenn der Abend lang wird.',
    paragraph_3: 'Die Dakota-Stube. Euer zweiter Vereinsraum, mit Küche.',
    linked_concept_id: C.vereinsstube,
    linked_event_id: E.jodlerklub_jahreskonzert,
    status: 'published',
    sort_order: 17,
  },
  {
    title: 'Grill am Berg',
    subtitle: 'Sechs Freitage, ein Sommer, ein Feuer',
    category: 'location',
    paragraph_1:
      'Im Juli und August, jeden Freitag, geht bei uns der Grill an. Draussen, unter freiem Himmel, mit Blick in die Berge, mit dem Geruch der Holzkohle, der weiter trägt als die Musik. Das ist kein Konzept, das man erklären muss. Das ist ein Sommer, den man riecht, bevor man ihn sieht.',
    paragraph_2:
      'Auf dem Rost liegt, was die Region geben kann: Bratwürste vom Metzger, der uns kennt, Forellen aus dem Reichenbach, Gemüse vom Markt, Haslitaler Lamm, wenn wir Glück haben. Dazu ein kaltes Bier, Wein von hier, ein Dessert unter den Sternen.',
    paragraph_3: 'Sechs Freitage. Ein Sommer. Komm vorbei, bevor er vorbei ist.',
    linked_concept_id: C.themenabend,
    linked_event_id: E.grill_am_berg_erster,
    status: 'published',
    sort_order: 18,
  },
  {
    title: 'Die Jagd-Eröffnung',
    subtitle: 'Der erste Rehrücken der Saison gehört dem Haslital',
    category: 'dish',
    paragraph_1:
      'Am ersten Septemberwochenende geht die Jagd auf im Berner Oberland. Seit Generationen ist das mehr als ein Kalendereintrag — es ist der Moment, in dem die Natur sich verändert, der Wald anders klingt, und die Küche im Haslital eine andere Sprache zu sprechen beginnt.',
    paragraph_2:
      'Wir feiern das seit Tag eins. Unsere Jagd-Eröffnung ist eine Wild-Degustation mit dem Fleisch von Jägern, die wir kennen, aus Revieren, die wir benennen können. Rehrücken mit Preiselbeeren, Hirschpfeffer mit Spätzle, Gämspfeffer mit Rotkraut, dazu ein Wein aus dem Berner Oberland, der stark genug ist, um dagegenzuhalten.',
    paragraph_3: 'Ein Ritual. Ein Abend. Ein Stück Wald auf dem Teller.',
    linked_concept_id: C.themenabend,
    linked_event_id: E.jagd_eroeffnung,
    status: 'published',
    sort_order: 19,
  },
]

// ============================================
// UPDATES für 3 existierende Stories
// Setzt Konzept/Event-Links ohne Text-Änderung
// ============================================
const UPDATES_BY_TITLE = [
  {
    title: 'Dakota',
    linked_concept_id: C.dakota_1946,
    linked_event_id: E.dakota_gedenkwoche,
  },
  {
    title: 'Die Meringue',
    linked_concept_id: C.sonntagsbrunch,
    linked_event_id: E.muttertag,
  },
  {
    title: 'Der Reichenbach',
    linked_concept_id: C.vorhang_teller,
    linked_event_id: E.volkstheaterfestival,
  },
]

// ============================================
// EXECUTE
// ============================================

console.log('=== 1. Update existing stories with concept/event links ===')
for (const u of UPDATES_BY_TITLE) {
  const { data, error } = await sb
    .from('stories')
    .update({
      linked_concept_id: u.linked_concept_id,
      linked_event_id: u.linked_event_id,
      updated_at: new Date().toISOString(),
    })
    .eq('title', u.title)
    .select('id, title')
  if (error) {
    console.error(`  FEHLER bei ${u.title}:`, error.message)
  } else {
    console.log(`  updated: ${u.title} →`, data)
  }
}

console.log('\n=== 2. Insert 10 new stories ===')
for (const s of NEW_STORIES) {
  // Idempotenz: Wenn Story mit gleichem Titel existiert, Skip
  const { data: existing } = await sb
    .from('stories')
    .select('id')
    .eq('title', s.title)
    .maybeSingle()

  if (existing) {
    console.log(`  skip (existiert): ${s.title}`)
    continue
  }

  const { data, error } = await sb
    .from('stories')
    .insert(s)
    .select('id, title, category')
    .single()
  if (error) {
    console.error(`  FEHLER bei ${s.title}:`, error.message)
  } else {
    console.log(`  insert: [${data.category}] ${data.title}  (${data.id})`)
  }
}

console.log('\n=== 3. Final count ===')
const { count } = await sb
  .from('stories')
  .select('*', { count: 'exact', head: true })
console.log(`  Total stories in DB: ${count}`)

const { data: all } = await sb
  .from('stories')
  .select('title, category, status, linked_concept_id, linked_event_id')
  .order('sort_order')
console.log('\n=== 4. All stories with link status ===')
for (const s of all) {
  const links = []
  if (s.linked_concept_id) links.push('→concept')
  if (s.linked_event_id) links.push('→event')
  console.log(`  [${s.status}] [${s.category}] ${s.title}  ${links.join(' ')}`)
}
