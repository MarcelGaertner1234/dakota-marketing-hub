"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Check, Gift, Clock } from "lucide-react"
import { claimGoodyCode, unclaimGoodyCode } from "@/lib/actions/reviews"
import type { Review } from "@/types/database"

type FilterType = "alle" | "offen" | "eingeloest"

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${
            i < Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          }`}
        />
      ))}
    </div>
  )
}

export function GoodyTracker({ reviews }: { reviews: Review[] }) {
  const [filter, setFilter] = useState<FilterType>("alle")
  const [pending, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const openCount = reviews.filter((r) => !r.goody_claimed).length
  const claimedCount = reviews.filter((r) => r.goody_claimed).length

  const filtered = reviews.filter((r) => {
    if (filter === "offen") return !r.goody_claimed
    if (filter === "eingeloest") return r.goody_claimed
    return true
  })

  function handleToggle(review: Review) {
    setLoadingId(review.id)
    startTransition(async () => {
      if (review.goody_claimed) {
        await unclaimGoodyCode(review.id)
      } else {
        await claimGoodyCode(review.id)
      }
      setLoadingId(null)
    })
  }

  const filters: { key: FilterType; label: string }[] = [
    { key: "alle", label: `Alle (${reviews.length})` },
    { key: "offen", label: `Offen (${openCount})` },
    { key: "eingeloest", label: `Eingeloest (${claimedCount})` },
  ]

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Offene Codes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-amber-600">{openCount}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Check className="h-4 w-4" />
              Eingeloest
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-green-600">{claimedCount}</span>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {filters.map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.key)}
            className={filter === f.key ? "bg-[#C5A572] hover:bg-[#A08050]" : ""}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Goody-Codes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {filtered.length > 0 ? (
            filtered.map((review) => {
              const avgRating = [
                review.food_rating,
                review.ambience_rating,
                review.service_rating,
              ].filter((r): r is number => r != null)
              const avg = avgRating.length > 0
                ? avgRating.reduce((a, b) => a + b, 0) / avgRating.length
                : 0

              return (
                <div
                  key={review.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-sm font-mono font-semibold">
                          {review.goody_code}
                        </code>
                        <Badge
                          variant={review.goody_claimed ? "default" : "secondary"}
                          className={review.goody_claimed ? "bg-green-600" : "bg-amber-100 text-amber-700"}
                        >
                          {review.goody_claimed ? "Eingeloest" : "Offen"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>{review.guest_name || "Anonym"}</span>
                        <span>{new Date(review.created_at).toLocaleDateString("de-CH")}</span>
                        <StarDisplay rating={avg} />
                      </div>
                    </div>
                  </div>
                  <Button
                    variant={review.goody_claimed ? "outline" : "default"}
                    size="sm"
                    disabled={pending && loadingId === review.id}
                    onClick={() => handleToggle(review)}
                    className={!review.goody_claimed ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    {pending && loadingId === review.id ? (
                      "..."
                    ) : review.goody_claimed ? (
                      "Rueckgaengig"
                    ) : (
                      <>
                        <Check className="mr-1 h-4 w-4" />
                        Einloesen
                      </>
                    )}
                  </Button>
                </div>
              )
            })
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
              Keine Goody-Codes in dieser Ansicht.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
