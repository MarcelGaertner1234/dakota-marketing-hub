import { getStory } from "@/lib/actions/stories"
import { notFound } from "next/navigation"
import { Cormorant_Garamond } from "next/font/google"
import { StoryA5Card } from "@/components/stories/story-a5-card"
import type { Story } from "@/types/database"

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
})

export const dynamic = "force-dynamic"

export default async function StoryPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const story = (await getStory(id).catch(() => null)) as Story | null
  if (!story) notFound()

  return (
    <div
      className={cormorant.variable}
      style={{
        minHeight: "100vh",
        background: "#e8e5df",
        padding: "30px 20px",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <style>{`
        @page { size: A5; margin: 0; }
        @media print {
          html, body { background: #ffffff !important; padding: 0 !important; margin: 0 !important; }
          .story-a5-blatt { box-shadow: none !important; page-break-after: always; }
          .print-hide { display: none !important; }
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div
          className="print-hide"
          style={{
            fontFamily:
              "system-ui, -apple-system, sans-serif",
            fontSize: "13px",
            color: "#666",
            textAlign: "center",
          }}
        >
          Drücke <kbd style={kbdStyle}>Cmd</kbd> + <kbd style={kbdStyle}>P</kbd>{" "}
          — Format A5, Ränder: Keine, Hintergrundgrafiken aktiviert
        </div>

        <StoryA5Card story={story} />
      </div>
    </div>
  )
}

const kbdStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #ccc",
  borderRadius: "3px",
  padding: "1px 5px",
  fontSize: "11px",
  fontFamily: "monospace",
}
