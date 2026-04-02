import { getSocialPost } from "@/lib/actions/social"
import { notFound } from "next/navigation"
import { PostDetail } from "./post-detail"

export default async function SocialPostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>
}) {
  const { postId } = await params
  const post = await getSocialPost(postId).catch(() => null)
  if (!post) notFound()

  return <PostDetail post={post} />
}
