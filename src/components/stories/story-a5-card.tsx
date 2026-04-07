/* eslint-disable @next/next/no-img-element */

import type { Story } from "@/types/database"

/**
 * StoryA5Card — A5-Format Story-Blatt im Dakota Air Lounge Corporate Design.
 *
 * Design-Elemente übernommen aus QR-Tischkarte (BewertungenKarte):
 *   - Echtes air-lounge-logo.png im weissen Container
 *   - Flugzeug-Wasserzeichen (flugzeug-bg.png) als Background-Layer
 *   - Gold-Akzente (#C5A572) als Divider
 *   - Calistoga für Titel, Assistant für Body (via Root-Layout CSS-Variablen)
 *   - Adress-Footer wie auf der QR-Karte
 *
 * Wird verwendet in:
 *   - /stories/[id]/preview  (print-optimierte Ansicht)
 *   - /story/[id]            (public QR-Landing)
 */
export function StoryA5Card({
  story,
  scale = 1,
}: {
  story: Pick<
    Story,
    | "title"
    | "subtitle"
    | "paragraph_1"
    | "paragraph_2"
    | "paragraph_3"
    | "illustration_url"
    | "footer_signature"
  >
  /** Skaliert das A5-Blatt für Thumbnails (1 = volle A5-Grösse) */
  scale?: number
}) {
  const crewLabel = story.footer_signature.replace(/^Ihre\s+/i, "")

  return (
    <article
      className="story-a5-blatt"
      style={{
        width: "148mm",
        height: "210mm",
        position: "relative",
        overflow: "hidden",
        background: "#F8F6F3",
        color: "#2C2C2C",
        fontFamily:
          "var(--font-assistant), system-ui, -apple-system, sans-serif",
        boxShadow:
          "0 30px 80px rgba(0, 0, 0, 0.18), 0 10px 30px rgba(0, 0, 0, 0.08)",
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: "top left",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* Flugzeug-Wasserzeichen — absoluter Background-Layer */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url('/branding/flugzeug-bg.png')",
          backgroundSize: "180%",
          backgroundPosition: "55% 85%",
          backgroundRepeat: "no-repeat",
          opacity: 0.22,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Content-Layer über dem Wasserzeichen */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          height: "100%",
          padding: "10mm 12mm 9mm",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* HEADER — air-lounge-logo im weissen Container (kompakt) */}
        <header
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: "4mm",
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              padding: "3mm 7mm 2.5mm",
              borderRadius: "3mm",
              border: "0.5pt solid #E7DED1",
              boxShadow: "0 2pt 6pt rgba(0, 0, 0, 0.04)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src="/branding/air-lounge-logo.png"
              alt="Dakota Air Lounge"
              style={{
                width: "34mm",
                height: "auto",
                display: "block",
                objectFit: "contain",
              }}
            />
          </div>

          {/* Gold-Divider unter dem Logo */}
          <div
            style={{
              width: "16mm",
              height: "0.7mm",
              background: "#C5A572",
              marginTop: "3mm",
              borderRadius: "0.5mm",
            }}
          />
        </header>

        {/* ILLUSTRATION — gross, full-bleed Landscape (1.5:1 match) */}
        <div
          style={{
            width: "112mm",
            height: "75mm",
            margin: "0 auto 4mm",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: story.illustration_url
              ? "none"
              : "0.5pt dashed #C5A572",
            background: story.illustration_url
              ? "rgba(255, 255, 255, 0.4)"
              : "rgba(255, 255, 255, 0.55)",
            borderRadius: "2mm",
            overflow: "hidden",
          }}
        >
          {story.illustration_url ? (
            <img
              src={story.illustration_url}
              alt=""
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
          ) : (
            <div
              style={{
                textAlign: "center",
                color: "#9A8D7A",
                fontStyle: "italic",
                fontSize: "8.5pt",
                letterSpacing: "0.04em",
                padding: "0 10mm",
                lineHeight: 1.5,
              }}
            >
              [ Handgezeichnete Illustration<br />hier einfügen ]
            </div>
          )}
        </div>

        {/* TITEL — Calistoga (display-serif) */}
        <h1
          style={{
            textAlign: "center",
            fontSize: "17pt",
            fontWeight: 400,
            lineHeight: 1.2,
            fontFamily: "var(--font-calistoga), Georgia, serif",
            color: "#2C2C2C",
            margin: 0,
            marginBottom: "2mm",
            padding: "0 2mm",
          }}
        >
          {story.title}
        </h1>

        {/* UNTERTITEL — Assistant italic, gedämpft */}
        {story.subtitle && (
          <p
            style={{
              textAlign: "center",
              fontSize: "9.5pt",
              fontStyle: "italic",
              color: "#7C6951",
              margin: 0,
              marginBottom: "4mm",
              padding: "0 6mm",
              lineHeight: 1.3,
              fontWeight: 400,
            }}
          >
            {story.subtitle}
          </p>
        )}

        {/* BODY — Assistant, 3 Absätze */}
        <div
          style={{
            flex: 1,
            fontSize: "10pt",
            lineHeight: 1.58,
            textAlign: "center",
            color: "#3A3530",
            padding: "0 2mm",
            fontWeight: 300,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "3mm",
          }}
        >
          <p style={{ margin: 0 }}>{story.paragraph_1}</p>
          {story.paragraph_2 && (
            <p style={{ margin: 0 }}>{story.paragraph_2}</p>
          )}
          {story.paragraph_3 && (
            <p
              style={{
                margin: 0,
                fontStyle: "italic",
                color: "#2C2C2C",
              }}
            >
              {story.paragraph_3}
            </p>
          )}
        </div>

        {/* GOLD-DIVIDER vor dem Footer */}
        <div
          style={{
            width: "28mm",
            height: "0.8mm",
            background: "#C5A572",
            margin: "5mm auto 3mm",
            borderRadius: "0.5mm",
          }}
        />

        {/* FOOTER — Crew + Adresse */}
        <footer style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "9pt",
              fontStyle: "italic",
              color: "#7C6951",
              marginBottom: "0.5mm",
              fontFamily: "var(--font-calistoga), Georgia, serif",
            }}
          >
            Ihre
          </div>
          <div
            style={{
              fontSize: "11pt",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "#2C2C2C",
              fontWeight: 500,
              marginBottom: "3mm",
              fontFamily: "var(--font-calistoga), Georgia, serif",
            }}
          >
            {crewLabel}
          </div>
          <div
            style={{
              fontSize: "7pt",
              color: "#7C6951",
              letterSpacing: "0.06em",
              fontWeight: 400,
            }}
          >
            Restaurant Dakota-Airlounge &middot; Amthausgasse 2 &middot; 3860
            Meiringen
          </div>
        </footer>
      </div>
    </article>
  )
}
