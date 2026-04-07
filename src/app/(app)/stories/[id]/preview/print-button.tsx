"use client"

import { Download, Loader2 } from "lucide-react"
import { useState } from "react"

interface PrintButtonProps {
  storyTitle: string
}

/**
 * Client-side PDF Export Button.
 *
 * Uses html2canvas to capture the .story-a5-blatt element and jsPDF
 * to wrap it in an A5 PDF. Both libraries are dynamically imported on
 * first click so they don't bloat the initial JS bundle (~250KB combined).
 *
 * Why not window.print()? Browser print dialogs save HTML or have
 * inconsistent layout handling across Chrome/Safari/Firefox. This gives
 * us a single deterministic flow: click → spinner → download.
 */
export function PrintButton({ storyTitle }: PrintButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  async function handleExport() {
    setIsExporting(true)
    try {
      // 1. Wait for web fonts (Calistoga, Assistant) to be fully loaded
      //    so the rendered card uses the correct typography.
      if (typeof document !== "undefined" && document.fonts?.ready) {
        await document.fonts.ready
      }

      // 2. Find the A5 card element on the page.
      const card = document.querySelector(
        ".story-a5-blatt"
      ) as HTMLElement | null
      if (!card) {
        throw new Error(
          "Story-Card nicht gefunden — Page nicht vollständig geladen?"
        )
      }

      // 3. Wait for ALL <img> elements inside the card to be fully loaded
      //    (Logo, optional KI illustration). Otherwise html2canvas captures
      //    a half-loaded state.
      const images = Array.from(card.querySelectorAll("img"))
      await Promise.all(
        images.map((img) =>
          img.complete && img.naturalWidth > 0
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                img.onload = () => resolve()
                img.onerror = () => resolve()
                // Timeout fallback after 10s
                setTimeout(() => resolve(), 10000)
              })
        )
      )

      // 4. Dynamic import — load html2canvas and jsPDF only on first click.
      //    This keeps the initial bundle small.
      const [html2canvasMod, jspdfMod] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ])
      const html2canvas = html2canvasMod.default
      const { jsPDF } = jspdfMod

      // 5. Render the A5 card to a canvas at 2× scale for print quality.
      //    useCORS allows the background-image (flugzeug-bg.png) and any
      //    Supabase Storage illustration to render correctly.
      const canvas = await html2canvas(card, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#F8F6F3", // matches the paper color
        logging: false,
        imageTimeout: 15000,
        // Capture the element's actual rendered size for accurate aspect.
        width: card.offsetWidth,
        height: card.offsetHeight,
        windowWidth: card.scrollWidth,
        windowHeight: card.scrollHeight,
      })

      // 6. Create A5 portrait PDF (148 × 210 mm).
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a5",
        compress: true,
      })

      // 7. Place the canvas as a single image filling the entire A5 page.
      const imgData = canvas.toDataURL("image/png", 1.0)
      pdf.addImage(imgData, "PNG", 0, 0, 148, 210, undefined, "FAST")

      // 8. Build a sane filename from the story title.
      const safeName = storyTitle
        .toLowerCase()
        .replace(/ä/g, "ae")
        .replace(/ö/g, "oe")
        .replace(/ü/g, "ue")
        .replace(/ß/g, "ss")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 50)
      const filename = `dakota-${safeName || "story"}.pdf`

      // 9. Trigger download.
      pdf.save(filename)
    } catch (e) {
      console.error("PDF export failed:", e)
      const message =
        e instanceof Error ? e.message : "Unbekannter Fehler"
      alert(
        `PDF-Export fehlgeschlagen:\n${message}\n\n` +
          `Fallback: Versuch es mit Cmd+P → "Als PDF speichern".`
      )
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        background: isExporting ? "#9A8867" : "#C5A572",
        color: "white",
        border: "none",
        borderRadius: "8px",
        padding: "10px 18px",
        fontSize: "14px",
        fontWeight: 500,
        cursor: isExporting ? "wait" : "pointer",
        fontFamily: "var(--font-assistant), system-ui, sans-serif",
        letterSpacing: "0.02em",
        boxShadow: "0 2px 8px rgba(197, 165, 114, 0.3)",
        transition: "background 0.15s ease",
      }}
    >
      {isExporting ? (
        <>
          <Loader2
            style={{
              width: 16,
              height: 16,
              animation: "spin 1s linear infinite",
            }}
          />
          PDF wird erstellt…
        </>
      ) : (
        <>
          <Download style={{ width: 16, height: 16 }} />
          Als PDF herunterladen
        </>
      )}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  )
}
