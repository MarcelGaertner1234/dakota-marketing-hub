# Audit + Fixes 01.11.2026 (Funktionen, Performance, Technik)

Grundlage: zwei Audit-Durchgänge (Funktionen/UX, Technik/Performance) über die ganze App, Live-Messung der Vercel-Seiten (TTFB < 0.5 s, aber /kalender 462 KB HTML).

## Umgesetzt
- **Aufgaben-Seite `/aufgaben`** (neu): alle offenen Aufgaben, Filter Person / Woche / überfällig, anlegen ohne Event, bearbeiten (Titel, Datum, Priorität, Person, Event), löschen, erledigte einklappbar. Sidebar-Eintrag. Dashboard verlinkt eventlose Aufgaben dorthin, überfällige rot.
- **Kalender:** mehrtägige Events auf jedem Tag (Tagespunkte nur bis 7 Tage, lange Einträge in Monatsliste + Tagesdialog), Jahresgrenze (Weihnachtsferien 2026→2027), Typ «Feiertag / Ferien / Schliessung» in Formularen (vorher ging der Typ beim Speichern verloren), Enddatum beim Anlegen, Datumsbereich im Detail, Vorlauf-Banner nur für eigene/Konzept-Events, `?year=abc` abgefangen. Kalender lädt nur noch die benötigten Spalten.
- **Dashboard:** «heute» in Europe/Zurich (vorher UTC), echte 30 Tage, laufende Events zählen mit, Ferien raus aus «Nächste Events», neue **Cockpit-Kachel** (Monat, Ampeln, Rapport-Status, Anlässe 14 Tage).
- **Leads:** Filter «Ohne nächste Aktion», Sortierung nach nächster Aktion, Status-Sortierung in Pipeline-Reihenfolge, Kanban übernimmt Daten nach Refresh.
- **Konzepte:** Slugs mit Umlauten (menue statt men) + Kollisionsschutz, inaktive Konzepte sichtbar und (de)aktivierbar, Event-Bearbeiten verliert kein inaktives Konzept mehr.
- **Cockpit:** heute in Zürich, Fehler aus Aktionen werden angezeigt.
- **Technik:** `/social/neu` war zur Build-Zeit eingefroren (neue Events fehlten) → dynamisch; Supabase-Server-Client als Singleton (persistSession aus, Warnung bei fehlendem Service-Key); Upload-Limit 4 MB (Vercel-Grenze 4.5 MB); erlaubte Hosts inkl. Port 3003 und Vercel-Preview-URLs; `updateSocialPost` nur Whitelist-Felder; `qrcode` erst bei Bedarf geladen; Sidebar hydration-sicher + aria; Error-Boundary loggt; tote Abhängigkeiten entfernt (`@dnd-kit/sortable`, `@dnd-kit/utilities`, `date-fns`, `react-day-picker`, `@ai-sdk/openai`), ungenutzte `supabase/client.ts` und `ui/calendar.tsx` gelöscht.

## Runde 2 (gleicher Abend) – alle offenen Punkte umgesetzt
1. **Serien-Bearbeitung:** `updateEvent` führt Serien per Diff nach: bleibende Folge-Termine behalten ihre Aufgaben und bekommen Titel/Zeit/Ort/Konzept nachgezogen (auch ohne Serien-Änderung), nur weggefallene Termine werden gelöscht, neue eingefügt. Fallen Termine mit Aufgaben weg, fragt die Detailseite nach («Serie ändern? N Termine, M Aufgaben»). Validierung wie beim Anlegen, Fehler erscheinen im Formular.
2. **Bilder:** Galerie-Thumbnails (Events, Social, Konzepte, Stories, Tischkarten) über `next/image` mit `fill` + `sizes`, lazy. Lightbox bleibt Original.
3. **Leads:** eine Abfrage statt zwei (Kanban-Liste wird abgeleitet), letzte Aktivität pro Lead eingebettet (vorher nur aus den 500 neuesten Activities), explizite Spalten.
4. **Bewertungen:** eine Abfrage für Liste, Stats und Goody-Liste (Limit 300 + Gesamtzahl per Count); Dashboard-Stats nur Rating-Spalten und pro Request gecached.
5. **KI-Aktionen:** `createTischkarte` und `regenerateTischkarteText` mit Rate-Limit (10/Min/IP) über `rateLimitAction`.
6. **Team löschen:** blockiert mit Hinweis, wenn offene Aufgaben zugewiesen sind; sonst werden Verweise (Aufgaben, Events, Leads, Aktivitäten, Durchläufe, Social) gelöst und dann gelöscht.
7. **Lint:** 0 Fehler (Refs in Effekten, `mounted` via `useSyncExternalStore`).
8. **Kalender-Filter** nach Typ (Legende klickbar); **Lead-Aktivität** und **Statuswechsel** mit «wer»; Kopfzeilen Kalender/Leads/Event-Detail umbrechen auf dem Handy.

## Noch offen (fachlich, nicht technisch)
- Schulferien 2027 Meiringen bestätigen (Kalender-Einträge «zu prüfen»).
- Lead-Triage: 49 Kontakte ohne Termin für die nächste Aktion (Filter in der Datenbank).
- Social-Media-Planung: 22 Posts aus dem Juni, kein künftiger Termin.
- Betriebsferien 2027 (GL-Entscheid bis 31.12.2026).
