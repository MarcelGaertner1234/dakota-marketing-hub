export const dynamic = "force-dynamic"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import Link from "next/link"
import { getConcepts } from "@/lib/actions/concepts"

const CONCEPT_COLORS: Record<string, string> = {
  afterwork: "#F59E0B",
  "friday-lounge": "#8B5CF6",
  brunch: "#10B981",
  "biker-treff": "#EF4444",
  "sportler-menu": "#3B82F6",
  "nachbarschafts-apero": "#EC4899",
  themenabend: "#C5A572",
}

function getConceptColor(slug: string): string {
  const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6']
  const hash = slug.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return CONCEPT_COLORS[slug] || colors[hash % colors.length]
}

export default async function KonzeptePage() {
  const concepts = await getConcepts()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2C2C2C] dark:text-gray-100">Konzepte</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Nischen-Konzepte für gezielte Zielgruppenansprache
          </p>
        </div>
        <Link href="/konzepte/neu">
          <Button className="bg-[#C5A572] hover:bg-[#A08050]">
            <Plus className="mr-2 h-4 w-4" />
            Neues Konzept
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {concepts?.map((c) => (
          <Link key={c.id} href={`/konzepte/${c.id}`}>
            <Card className="overflow-hidden transition-shadow hover:shadow-lg cursor-pointer h-full">
              <div
                className="h-2"
                style={{ backgroundColor: getConceptColor(c.slug) }}
              />
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{c.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {c.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{c.description}</p>
                )}
                {c.target_audience && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Zielgruppe</p>
                    <p className="text-sm">{c.target_audience}</p>
                  </div>
                )}
                {c.price_range && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Preisbereich</p>
                    <p className="text-sm font-semibold text-[#C5A572]">{c.price_range}</p>
                  </div>
                )}
                {c.channels && c.channels.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {c.channels.map((ch: string) => (
                      <Badge key={ch} variant="secondary" className="text-xs">
                        {ch}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
