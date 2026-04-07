/* eslint-disable @next/next/no-img-element */

import type { Story } from "@/types/database"

/**
 * StoryA5Card — Rendert eine Story im A5-Chesa-Rosatsch-Stil.
 * Wird identisch in Preview (Print), Public Page und Detail-Vorschau genutzt.
 *
 * WICHTIG: Diese Komponente erwartet, dass die Eltern-Seite die Font-Variable
 * --font-cormorant über next/font/google gesetzt hat.
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
  /** Optional: skaliert das A5-Blatt (1 = volle Größe, 0.5 = halb) */
  scale?: number
}) {
  return (
    <article
      className="story-a5-blatt"
      style={{
        width: "148mm",
        height: "210mm",
        background: "#fdfcf9",
        padding: "14mm 16mm 12mm",
        display: "flex",
        flexDirection: "column",
        color: "#1a1a1a",
        fontFamily: "var(--font-cormorant), 'EB Garamond', Georgia, serif",
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: "top left",
        boxShadow:
          "0 30px 80px rgba(0, 0, 0, 0.18), 0 10px 30px rgba(0, 0, 0, 0.08)",
      }}
    >
      {/* HEADER */}
      <header style={{ textAlign: "center", paddingBottom: "4mm" }}>
        <div
          style={{
            fontSize: "30pt",
            fontWeight: 400,
            letterSpacing: "0.08em",
            lineHeight: 1,
          }}
        >
          DAKOTA
        </div>
        <div
          style={{
            fontSize: "7pt",
            letterSpacing: "0.38em",
            marginTop: "2.5mm",
            color: "#4a4a4a",
            textTransform: "uppercase",
          }}
        >
          Air Lounge · Meiringen
        </div>
      </header>

      <hr
        style={{
          border: "none",
          borderTop: "0.5pt solid #1a1a1a",
          margin: "4mm 0",
        }}
      />

      {/* CREST */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "4mm",
        }}
      >
        <svg
          viewBox="0 0 120 60"
          style={{ width: "16mm", height: "auto", opacity: 0.88 }}
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Dakota Signet"
        >
          <g
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 34 Q 28 16, 50 30 Q 60 24, 70 30 Q 92 16, 112 34" />
            <path d="M18 40 Q 34 28, 50 36 Q 60 32, 70 36 Q 86 28, 102 40" />
            <circle cx="60" cy="30" r="2.2" fill="#1a1a1a" stroke="none" />
            <line x1="60" y1="34" x2="60" y2="46" />
          </g>
        </svg>
      </div>

      {/* ILLUSTRATION */}
      <div
        style={{
          width: "95mm",
          height: "62mm",
          margin: "0 auto 5mm",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: story.illustration_url
            ? "none"
            : "0.5pt dashed #b5b0a4",
          background: "#fbfaf6",
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
              color: "#8a8474",
              fontStyle: "italic",
              fontSize: "9pt",
              letterSpacing: "0.05em",
              padding: "0 10mm",
              lineHeight: 1.5,
            }}
          >
            [ Handgezeichnete Illustration<br />hier einfügen ]
          </div>
        )}
      </div>

      {/* TITEL */}
      <h1
        style={{
          textAlign: "center",
          fontSize: "15pt",
          fontWeight: 500,
          lineHeight: 1.28,
          margin: 0,
          marginBottom: "4mm",
          padding: "0 3mm",
          fontStyle: "italic",
        }}
      >
        {story.title}
        {story.subtitle ? ` — ${story.subtitle}` : ""}
      </h1>

      {/* BODY */}
      <div
        style={{
          flex: 1,
          fontSize: "10pt",
          lineHeight: 1.55,
          textAlign: "center",
          padding: "0 2mm",
          color: "#222",
        }}
      >
        <p style={{ margin: 0, marginBottom: "3mm" }}>{story.paragraph_1}</p>
        {story.paragraph_2 && (
          <p style={{ margin: 0, marginBottom: "3mm" }}>
            {story.paragraph_2}
          </p>
        )}
        {story.paragraph_3 && (
          <p style={{ margin: 0 }}>{story.paragraph_3}</p>
        )}
      </div>

      {/* FOOTER */}
      <footer
        style={{
          textAlign: "center",
          paddingTop: "3mm",
          marginTop: "3mm",
          borderTop: "0.5pt solid #1a1a1a",
        }}
      >
        <div
          style={{
            fontSize: "9pt",
            fontStyle: "italic",
            color: "#333",
            marginBottom: "0.5mm",
          }}
        >
          Ihre
        </div>
        <div
          style={{
            fontSize: "9pt",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
          }}
        >
          {story.footer_signature.replace(/^Ihre\s+/i, "")}
        </div>
      </footer>
    </article>
  )
}
