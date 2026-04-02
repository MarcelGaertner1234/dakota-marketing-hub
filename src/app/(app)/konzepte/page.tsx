import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import Link from "next/link"

const CONCEPTS = [
  {
    name: "Afterwork",
    description: "Nach der Arbeit entspannen — kleiner Snack, Drinks, lockere Atmosphäre",
    target: "Arbeitnehmer, Büro-Angestellte",
    channels: ["flyer", "instagram", "facebook"],
    price: "CHF 15-25",
    color: "#F59E0B",
  },
  {
    name: "Friday Lounge",
    description: "Freitag Abend Lounge-Konzept mit DJ und Spezialpreisen",
    target: "Junge Erwachsene, Locals",
    channels: ["instagram", "tiktok", "flyer"],
    price: "CHF 20-35",
    color: "#8B5CF6",
  },
  {
    name: "Brunch",
    description: "Sonntagsbrunch mit regionalen Produkten",
    target: "Familien, Paare, Geniesser",
    channels: ["instagram", "facebook"],
    price: "CHF 35-49",
    color: "#10B981",
  },
  {
    name: "Biker Treff",
    description: "Treffpunkt für Motorrad- und Velofahrer",
    target: "Biker, Sportler",
    channels: ["facebook"],
    price: "CHF 18-30",
    color: "#EF4444",
  },
  {
    name: "Sportler Menü",
    description: "Proteinreiche Menüs nach dem Training",
    target: "Sportler, Fitness-Begeisterte",
    channels: ["instagram", "flyer"],
    price: "CHF 22-32",
    color: "#3B82F6",
  },
  {
    name: "Nachbarschafts-Apéro",
    description: "Lokale Gemeinschaft zusammenbringen",
    target: "Anwohner, Nachbarschaft",
    channels: ["flyer", "mundpropaganda"],
    price: "CHF 0-20",
    color: "#EC4899",
  },
  {
    name: "Themenabend",
    description: "Spezielle kulinarische Themenabende",
    target: "Geniesser, Food-Enthusiasten",
    channels: ["instagram", "facebook", "newsletter"],
    price: "CHF 45-65",
    color: "#C5A572",
  },
]

export default function KonzeptePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2C2C2C]">Konzepte</h1>
          <p className="text-gray-500">
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
        {CONCEPTS.map((c) => (
          <Card
            key={c.name}
            className="overflow-hidden transition-shadow hover:shadow-lg cursor-pointer"
          >
            <div className="h-2" style={{ backgroundColor: c.color }} />
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{c.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">{c.description}</p>
              <div>
                <p className="text-xs font-medium text-gray-500">Zielgruppe</p>
                <p className="text-sm">{c.target}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Preisbereich
                </p>
                <p className="text-sm font-semibold text-[#C5A572]">
                  {c.price}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                {c.channels.map((ch) => (
                  <Badge key={ch} variant="secondary" className="text-xs">
                    {ch}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
