export const dynamic = "force-dynamic"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Utensils, Eye, Calendar, Users } from "lucide-react"
import Link from "next/link"
import { listTischkarten } from "@/lib/actions/tischkarten"
import type { Tischkarte, TischkartenOccasion, TischkartenLanguage } from "@/types/database"

const OCCASION_LABELS: Record<TischkartenOccasion, string> = {
  birthday: "Geburtstag",
  anniversary: "Jahrestag",
  business: "Geschäftsessen",
  family: "Familienfeier",
  wedding: "Hochzeit",
  none: "—",
}

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString("de-CH", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
  } catch {
    return iso
  }
}

export default async function TischkartenPage() {
  const tischkarten = (await listTischkarten()) as Tischkarte[] | null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2C2C2C] dark:text-gray-100">
            Tischkarten
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Personalisierte KI-Reservierungs-Karten — statt anonymer
            Reserviert-Schilder
          </p>
        </div>
        <Link href="/tischkarten/neu">
          <Button className="bg-[#C5A572] hover:bg-[#A08050]">
            <Plus className="mr-2 h-4 w-4" />
            Neue Tischkarte
          </Button>
        </Link>
      </div>

      {!tischkarten || tischkarten.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Utensils className="mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
            <p className="mb-4 text-gray-500 dark:text-gray-400">
              Noch keine Tischkarten generiert.
            </p>
            <Link href="/tischkarten/neu">
              <Button className="bg-[#C5A572] hover:bg-[#A08050]">
                <Plus className="mr-2 h-4 w-4" />
                Erste Karte erstellen
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tischkarten.map((tk) => (
            <Link key={tk.id} href={`/tischkarten/${tk.id}`}>
              <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg cursor-pointer">
                <div className="h-2 bg-[#C5A572]" />
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-[#2C2C2C] dark:text-gray-100">
                      {tk.guest_name}
                    </div>
                    <div className="flex gap-1">
                      {tk.occasion && tk.occasion !== "none" && (
                        <Badge
                          variant="secondary"
                          className="text-[10px]"
                          style={{
                            backgroundColor: "#C5A57215",
                            color: "#9A8050",
                          }}
                        >
                          {OCCASION_LABELS[tk.occasion]}
                        </Badge>
                      )}
                      {tk.language && tk.language !== "de" && (
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {tk.language.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <h3 className="font-serif text-base leading-tight italic text-gray-700 dark:text-gray-300 line-clamp-2">
                    {tk.title}
                  </h3>

                  <div className="flex flex-wrap gap-3 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(tk.reservation_date)}
                    </span>
                    {tk.party_size && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {tk.party_size}
                      </span>
                    )}
                    {tk.table_number && (
                      <span className="rounded bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5">
                        Tisch {tk.table_number}
                      </span>
                    )}
                  </div>

                  <p className="line-clamp-2 text-xs text-gray-600 dark:text-gray-400">
                    {tk.paragraph_1}
                  </p>

                  <div className="flex items-center gap-2 pt-1 text-[10px] text-gray-400">
                    <Eye className="h-3 w-3" />
                    {tk.illustration_url ? "Eigene KI-Illustration" : "Default-Bild"}
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
