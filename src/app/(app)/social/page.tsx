import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Globe, Share2 as ShareIcon } from "lucide-react"
import Link from "next/link"

const DEMO_POSTS = [
  {
    title: "Afterwork Launch Teaser",
    platform: "instagram",
    type: "reel",
    status: "draft",
    date: "2026-04-20",
  },
  {
    title: "Spezialitätenabend Ankündigung",
    platform: "facebook",
    type: "post",
    status: "planned",
    date: "2026-04-14",
  },
  {
    title: "Friday Lounge Short #1",
    platform: "tiktok",
    type: "short",
    status: "draft",
    date: "2026-04-25",
    series: "Friday Lounge Serie (1/5)",
  },
  {
    title: "Oster-Brunch Fotos",
    platform: "instagram",
    type: "post",
    status: "published",
    date: "2026-04-07",
  },
]

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

export default function SocialPage() {
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

      {/* Content Calendar */}
      <div className="space-y-3">
        {DEMO_POSTS.map((post, i) => (
          <Card key={i} className="transition-shadow hover:shadow-md">
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
                <p className="font-medium truncate">{post.title}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{new Date(post.date).toLocaleDateString("de-CH")}</span>
                  <span className="capitalize">{post.type}</span>
                  {post.series && (
                    <Badge variant="outline" className="text-xs">
                      {post.series}
                    </Badge>
                  )}
                </div>
              </div>
              <Badge className={STATUS_COLORS[post.status]}>
                {STATUS_LABELS[post.status]}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
