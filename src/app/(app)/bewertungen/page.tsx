export const dynamic = "force-dynamic"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, QrCode, Gift } from "lucide-react"
import Link from "next/link"
import { getReviewStats, getReviews, getGoodyReviews } from "@/lib/actions/reviews"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { GoodyTracker } from "./goody-tracker"

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          }`}
        />
      ))}
    </div>
  )
}

export default async function BewertungenPage() {
  const [stats, reviews, goodyReviews] = await Promise.all([
    getReviewStats(),
    getReviews(),
    getGoodyReviews(),
  ])

  const openGoodyCodes = goodyReviews.filter((r) => !r.goody_claimed).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2C2C2C] dark:text-gray-100">Bewertungen</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gaeste-Feedback auswerten — {stats.total} Bewertungen total
          </p>
        </div>
        <Link href="/bewertungen/qr">
          <Button className="bg-[#C5A572] hover:bg-[#A08050]">
            <QrCode className="mr-2 h-4 w-4" />
            QR-Code generieren
          </Button>
        </Link>
      </div>

      <Tabs defaultValue={0}>
        <TabsList>
          <TabsTrigger value={0}>Bewertungen</TabsTrigger>
          <TabsTrigger value={1} className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Goody-Codes
            {openGoodyCodes > 0 && (
              <Badge className="bg-amber-500 text-white ml-1">
                {openGoodyCodes}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={0}>
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500 dark:text-gray-400">Food</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{stats.food || "—"}</span>
                  <StarDisplay rating={stats.food} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500 dark:text-gray-400">Ambiente</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{stats.ambience || "—"}</span>
                  <StarDisplay rating={stats.ambience} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500 dark:text-gray-400">Service</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{stats.service || "—"}</span>
                  <StarDisplay rating={stats.service} />
                </CardContent>
              </Card>
            </div>

            {/* Recent Reviews */}
            <Card>
              <CardHeader>
                <CardTitle>Letzte Bewertungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reviews && reviews.length > 0 ? (
                  reviews.slice(0, 20).map((review) => (
                    <div key={review.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-4 text-sm">
                            <span>Food: <strong>{review.food_rating}/5</strong></span>
                            <span>Ambiente: <strong>{review.ambience_rating}/5</strong></span>
                            <span>Service: <strong>{review.service_rating}/5</strong></span>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 italic">&quot;{review.comment}&quot;</p>
                          )}
                          {review.guest_name && (
                            <p className="text-xs text-gray-400 dark:text-gray-500">— {review.guest_name}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                          {new Date(review.created_at).toLocaleDateString("de-CH")}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                    Noch keine Bewertungen. Verteile QR-Codes auf den Tischen!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value={1}>
          <GoodyTracker reviews={goodyReviews} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
