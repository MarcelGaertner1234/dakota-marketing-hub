import { getStory } from "@/lib/actions/stories"
import { notFound } from "next/navigation"
import { StoryDetail } from "./story-detail"
import type { Story } from "@/types/database"

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const story = (await getStory(id).catch(() => null)) as Story | null
  if (!story) notFound()

  return <StoryDetail story={story} />
}
