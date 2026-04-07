import { getStory } from "@/lib/actions/stories"
import { notFound } from "next/navigation"
import { StoryA5Card } from "@/components/stories/story-a5-card"
import { PrintButton } from "./print-button"
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
        /* Page-Setup für A5 Print */
        @page {
          size: A5;
          margin: 0;
        }

        /* Force background colors and images to print on every browser */
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        @media print {
          html, body {
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Hide all UI elements when printing */
          .print-hide {
            display: none !important;
          }

          /* The A5 card itself should fill the print page */
          .story-a5-blatt {
            box-shadow: none !important;
            page-break-after: always;
            page-break-inside: avoid;
            margin: 0 !important;
            transform: none !important;
          }

          /* Override the gray padding container */
          .preview-wrapper {
            background: #ffffff !important;
            padding: 0 !important;
            min-height: 0 !important;
            display: block !important;
          }

          .preview-inner {
            gap: 0 !important;
          }
        }
      `}</style>

      <div
        className="preview-wrapper"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          width: "100%",
        }}
      >
        <div
          className="preview-inner"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            alignItems: "center",
          }}
        >
          {/* Print-Button + Hint (only visible on screen) */}
          <div
            className="print-hide"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <PrintButton storyTitle={story.title} />
            <div
              style={{
                fontFamily: "var(--font-assistant), system-ui, sans-serif",
                fontSize: "12px",
                color: "#7C6951",
                textAlign: "center",
                maxWidth: "320px",
              }}
            >
              Echtes A5-PDF wird direkt heruntergeladen — kein Druck-Dialog.
              Dauer ca. 5-15 Sekunden.
            </div>
          </div>

          <StoryA5Card story={story} />
        </div>
      </div>
    </div>
  )
}
