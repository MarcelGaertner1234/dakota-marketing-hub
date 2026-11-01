// Hub-Refresh 01.11.2026: Kalender Winter 2026/27 + 2027 füllen, falsche Nov/Dez-Events bereinigen,
// alte April-Tasks schliessen, Konzepte und Leads nachziehen. Idempotent (prüft auf Titel + Datum).
// Quellen: 00_WINTERKONZEPT_2026_27 (Entscheide 1.11.), 00_EVENTPLANUNG_2027/build_eventplanung_2027.py (V3).
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envFile = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8')
const env = Object.fromEntries(envFile.split('\n').filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] }))
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })
const TODAY = '2026-11-01'
const log = (...a) => console.log(...a)
const die = (where, error) => { if (error) { console.error(where, error.message); process.exit(1) } }

// ---------- Team
const { data: team } = await sb.from('team_members').select('id,name')
const T = Object.fromEntries(team.map((t) => [t.name, t.id]))
if (!T.Alexandra) {
  const { data, error } = await sb.from('team_members').insert({ name: 'Alexandra', role: 'manager', color: '#C5A572' }).select('id').single()
  die('team', error); T.Alexandra = data.id; log('Team: Alexandra angelegt')
}

// ---------- Konzepte
const CONCEPTS = [
  { slug: 'menue-des-monats', name: 'Menü des Monats (Winterkonzept)', description: 'Jeden Monat ein Kapitel der Dakota-Geschichte als 3-Gang-Menü zu CHF 45 (Auftakt + drei Gänge, Weinbegleitung 18). Dezember «Festessen im Tal», Januar «Männer am Berg», Februar «Victor und Pista». Dazu die fixen Originale (Sky Burger, Cordon bleu, Ravioli, Tartiflette, Bratwurst, Fondue, Raclette).', target_audience: 'Einheimische, Hotelgäste, Wintergäste', menu_description: 'Vorspeise, Hauptgang, Dessert des Monats; einzeln bestellbar (12 / 32 / 10)', price_range: 'CHF 45', sort_order: 1 },
  { slug: 'familientisch', name: 'Familientisch · Sonntag', description: 'Sonntags Hackbraten mit Zwiebelsauce, Kartoffelstock und Rotkraut; Kinderkarte (Ghackets & Hörnli, Hamburger, Nuggets, Pasta Pomodoro).', target_audience: 'Familien aus dem Haslital', menu_description: 'Hackbraten 28, Kinder 11.50–16', price_range: 'CHF 12–28', sort_order: 2 },
  { slug: 'dein-event', name: 'Dein Event (Gruppen & Firmen)', description: 'Anlässe ab 10 Personen, auch mittwochs: Weihnachtsessen, Vereine, Firmen, Familien. QR auf der Bordkarte führt zur Event-Seite.', target_audience: 'Vereine, Firmen, Familien, Militär, Reha-Klinik', menu_description: 'Menü des Monats oder Originale, Fondue, Raclette', price_range: 'CHF 45–55 p.P.', sort_order: 3 },
]
for (const c of CONCEPTS) {
  const { error } = await sb.from('concepts').upsert({ ...c, is_active: true, channels: ['instagram', 'facebook', 'website', 'bordkarte'], updated_at: new Date().toISOString() }, { onConflict: 'slug' })
  die('concept ' + c.slug, error)
}
await sb.from('concepts').update({ name: 'Monatsbrunch (letzter Sonntag)', description: 'Testphase 2027: jeweils am letzten Sonntag 09:30–13:00. Schwelle 25 Gäste, sonst Rhythmus reduzieren. Osterbrunch 28.03. zählt als Anker.', price_range: 'CHF 38–45', sort_order: 4, is_active: true, updated_at: new Date().toISOString() }).eq('slug', 'sonntagsbrunch')
const INACTIVE = ['afterwork', 'friday-lounge', 'biker-treff', 'sportler-men', 'nachbarschafts-ap-ro', 'themenabend', 'vereinsstube-haslital', 'zmittag-im-dorf', 'produzenten-am-tisch', 'vorhang-teller']
{ const { error } = await sb.from('concepts').update({ is_active: false, updated_at: new Date().toISOString() }).in('slug', INACTIVE); die('concepts inactive', error) }
const { data: cons } = await sb.from('concepts').select('id,slug')
const C = Object.fromEntries(cons.map((c) => [c.slug, c.id]))
log('Konzepte: 3 neu/aktualisiert, Monatsbrunch umbenannt,', INACTIVE.length, 'inaktiv')

// ---------- Events: Bereinigung
const DELETE = [['2026-11-01', 'Metzgete'], ['2026-11-15', 'Whisky & Wild'], ['2026-11-19', '80 Jahre Dakota-Notlandung — Gedenkwoche'], ['2026-11-29', 'Raclette-Abend'], ['2026-12-06', 'Samichlaus-Brunch'], ['2026-12-13', 'Fondue Chinoise Abend']]
let del = 0
for (const [d, t] of DELETE) {
  const { data } = await sb.from('events').select('id').eq('start_date', d).eq('title', t)
  for (const e of data ?? []) { await sb.from('tasks').delete().eq('event_id', e.id); const { error } = await sb.from('events').delete().eq('id', e.id); die('delete ' + t, error); del++ }
}
log('Events gelöscht (Winterpause):', del)
await sb.from('events').update({ title: 'Weihnachtsmenü · 3 Gänge 45.–', end_date: '2026-12-26', description: 'Fr 25. und Sa 26.12.: Weihnachtsmenü drei Gänge zu CHF 45 pro Person (Entscheid 1.11.2026). 24.12. abends Restaurant geschlossen, nur Halbpension.', concept_id: C['menue-des-monats'], updated_at: new Date().toISOString() }).eq('start_date', '2026-12-25').eq('title', 'Weihnachts-Dinner')
await sb.from('events').update({ title: 'Silvester · 5 Gänge, Welcomedrink, Musik · 95.–', description: 'Fünf Gänge CHF 95 inkl. Welcomedrink und Musik, max. 40 Gäste, FC 31 %. Offen: wer zahlt die Musik.', updated_at: new Date().toISOString() }).eq('start_date', '2026-12-31').eq('title', 'Silvester Gala-Dinner 2026')
log('Events umgeschrieben: Weihnachtsmenü, Silvester')

// ---------- Events: neu
const ev = (start, title, type, o = {}) => ({ start_date: start, title, event_type: type, location: 'Dakota Air Lounge', recurrence: 'none', lead_time_days: 28, created_by: T.Marcel, ...o })
const MM = C['menue-des-monats'], BR = C['sonntagsbrunch'], DE = C['dein-event']
const NEW = [
  // Winter 2026/27
  ev('2026-11-02', '⛔ Winterpause Restaurant (Hotel offen, Frühstück läuft)', 'own_event', { end_date: '2026-12-16', description: 'Restaurant geschlossen 02.11.–16.12.2026. Frühstück Mi–So durch Frühstückskoch, Mo/Di Kernteam.' }),
  ev('2026-12-17', '✈️ Eröffnung Winterkonzept · Kapitel 5 «Festessen im Tal»', 'concept_event', { end_date: '2026-12-31', concept_id: MM, description: 'Menü des Monats Dezember: Bordkarte Kapitel 5. Do–So, Mittag 11:30–14, Abend 18–21. Cockpit: 9 Betriebstage.' }),
  ev('2026-12-24', 'Heiligabend · Restaurant abends zu, nur Halbpension (7 Gäste)', 'own_event', { description: 'Entscheid 1.11.: 24.12. abends geschlossen, HP für Hotelgäste, Marcel + 1.' }),
  ev('2027-01-01', '✈️ Kapitel 6 «Männer am Berg» · Menü des Monats Januar', 'concept_event', { end_date: '2027-01-31', concept_id: MM, description: 'Bordkarte Kapitel 6, Aufstieg 23. November 1946. 19 Betriebstage.' }),
  ev('2027-02-01', '✈️ Kapitel 7 «Victor und Pista» · Menü des Monats Februar', 'concept_event', { end_date: '2027-02-28', concept_id: MM, description: 'Bordkarte Kapitel 7, Flugtag 24. November 1946. Kalbsvoressen, Quark-Pizokel, Wurzelgemüse. 16 Betriebstage. Danach: Frühling, Osterbrunch, Grosi, Muttertag.' }),
  ev('2027-02-14', '💛 Valentinstag · ein Menü für zwei (3 Gänge 49)', 'concept_event', { concept_id: MM, description: 'Neu 2027 (Eventplanung V3): 3 Gänge zu 49, Ziel 30 Gäste, FC 30 %, Ware max. 14.70/Gast. Fällt auf die Winterfestspiele 13./14.02.' }),
  // Brunch-Serie 2027
  ...[['2027-01-31', 'Testphase'], ['2027-02-28', 'Testphase'], ['2027-04-25', 'Testphase · Ferien-abhängig · danach Entscheid'], ['2027-05-30', 'findet in beiden Varianten statt'], ['2027-06-27', 'entfällt, wenn Schwelle (25 Gäste) verfehlt'], ['2027-07-25', 'findet in beiden Varianten statt'], ['2027-08-29', 'entfällt, wenn Schwelle verfehlt'], ['2027-09-26', 'findet in beiden Varianten statt'], ['2027-10-31', 'ohne Halloween-Thema (Entscheid 30.10.2026)'], ['2027-11-28', 'Ferien-abhängig (Option November)']]
    .map(([d, note]) => ev(d, '🥐 Monatsbrunch · 09:30–13:00', 'concept_event', { concept_id: BR, start_time: '09:30', end_time: '13:00', description: `Letzter Sonntag im Monat. ${note}. Schwelle 25 Gäste.` })),
  // Anker 2027 (Eventplanung V3)
  ev('2027-03-28', '🐣 Osterbrunch · Buffet 45', 'concept_event', { concept_id: BR, start_time: '09:30', description: 'Ersetzt den Monatsbrunch März. Ziel 50 Gäste, CHF 45, FC 35 %. Ostermontag 29.03. ist Ruhetag und Saisonende, nur Sonntag planen.' }),
  ev('2027-04-16', '👵 Bim Grosi deheime · Frühling (Family Style, 52)', 'concept_event', { concept_id: DE, start_time: '18:30', description: 'Exklusiver Abend, 3 Gänge + Brett, Ziel 30 Gäste, CHF 52, FC 30 % (Ware von 20.57 auf ~15.60/Gast). ⚠ Liegt in den vorgeschlagenen Betriebsferien 12.04.–05.05. → GL-Entscheid bis 31.12.2026.' }),
  ev('2027-05-09', '💐 Muttertagsbrunch · 38', 'concept_event', { concept_id: BR, start_time: '09:30', description: 'Brunch hausgemacht, Prosecco mit Erdbeere. Ziel 40 Gäste, CHF 38, FC 40 % (2026: 35, FC ~50 %).' }),
  ev('2027-07-31', '🔥 BBQ-Wochenende + 1. August', 'concept_event', { end_date: '2027-08-01', concept_id: DE, description: 'BBQ à la carte, 1. August mit Live-Volksmusik und Feuerwerk-Blick. Ziel 120 Gäste über 2 Tage, Ø-Bon 45. Ist 2026 nachtragen.' }),
  ev('2027-10-15', '👵 Bim Grosi deheime · Herbschtzyt (52)', 'concept_event', { concept_id: DE, start_time: '18:30', description: '3 Gänge + Brett, Ziel 30 Gäste, CHF 52, FC 30 %. 2026: 24 Gäste zu 75, FC 26.9 %. Engpass Gussbräter/Herd ab 30 Gäste.' }),
  ev('2027-12-31', '🥂 Silvester 2027/28 · 4 Gänge inkl. Welcomedrink (55)', 'concept_event', { concept_id: DE, description: 'Ziel 40 Gäste, CHF 55, FC 32 %, ohne bezahlte Musik (nur wenn das Hotel sie zahlt). 31.12.2027 = Freitag.' }),
  // Betriebsferien + Feiertage 2027
  ev('2027-04-12', '⛔ Betriebsferien Restaurant (Vorschlag, GL-Entscheid bis 31.12.2026)', 'holiday', { end_date: '2027-05-05', description: 'Frühlingsferien 12.04.–05.05.2027 (Entscheid 1.11.). ⚠ Konflikt: Grosi 16.04. und Brunch 25.04. liegen drin → Eventplan anpassen oder Ferien verschieben.' }),
  ev('2027-11-01', '⛔ Betriebsferien Restaurant Herbst', 'holiday', { end_date: '2027-11-16', description: 'Herbstferien 01.–16.11.2027, oder eine Woche später für Events (Entscheid 1.11.). Brunch 28.11. davon abhängig.' }),
  ev('2027-01-01', '🎉 Neujahr', 'holiday'),
  ev('2027-03-26', '✝️ Karfreitag', 'holiday'),
  ev('2027-03-29', '⛔ Ostermontag · Ruhetag, Restaurant zu', 'holiday', { description: 'Entscheid 1.11.: Ostermontag geschlossen. Zugleich Ende Wintersaison Skigebiet.' }),
  ev('2027-05-06', '🎉 Auffahrt · langes Wochenende', 'holiday'),
  ev('2027-05-16', '🎉 Pfingstsonntag', 'holiday'),
  ev('2027-05-17', '✅ Pfingstmontag · Restaurant OFFEN (Ausnahme)', 'holiday', { description: 'Entscheid 1.11.2026: Pfingstmontag offen.' }),
  ev('2027-08-01', '🇨🇭 Nationalfeiertag', 'holiday'),
  ev('2027-09-19', '🙏 Eidg. Bettag', 'holiday'),
  ev('2027-12-25', '🎄 Weihnachten', 'holiday', { end_date: '2027-12-26' }),
  // Schulferien Meiringen 2027 (nach Muster 2026, zu prüfen)
  ev('2027-02-20', '🏫 SCHULFERIEN: Sportferien Schule Meiringen (⚠ zu prüfen)', 'holiday', { end_date: '2027-02-28', description: 'Termin nach Muster 2026 (21.02.–01.03.), offizieller Ferienplan 2027 noch nicht publiziert.' }),
  ev('2027-04-10', '🏫 SCHULFERIEN: Frühlingsferien Schule Meiringen (⚠ zu prüfen)', 'holiday', { end_date: '2027-04-25', description: 'Nach Berner Rahmen 2027 (Spiez 10.–25.04.), Meiringen 2026: 11.–26.04.' }),
  ev('2027-05-06', '🏫 SCHULFREI: Auffahrtsbrücke (⚠ zu prüfen)', 'holiday', { end_date: '2027-05-09' }),
  ev('2027-07-03', '🏫 SCHULFERIEN: Sommerferien Schule Meiringen (⚠ zu prüfen)', 'holiday', { end_date: '2027-08-15', description: 'Nach Berner Rahmen 2027 (03.07.–15.08.), Meiringen 2026: 27.06./04.07.–09.08.' }),
  ev('2027-09-18', '🏫 SCHULFERIEN: Herbstferien Schule Meiringen (⚠ zu prüfen)', 'holiday', { end_date: '2027-10-10', description: 'Nach Muster 2026 (19.09.–11.10.).' }),
  ev('2027-12-24', '🏫 SCHULFERIEN: Weihnachtsferien Schule Meiringen (⚠ zu prüfen)', 'holiday', { end_date: '2028-01-09' }),
  // Regional 2027 (Eventplanung V3, Teil C)
  ev('2027-01-01', '🎿 Nachtskifahren / Nachtschlitteln Hasliberg (jeden Freitag)', 'local_event', { end_date: '2027-03-05', location: 'Meiringen-Hasliberg', description: 'Nur Info, kein eigenes Angebot. Bergbahnen Meiringen-Hasliberg.' }),
  ev('2027-01-09', '🎿 Migros Ski Day / PCI Bau-Skirennen (⚠ Datum unbestätigt)', 'local_event', { end_date: '2027-01-10', location: 'Hasliberg', description: 'Personal/Öffnung anpassen. Quellen widersprechen sich, Alexandra bestätigt bis 30.11.2026.' }),
  ev('2027-01-30', '❄️ Winterspielfest Bidmi', 'local_event', { end_date: '2027-01-31', location: 'Hasliberg', description: 'Personal/Öffnung anpassen.' }),
  ev('2027-02-13', '❄️ Winterfestspiele Meiringen-Hasliberg', 'local_event', { end_date: '2027-02-14', location: 'Meiringen-Hasliberg', description: 'Fällt auf den Valentinstag 14.02.' }),
  ev('2027-03-12', '🚠 Event Bergbahnen Meiringen-Hasliberg (⚠ Titel unklar)', 'local_event', { end_date: '2027-03-13', location: 'Hasliberg', description: 'meiringen-hasliberg.ch/events prüfen.' }),
  ev('2027-03-29', '🚠 SAISONENDE: Skigebiet Meiringen-Hasliberg', 'local_event', { location: 'Hasliberg', description: 'Wintersaison 19.12.2026–29.03.2027.' }),
  ev('2027-06-16', '🎭 Volkstheaterfestival Meiringen (7. Ausgabe)', 'local_event', { end_date: '2027-06-20', location: 'Meiringen', description: 'Apéro OK/Jury wie 2026 anbieten, Gruppenangebote. ⚠ Start Mittwoch = Ruhetag → Ausnahme nötig (GL bis 31.03.2027).' }),
  ev('2027-07-02', '🎶 Musikfestwoche Meiringen', 'local_event', { end_date: '2027-07-10', location: 'Meiringen', description: 'Gruppenangebote (2026: Jugendmusik 09.07.). Quelle haslital.swiss.' }),
]
let ins = 0, skip = 0
for (const e of NEW) {
  const { data } = await sb.from('events').select('id').eq('start_date', e.start_date).eq('title', e.title).limit(1)
  if (data?.length) { skip++; continue }
  const { error } = await sb.from('events').insert(e); die('insert ' + e.title, error); ins++
}
log('Events neu:', ins, '· übersprungen (schon da):', skip)

// ---------- Tasks: alte schliessen
const { data: alt } = await sb.from('tasks').select('id,title,description').neq('status', 'done').lt('due_date', TODAY)
let closed = 0
for (const t of alt ?? []) {
  const { error } = await sb.from('tasks').update({ status: 'done', completed_at: new Date().toISOString(), description: `${t.description ? t.description + '\n\n' : ''}Automatisch geschlossen 01.11.2026: Event-Plan vom April 2026 durch das Winterkonzept überholt.`, updated_at: new Date().toISOString() }).eq('id', t.id)
  die('close task', error); closed++
}
const { data: obsolet } = await sb.from('tasks').select('id,title,description').neq('status', 'done').or('title.ilike.%5-Gang%,title.ilike.%7-Gang%,title.ilike.%DJ / Live-Musik%')
for (const t of obsolet ?? []) {
  await sb.from('tasks').update({ status: 'done', completed_at: new Date().toISOString(), description: `${t.description ? t.description + '\n\n' : ''}Geschlossen 01.11.2026: Menüs sind entschieden (Weihnachten 3 Gänge 45, Silvester 5 Gänge 95 mit Musik).`, updated_at: new Date().toISOString() }).eq('id', t.id); closed++
}
log('Tasks geschlossen:', closed)

// ---------- Tasks: neu (Eventplanung V3 «Offen» + Entscheide 1.11. + Cockpit)
const task = (title, due, who, priority = 'medium', description = null) => ({ title, due_date: due, assigned_to: T[who] ?? null, priority, status: 'todo', description, created_by: T.Marcel })
const NEWTASKS = [
  task('Fensterreinigung ans Hotel-Kader melden', '2026-11-05', 'Marcel', 'medium', 'Entscheid 1.11.2026'),
  task('Stundenlöhner für Wochenenden ausschreiben', '2026-11-15', 'Thomas', 'high', 'Entscheid 1.11.2026, vor Eröffnung 17.12.'),
  task('Kinderkarte an Vanessa (Website)', '2026-11-15', 'Vanessa', 'medium', 'Ghackets & Hörnli 16, Hamburger 14, Nuggets 11.50, Pasta Pomodoro 12'),
  task('Website Mittag: «Vorspeise + Hauptgang: Lass dich von unserer À-la-carte überraschen»', '2026-11-20', 'Vanessa', 'medium', 'Text aus dem Gespräch 1.11.'),
  task('Protel-Buchungen Dez–Feb ins Cockpit eintragen (Logiernächte, HP-Personen)', '2026-11-15', 'Alexandra', 'high', 'dakota-marketing-hub.vercel.app/cockpit/forecast'),
  task('Protel-Umsatzbericht pro Monat Jan–Okt 2026 exportieren (Saisonfaktoren Cockpit)', '2026-11-30', 'Alexandra', 'medium', 'Gleicher Bericht wie am 01.11., Zeitraum jeweils ein Monat → Cockpit > Ziel 2027 > Referenz 2026'),
  task('Ski Day 09./10.01. und Bergbahn-Event 12./13.03. bestätigen', '2026-11-30', 'Alexandra', 'low', 'Eventplanung V3'),
  task('Weihnachtsbäume aufstellen', '2026-11-29', 'Thomas', 'low', 'Entscheid 1.11.2026'),
  task('Raclette-Öfeli beschaffen', '2026-12-01', 'Marcel', 'medium', 'Raclette jeden Tag ab 17.12.'),
  task('Weihnachtsmenü 25./26.12. (3 Gänge 45) festlegen und in GastroKalk', '2026-12-05', 'Marcel', 'high', null),
  task('Valentinstag: 3-Gang-Menü mit max. CHF 14.70 Ware/Gast festlegen', '2026-12-15', 'Marcel', 'medium', 'Eventplanung V3'),
  task('Rollen bestätigen (Küche Marcel, Werbung Alexandra, Website Vanessa)', '2026-12-15', 'Thomas', 'medium', 'Eventplanung V3'),
  task('Betriebsferien Restaurant und Hotel 2027 festlegen (Konflikt Grosi 16.04. / Brunch 25.04.)', '2026-12-31', 'Thomas', 'high', 'Entscheid 1.11.: Vorschlag 12.04.–05.05. und 01.–16.11.2027'),
  task('Ist-Zahlen 2026 nachtragen: BBQ, Silvester, Monatsbrunches', '2027-01-15', 'Marcel', 'low', 'Eventplanung V3'),
  task('Volkstheater 16.06.: Mittwoch öffnen? (Ruhetag)', '2027-03-31', 'Thomas', 'low', 'Eventplanung V3'),
  task('Silvester 2027: Musik nur, wenn das Hotel sie zahlt', '2027-09-30', 'Thomas', 'low', 'Eventplanung V3'),
]
let tins = 0
for (const t of NEWTASKS) {
  const { data } = await sb.from('tasks').select('id').eq('title', t.title).limit(1)
  if (data?.length) continue
  const { error } = await sb.from('tasks').insert(t); die('task ' + t.title, error); tins++
}
log('Tasks neu:', tins)

// ---------- Leads: überfällige Aktionsdaten löschen (Triage folgt)
const { data: ll, error: le } = await sb.from('leads').update({ next_action_date: null, updated_at: new Date().toISOString() }).lt('next_action_date', TODAY).not('status', 'in', '("gebucht","verloren")').select('id')
die('leads', le); log('Leads: überfällige Aktionsdaten entfernt:', ll?.length ?? 0)
log('Refresh fertig.')
