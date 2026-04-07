# Dakota Storytelling-Blätter — Vorlage

Inspiriert vom Chesa Rosatsch A5-Format. Emotionales Mikro-Storytelling für Gäste.

## Was ist drin

| Datei | Zweck |
|---|---|
| `vorlage-meringue.html` | Voll ausgefülltes Muster mit der Meringue-Story. **Zum Zeigen an der Kadersitzung.** |
| `vorlage-blank.html` | Leere Vorlage mit markierten Platzhaltern `{{TITEL}}`, `{{ABSATZ 1}}` etc. **Zum Erklären der Struktur.** |

## Öffnen

Doppelklick auf die HTML-Datei → öffnet im Browser. Schriftart lädt automatisch (Cormorant Garamond via Google Fonts, Internet nötig).

## Als PDF für die Kadersitzung

1. Öffne `vorlage-meringue.html` im Browser (Safari oder Chrome).
2. `Cmd + P`
3. **Papierformat: A5** auswählen.
4. **Ränder: Kein(e)**
5. Häkchen bei **"Hintergrundgrafiken"**.
6. "Als PDF speichern".

→ Druckfertiges A5-PDF.

## Struktur (Rosatsch-Prinzip)

```
┌──────────────────────────────┐
│          DAKOTA              │  ← Marken-Name, gross, Serifen
│   AIR LOUNGE · MEIRINGEN     │  ← Subzeile, klein, letter-spaced
│ ──────────────────────────── │
│                              │
│           ⌒⌒                 │  ← Wappen/Logo (Platzhalter)
│                              │
│   [  Handgezeichnete     ]   │  ← Illustration (Platzhalter)
│   [   Illustration       ]   │
│                              │
│   Die Meringue — Ein         │  ← Titel, kursiv, emotional
│   Stück Meiringen...         │
│                              │
│   Man erzählt sich, ein      │  ← Absatz 1: Herkunft/Mythos
│   italienischer Konditor...  │
│                              │
│   Wir servieren sie so...    │  ← Absatz 2: Zubereitung/Handwerk
│                              │
│   Ein Stück Dorfstolz.       │  ← Absatz 3: emotionaler Schluss
│   Ein Stück Meiringen.       │
│   Ein Stück von uns.         │
│ ──────────────────────────── │
│         Ihre                 │
│      DAKOTA CREW             │  ← Signatur (wie "Squadra Rosatsch")
└──────────────────────────────┘
```

## Was noch fehlt (TODO vor dem ersten echten Druck)

1. **Offizielles Dakota-Logo** — aktuell nur ein Platzhalter-SVG (stilisierte Flügel). Muss durchs echte Dakota-Wappen ersetzt werden.
2. **Erste Illustration** — handgezeichnete Skizze der Meringue. Optionen:
   - DIY: Vanessa oder Marcel zeichnet, scannt, als `meringue.png` einbinden.
   - Illustrator beauftragen (Fiverr, CHF 30–80 pro Zeichnung).
   - Konsistenter Stil über alle Blätter hinweg ist wichtig (wie Rosatsch).
3. **Weitere Stories** für die Kadersitzung-Diskussion:
   - Dakota — Warum wir nach einem Flugzeug heissen (Haus-Manifest)
   - Der Reichenbach — Signature-Drink mit Sherlock-Bezug
   - "Bii de Grossmuetter" — das Grossmütter-Gericht
   - Meet the Crew: Thomas / Vanessa / Antonella

## Wo die Blätter eingesetzt werden können

- **Auf dem Tisch** als Menü-Beilage (Gast liest beim Warten)
- **An der Wand** als Galerie (Instagram-Magnet)
- **QR-Code unten** → digitale Version + Bewertungs-Funnel
- **Social Media** (jedes Blatt = 1 Instagram-Post + Story-Serie)
- **Event-Give-Away** (Volkstheaterfestival, Musikfestwoche)

## Integration in den Marketing Hub (später)

Nach der Kadersitzung: Modul `/stories` im Dakota Marketing Hub bauen mit
Supabase-Tabelle `stories`, Server Actions, A5-PDF-Export via `@react-pdf/renderer`,
QR-Code-Integration mit bestehender `/api/qr` Route.
