// Kadersitzung 02.04.2026 — Daten in Supabase einfügen
const SUPABASE_URL = "https://icbppcieyplksnajmwwr.supabase.co"
const SUPABASE_KEY = "sb_publishable_z5jdxlttSLh1qaRzr6ve4Q_2s0fQlh_"

async function api(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
    },
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) {
    console.error(`ERROR ${table}:`, json)
    return null
  }
  return json
}

async function query(table) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    },
  })
  return res.json()
}

async function main() {
  console.log("Lade Team-Mitglieder...")
  const team = await query("team_members")
  const marcel = team.find(t => t.name === "Marcel")
  const thomas = team.find(t => t.name === "Thomas")
  const vanessa = team.find(t => t.name === "Vanessa")
  const antonella = team.find(t => t.name === "Antonella")

  console.log("Lade Konzepte...")
  const concepts = await query("concepts")
  const afterwork = concepts.find(c => c.slug === "afterwork")
  const fridayLounge = concepts.find(c => c.slug === "friday-lounge")
  const brunch = concepts.find(c => c.slug === "brunch")
  const bikerTreff = concepts.find(c => c.slug === "biker-treff")
  const sportler = concepts.find(c => c.slug === "sportler-menu")
  const apero = concepts.find(c => c.slug === "nachbarschafts-apero")
  const themenabend = concepts.find(c => c.slug === "themenabend")

  // EVENTS
  console.log("Erstelle Events...")
  // Helper: ensure all objects have same keys
  function ev(title, desc, type, date, time, endTime, loc, conceptId, leadDays) {
    return { title, description: desc, event_type: type, start_date: date, start_time: time, end_time: endTime, location: loc, concept_id: conceptId, lead_time_days: leadDays, created_by: marcel?.id }
  }

  const events = await api("events", [
    ev("Vereinsliste Essen einladen", "Donnerstag — lokale Vereine zum Essen einladen. Skript fertig machen.", "own_event", "2026-04-09", "18:00", null, "Dakota Air Lounge", null, 7),
    ev("Afterwork Launch", "Ende April mit Spezialpreisen. Flyer vorbereiten. Kleiner Snack.", "concept_event", "2026-04-24", "17:00", "21:00", "Dakota Air Lounge", afterwork?.id, 21),
    ev("Nach-Training Abendessen", "Sportler nach dem Training zum Essen einladen.", "concept_event", "2026-04-02", "19:00", null, "Dakota Air Lounge", sportler?.id, 0),
    ev("Spezialitaetenabend", "Kulinarischer Themenabend. Berndeutsch-Konzept bestimmen.", "concept_event", "2026-04-18", "18:30", "22:00", "Dakota Air Lounge", themenabend?.id, 28),
    ev("Friday Lounge Start", "Freitag Lounge-Konzept. Spezialpreise, lockere Atmosphaere.", "concept_event", "2026-05-01", "18:00", "23:00", "Dakota Air Lounge", fridayLounge?.id, 21),
    ev("Nachbarschafts-Apero", "Lokale Zielgruppe evaluieren. Nachbarschaft einladen.", "concept_event", "2026-05-10", "16:00", "19:00", "Dakota Air Lounge", apero?.id, 21),
    ev("Biker Brunch", "Motorrad- und Velofahrer Treffpunkt. Deftige Kueche.", "concept_event", "2026-06-07", "10:00", "14:00", "Dakota Air Lounge", bikerTreff?.id, 28),
    ev("Sonntagsbrunch Launch", "Regionaler Sonntagsbrunch mit lokalen Produkten.", "concept_event", "2026-05-17", "10:00", "14:00", "Dakota Air Lounge", brunch?.id, 28),
    ev("Strassenfest Meiringen", "Lokales Strassenfest — Praesenz zeigen, Flyer verteilen.", "local_event", "2026-06-20", null, null, "Meiringen Zentrum", null, 42),
    ev("Bewertungskarten-Aktion starten", "QR-Code auf Tisch legen. Goody fuer ausgefuellte Bewertungskarten.", "own_event", "2026-04-07", null, null, "Dakota Air Lounge", null, 5),
    ev("Social Media Trailer Produktion", "5-6 Shorts produzieren. Trailer-Konzept aufstellen.", "own_event", "2026-04-14", null, null, "Dakota Air Lounge", null, 14),
    ev("Jahresplan Themenabende definieren", "Kalender fuer ganzes Jahr. Uebersichtlich gestalten.", "own_event", "2026-04-05", null, null, "Dakota Air Lounge", null, 3),
  ])

  if (!events) { console.error("Events fehlgeschlagen"); return }
  console.log(`${events.length} Events erstellt`)

  // TASKS
  console.log("Erstelle Tasks...")
  const em = {}
  for (const e of events) em[e.title] = e.id

  const tasks = await api("tasks", [
    { event_id: em["Vereinsliste Essen einladen"], title: "Vereinsliste zusammenstellen", priority: "high", assigned_to: marcel?.id, due_date: "2026-04-07" },
    { event_id: em["Vereinsliste Essen einladen"], title: "Einladungs-Skript fertig machen", priority: "high", assigned_to: marcel?.id, due_date: "2026-04-07" },
    { event_id: em["Vereinsliste Essen einladen"], title: "Weitere Leads raussuchen", priority: "medium", assigned_to: thomas?.id, due_date: "2026-04-08" },
    { event_id: em["Vereinsliste Essen einladen"], title: "Leads weiterleiten an Thomas, Vanessa, Antonella", priority: "high", assigned_to: marcel?.id, due_date: "2026-04-07" },
    { event_id: em["Afterwork Launch"], title: "Afterwork Flyer gestalten", priority: "high", assigned_to: vanessa?.id, due_date: "2026-04-14" },
    { event_id: em["Afterwork Launch"], title: "Spezialpreise festlegen", priority: "high", assigned_to: marcel?.id, due_date: "2026-04-10" },
    { event_id: em["Afterwork Launch"], title: "Snack-Angebot definieren", priority: "medium", assigned_to: marcel?.id, due_date: "2026-04-12" },
    { event_id: em["Afterwork Launch"], title: "Namen / Uhrzeit / Angebot / Medium festlegen", priority: "high", assigned_to: marcel?.id, due_date: "2026-04-10" },
    { event_id: em["Spezialitaetenabend"], title: "Menue zusammenstellen", priority: "high", assigned_to: marcel?.id, due_date: "2026-04-10" },
    { event_id: em["Spezialitaetenabend"], title: "Berndeutsch-Konzept bestimmen", priority: "medium", assigned_to: marcel?.id, due_date: "2026-04-12" },
    { event_id: em["Spezialitaetenabend"], title: "Emotionale Elemente einbauen", priority: "medium", assigned_to: marcel?.id, due_date: "2026-04-14" },
    { event_id: em["Bewertungskarten-Aktion starten"], title: "QR-Code PDF erstellen", priority: "high", assigned_to: vanessa?.id, due_date: "2026-04-05" },
    { event_id: em["Bewertungskarten-Aktion starten"], title: "Goody-Belohnung definieren", priority: "medium", assigned_to: marcel?.id, due_date: "2026-04-05" },
    { event_id: em["Bewertungskarten-Aktion starten"], title: "QR-Code Aufsteller auf Tische legen", priority: "high", assigned_to: antonella?.id, due_date: "2026-04-07" },
    { event_id: em["Social Media Trailer Produktion"], title: "Short-Trailer Konzept aufstellen", priority: "high", assigned_to: vanessa?.id, due_date: "2026-04-10" },
    { event_id: em["Social Media Trailer Produktion"], title: "5-6 Shorts planen", priority: "high", assigned_to: vanessa?.id, due_date: "2026-04-12" },
    { event_id: em["Social Media Trailer Produktion"], title: "Trailer drehen", priority: "high", assigned_to: thomas?.id, due_date: "2026-04-14" },
    { event_id: em["Jahresplan Themenabende definieren"], title: "Themenabende fuer 2026 definieren", priority: "urgent", assigned_to: marcel?.id, due_date: "2026-04-05" },
    { event_id: em["Jahresplan Themenabende definieren"], title: "Nischen-Konzepte pro Monat zuordnen", priority: "high", assigned_to: marcel?.id, due_date: "2026-04-05" },
    { event_id: em["Jahresplan Themenabende definieren"], title: "Medium pro Konzept bestimmen", priority: "medium", assigned_to: vanessa?.id, due_date: "2026-04-06" },
    { event_id: em["Jahresplan Themenabende definieren"], title: "Menue + Preis pro Konzept festlegen", priority: "high", assigned_to: marcel?.id, due_date: "2026-04-06" },
    { event_id: em["Friday Lounge Start"], title: "Lounge-Menue + Cocktails definieren", priority: "high", assigned_to: marcel?.id, due_date: "2026-04-20" },
    { event_id: em["Friday Lounge Start"], title: "Instagram/TikTok Teaser erstellen", priority: "medium", assigned_to: vanessa?.id, due_date: "2026-04-22" },
    { event_id: em["Friday Lounge Start"], title: "Flyer fuer Locals drucken", priority: "medium", assigned_to: thomas?.id, due_date: "2026-04-25" },
    { event_id: em["Nachbarschafts-Apero"], title: "Lokale Zielgruppe evaluieren", priority: "high", assigned_to: marcel?.id, due_date: "2026-04-20" },
    { event_id: em["Nachbarschafts-Apero"], title: "Einladungsflyer fuer Nachbarschaft", priority: "medium", assigned_to: vanessa?.id, due_date: "2026-04-28" },
    { event_id: em["Strassenfest Meiringen"], title: "Stand-Konzept planen", priority: "medium", assigned_to: marcel?.id, due_date: "2026-05-15" },
    { event_id: em["Strassenfest Meiringen"], title: "Flyer + Visitenkarten vorbereiten", priority: "medium", assigned_to: vanessa?.id, due_date: "2026-06-01" },
    { event_id: em["Strassenfest Meiringen"], title: "Lead-Sammel-System vorbereiten", priority: "high", assigned_to: thomas?.id, due_date: "2026-06-10" },
  ])
  console.log(`${tasks?.length || 0} Tasks erstellt`)

  // LEADS
  console.log("Erstelle Leads...")
  const leads = await api("leads", [
    { name: "Turnverein Meiringen", lead_type: "verein", status: "neu", notes: "Vereinsliste — zum Essen einladen", tags: ["verein", "lokal"], created_by: marcel?.id },
    { name: "Sportclub Hasliberg", lead_type: "verein", status: "neu", notes: "Sportler-Zielgruppe", tags: ["verein", "sportler"], created_by: marcel?.id },
    { name: "Nachbarschaft Dakota", lead_type: "privatperson", status: "neu", notes: "Einheimische Gaeste — Nachbarschafts-Apero", tags: ["lokal", "nachbarschaft"], created_by: marcel?.id },
    { name: "Lokale Biker Gruppe", lead_type: "verein", status: "neu", notes: "Biker Brunch Zielgruppe", tags: ["biker", "sportler"], created_by: marcel?.id },
    { name: "Lokale Firmen (Afterwork)", lead_type: "firma", status: "neu", notes: "Arbeitnehmer fuer Afterwork", tags: ["afterwork", "firmen"], created_by: marcel?.id },
    { name: "Brunch-Liebhaber Region", lead_type: "privatperson", status: "neu", notes: "Familien, Paare fuer Sonntagsbrunch", tags: ["brunch", "familien"], created_by: marcel?.id },
  ])
  console.log(`${leads?.length || 0} Leads erstellt`)

  // SOCIAL POSTS
  console.log("Erstelle Social Posts...")
  const sid = crypto.randomUUID()
  function sp(title, platform, type, status, conceptId, scheduledAt, seriesId, seriesOrder, caption, hashtags) {
    return { title, platform, post_type: type, status, concept_id: conceptId, scheduled_at: scheduledAt, series_id: seriesId, series_order: seriesOrder, caption, hashtags, assigned_to: vanessa?.id, created_by: marcel?.id }
  }
  const posts = await api("social_posts", [
    sp("Afterwork Launch Teaser", "instagram", "reel", "draft", afterwork?.id, "2026-04-20T12:00:00Z", null, null, null, null),
    sp("Spezialitaetenabend Ankuendigung", "facebook", "post", "draft", null, "2026-04-14T10:00:00Z", null, null, null, null),
    sp("Friday Lounge Short #1", "tiktok", "short", "draft", fridayLounge?.id, null, sid, 1, null, null),
    sp("Friday Lounge Short #2", "tiktok", "short", "draft", fridayLounge?.id, null, sid, 2, null, null),
    sp("Friday Lounge Short #3", "tiktok", "short", "draft", fridayLounge?.id, null, sid, 3, null, null),
    sp("Friday Lounge Short #4", "tiktok", "short", "draft", fridayLounge?.id, null, sid, 4, null, null),
    sp("Friday Lounge Short #5", "tiktok", "short", "draft", fridayLounge?.id, null, sid, 5, null, null),
    sp("Nachbarschafts-Apero Einladung", "facebook", "post", "draft", apero?.id, "2026-05-03T10:00:00Z", null, null, null, null),
    sp("Biker Brunch Ankuendigung", "instagram", "post", "draft", bikerTreff?.id, "2026-05-25T12:00:00Z", null, null, null, null),
    sp("Bewertungskarten-Aktion", "instagram", "post", "draft", null, "2026-04-08T12:00:00Z", null, null, "Bewerte dein Erlebnis und erhalte ein Goody!", ["dakota", "meiringen", "airlounge"]),
  ])
  console.log(`${posts?.length || 0} Social Posts erstellt`)

  console.log("\nFERTIG! Alle Kadersitzung-Daten eingefuegt.")
}

main().catch(console.error)
