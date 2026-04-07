export const dynamic = "force-dynamic"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, BookOpen, Eye } from "lucide-react"
import Link from "next/link"
import { getStories } from "@/lib/actions/stories"
import type { Story, StoryCategory } from "@/types/database"

const CATEGORY_LABELS: Record<StoryCategory, string> = {
  dish: "Gericht",
  drink: "Drink",
  house: "Haus",
  crew: "Crew",
  location: "Ort",
}

const CATEGORY_COLORS: Record<StoryCategory, string> = {
  dish: "#10B981",
  drink: "#8B5CF6",
  house: "#C5A572",
  crew: "#EF4444",
  location: "#3B82F6",
}

export default async function StoriesPage() {
  const stories = (await getStories()) as Story[] | null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2C2C2C] dark:text-gray-100">
            Storytelling-Blätter
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Chesa-Rosatsch-Prinzip: Emotionale A5-Geschichten für Gäste
          </p>
        </div>
        <Link href="/stories/neu">
          <Button className="bg-[#C5A572] hover:bg-[#A08050]">
            <Plus className="mr-2 h-4 w-4" />
            Neue Story
          </Button>
        </Link>
      </div>

      {!stories || stories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400">
              Noch keine Stories. Erstelle die erste.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <Link key={story.id} href={`/stories/${story.id}`}>
              <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg cursor-pointer">
                <div
                  className="h-2"
                  style={{ backgroundColor: CATEGORY_COLORS[story.category] }}
                />
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Badge
                      variant="secondary"
                      className="text-[10px]"
                      style={{
                        backgroundColor: `${CATEGORY_COLORS[story.category]}15`,
                        color: CATEGORY_COLORS[story.category],
                      }}
                    >
                      {CATEGORY_LABELS[story.category]}
                    </Badge>
                    <Badge
                      variant={
                        story.status === "published" ? "default" : "outline"
                      }
                      className={
                        story.status === "published"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-[10px]"
                          : "text-[10px]"
                      }
                    >
                      {story.status === "published" ? "Published" : "Draft"}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-serif text-lg font-semibold leading-tight text-[#2C2C2C] dark:text-gray-100">
                      {story.title}
                    </h3>
                    {story.subtitle && (
                      <p className="mt-0.5 text-xs italic text-gray-500 dark:text-gray-400">
                        {story.subtitle}
                      </p>
                    )}
                  </div>

                  <p className="line-clamp-3 text-xs text-gray-600 dark:text-gray-400">
                    {story.paragraph_1}
                  </p>

                  <div className="flex items-center gap-2 pt-1 text-[10px] text-gray-400">
                    <Eye className="h-3 w-3" />
                    {story.illustration_url
                      ? "Mit Illustration"
                      : "Ohne Illustration"}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
