import { getStory } from "@/lib/actions/stories"
import { notFound } from "next/navigation"
import { StoryA5Card } from "@/components/stories/story-a5-card"
import type { Story } from "@/types/database"

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
      style={{
        minHeight: "100vh",
        background: "#e8e5df",
        padding: "30px 16px 60px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "24px",
        fontFamily: "var(--font-assistant), system-ui, sans-serif",
      }}
    >
      <StoryA5Card story={story} />

      {/* CTA */}
      <div
        style={{
          maxWidth: "148mm",
          width: "100%",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: "14px",
            color: "#5E5346",
            marginBottom: "8px",
          }}
        >
          Hat dir unsere Geschichte gefallen?
        </p>
        <p
          style={{
            fontSize: "13px",
            color: "#9A8050",
            fontWeight: 500,
            letterSpacing: "0.02em",
          }}
        >
          Dakota Air Lounge — Basel
        </p>
      </div>
    </div>
  )
}
