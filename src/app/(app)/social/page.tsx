import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Globe } from "lucide-react"
import Link from "next/link"
import { getSocialPosts } from "@/lib/actions/social"

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  planned: "bg-blue-100 text-blue-700",
  ready: "bg-green-100 text-green-700",
  published: "bg-purple-100 text-purple-700",
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Entwurf",
  planned: "Geplant",
  ready: "Bereit",
  published: "Veröffentlicht",
}

export default async function SocialPage() {
  const posts = await getSocialPosts()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2C2C2C]">Social Media</h1>
          <p className="text-gray-500">Content planen und organisieren</p>
        </div>
        <Link href="/social/neu">
          <Button className="bg-[#C5A572] hover:bg-[#A08050]">
            <Plus className="mr-2 h-4 w-4" />
            Neuer Post
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {posts && posts.length > 0 ? (
          posts.map((post) => (
            <Card key={post.id} className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  {post.platform === "instagram" && (
                    <span className="text-sm font-bold text-pink-500">IG</span>
                  )}
                  {post.platform === "facebook" && (
                    <Globe className="h-5 w-5 text-blue-600" />
                  )}
                  {post.platform === "tiktok" && (
                    <span className="text-sm font-bold">TT</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{post.title || "Ohne Titel"}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {post.scheduled_at && (
                      <span>{new Date(post.scheduled_at).toLocaleDateString("de-CH")}</span>
                    )}
                    <span className="capitalize">{post.post_type}</span>
                    {post.event && (
                      <Badge variant="outline" className="text-xs">
                        {post.event.title}
                      </Badge>
                    )}
                    {post.series_order && (
                      <Badge variant="outline" className="text-xs">
                        Teil {post.series_order}
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge className={STATUS_COLORS[post.status] || ""}>
                  {STATUS_LABELS[post.status] || post.status}
                </Badge>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-400">
                Noch keine Posts geplant.{" "}
                <Link href="/social/neu" className="text-[#C5A572] hover:underline">
                  Ersten Post erstellen
                </Link>
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
