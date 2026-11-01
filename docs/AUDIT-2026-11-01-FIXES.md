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

## Offen (nächste Runde, nach Priorität)
1. **Serien-Bearbeitung:** Änderung der Wiederholung löscht alle Kind-Events samt Aufgaben (CASCADE), ohne Warnung → Diff-Regeneration in einer Transaktion + Bestätigung (M).
2. **Bilder:** Galerie-Thumbnails laden Originale (oft > 1 MB) ohne `next/image` (Events, Social, Konzepte, Stories, Tischkarten) (S/M).
3. **Leads-Daten:** Tabelle wird doppelt geladen; «letzte Aktivität» nur aus den 500 neuesten Activities → bei alten Leads leer (M).
4. **Bewertungen:** Tabelle wird pro Seite dreimal komplett gelesen, Ø in JS → SQL-View/RPC + Pagination (M).
5. **KI-Aktionen** `createTischkarte` / `regenerateTischkarteText` ohne Rate-Limit (S).
6. Team-Mitglied löschen scheitert, wenn Aufgaben/Aktivitäten hängen (FK ohne ON DELETE) → Hinweis oder Umverteilung (S).
7. Kanban/Social-Board Lint-Fehler (Refs im Render, setState im Effect), Vorbestand (S).
8. Kalender-Filter nach Typ/Konzept; Lead-Aktivität «wer» bei manuellen Einträgen; Mobile-Header umbrechen (S).
