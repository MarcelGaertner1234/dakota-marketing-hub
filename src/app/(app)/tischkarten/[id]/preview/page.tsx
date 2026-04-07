import { getTischkarte } from "@/lib/actions/tischkarten"
import { notFound } from "next/navigation"
import { TischkarteA5Card } from "@/components/tischkarten/tischkarte-a5-card"
import { PrintButton } from "@/app/(app)/stories/[id]/preview/print-button"
import type { Tischkarte } from "@/types/database"

export const dynamic = "force-dynamic"

export default async function TischkartePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const tischkarte = (await getTischkarte(id).catch(
    () => null
  )) as Tischkarte | null
  if (!tischkarte) notFound()

  // PrintButton expects a "storyTitle" prop — we pass the guest name + title
  // so the resulting PDF filename reflects who the card is for.
  const printTitle = `${tischkarte.guest_name} ${tischkarte.title}`.slice(
    0,
    80
  )

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
        @page {
          size: A5;
          margin: 0;
        }

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

          .print-hide {
            display: none !important;
          }

          .story-a5-blatt {
            box-shadow: none !important;
            page-break-after: always;
            page-break-inside: avoid;
            margin: 0 !important;
            transform: none !important;
          }

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
          <div
            className="print-hide"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <PrintButton storyTitle={printTitle} />
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
              Auf A5 drucken und auf den Tisch stellen.
            </div>
          </div>

          <TischkarteA5Card tischkarte={tischkarte} />
        </div>
      </div>
    </div>
  )
}
