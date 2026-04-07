import { getStory } from "@/lib/actions/stories"
import { notFound } from "next/navigation"
import { Cormorant_Garamond } from "next/font/google"
import { StoryA5Card } from "@/components/stories/story-a5-card"
import Link from "next/link"
import type { Story } from "@/types/database"

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
})

export const dynamic = "force-dynamic"

export default async function PublicStoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const story = (await getStory(id).catch(() => null)) as Story | null
  if (!story || story.status !== "published") notFound()

  return (
    <div
      className={cormorant.variable}
      style={{
        minHeight: "100vh",
        background: "#e8e5df",
        padding: "30px 16px 60px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "24px",
      }}
    >
      <StoryA5Card story={story} />

      {/* CTA zur Bewertung (nur wenn via QR gescannt) */}
      <div
        style={{
          maxWidth: "148mm",
          width: "100%",
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <p
          style={{
            fontSize: "14px",
            color: "#5E5346",
            marginBottom: "12px",
          }}
        >
          Hat dir unsere Geschichte gefallen?
        </p>
        <Link href="/">
          <button
            style={{
              background: "#C5A572",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "12px 24px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Mehr über das Dakota erfahren
          </button>
        </Link>
      </div>
    </div>
  )
}
