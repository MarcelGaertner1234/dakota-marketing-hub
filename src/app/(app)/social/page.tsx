export const dynamic = "force-dynamic"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { getSocialPosts } from "@/lib/actions/social"
import { SocialBoard } from "@/components/social/social-board"

export default async function SocialPage() {
  const posts = await getSocialPosts()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2C2C2C] dark:text-gray-100">Social Media</h1>
          <p className="text-gray-500 dark:text-gray-400">Content planen und organisieren</p>
        </div>
        <Link href="/social/neu">
          <Button className="bg-[#C5A572] hover:bg-[#A08050]">
            <Plus className="mr-2 h-4 w-4" />
            Neuer Post
          </Button>
        </Link>
      </div>

      <SocialBoard posts={posts || []} />
    </div>
  )
}
