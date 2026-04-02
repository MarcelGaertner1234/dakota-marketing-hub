import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, QrCode } from "lucide-react"
import Link from "next/link"

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          }`}
        />
      ))}
    </div>
  )
}

export default function BewertungenPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2C2C2C]">Bewertungen</h1>
          <p className="text-gray-500">Gäste-Feedback auswerten und verwalten</p>
        </div>
        <Link href="/bewertungen/qr">
          <Button className="bg-[#C5A572] hover:bg-[#A08050]">
            <QrCode className="mr-2 h-4 w-4" />
            QR-Code generieren
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Food</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <span className="text-2xl font-bold">4.2</span>
            <StarDisplay rating={4} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Ambiente</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <span className="text-2xl font-bold">4.5</span>
            <StarDisplay rating={5} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Service</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <span className="text-2xl font-bold">4.0</span>
            <StarDisplay rating={4} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Letzte Bewertungen</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Verbinde Supabase um Bewertungen zu sehen.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
