import { getStory } from "@/lib/actions/stories"
import { notFound } from "next/navigation"
import { StoryA5Card } from "@/components/stories/story-a5-card"
import type { Story } from "@/types/database"

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
          html, body {
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .story-a5-blatt {
            box-shadow: none !important;
            page-break-after: always;
          }
          .print-hide { display: none !important; }
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div
          className="print-hide"
          style={{
            fontFamily: "var(--font-assistant), system-ui, sans-serif",
            fontSize: "13px",
            color: "#5E5346",
            textAlign: "center",
            background: "#fff",
            padding: "8px 16px",
            borderRadius: "8px",
            border: "1px solid #E7DED1",
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
  background: "#F8F6F3",
  border: "1px solid #D9CFBF",
  borderRadius: "3px",
  padding: "1px 6px",
  fontSize: "11px",
  fontFamily: "var(--font-geist-mono), monospace",
  color: "#2C2C2C",
}
