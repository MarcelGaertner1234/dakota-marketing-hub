"use client"

import Image from "next/image"
import { useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Star, Gift, Loader2 } from "lucide-react"
import { BRAND_ASSETS } from "@/lib/brand"

function StarInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i + 1)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`h-8 w-8 ${
                i < value ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export default function BewertungPage() {
  const params = useParams()
  const token = params.token as string

  const [food, setFood] = useState(0)
  const [ambience, setAmbience] = useState(0)
  const [service, setService] = useState(0)
  const [comment, setComment] = useState("")
  const [name, setName] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [goodyCode, setGoodyCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          food_rating: food,
          ambience_rating: ambience,
          service_rating: service,
          comment: comment || undefined,
          guest_name: name || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Fehler beim Speichern")
      setGoodyCode(data.goody_code)
      setSubmitted(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F6F3] p-4 dark:bg-gray-950">
        <Card className="w-full max-w-md border-[#E7DED1] bg-white text-center shadow-xl shadow-black/5">
          <CardContent className="space-y-4 pt-8 pb-8">
            <div className="mx-auto mb-2 flex items-center justify-center gap-3 rounded-full bg-[#F8F6F3] px-4 py-2">
              <div className="overflow-hidden rounded-full border border-[#E7DED1] bg-white p-1">
                <Image
                  src={BRAND_ASSETS.hotelLogo}
                  alt="Dakota Hotel"
                  width={44}
                  height={44}
                  className="h-11 w-11 object-contain"
                />
              </div>
              <Image
                src={BRAND_ASSETS.airLoungeLogo}
                alt="Air Lounge"
                width={150}
                height={78}
                className="h-12 w-auto object-contain"
              />
            </div>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Gift className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl text-[#2C2C2C] dark:text-gray-100">Merci viumau!</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Danke für deine Bewertung. Als kleines Dankeschön:
            </p>
            <div className="rounded-lg bg-[#C5A572]/10 p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">Dein Goody-Code</p>
              <p className="text-2xl font-bold tracking-wider text-[#C5A572]">
                {goodyCode}
              </p>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Zeig diesen Code beim nächsten Besuch vor!
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F6F3] p-4 dark:bg-gray-950">
      <Card className="w-full max-w-md border-[#E7DED1] bg-white shadow-xl shadow-black/5">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex flex-col items-center gap-3">
            <div className="overflow-hidden rounded-full border border-[#E7DED1] bg-white p-1.5 shadow-sm">
              <Image
                src={BRAND_ASSETS.hotelLogo}
                alt="Dakota Hotel"
                width={78}
                height={78}
                className="h-[78px] w-[78px] object-contain"
              />
            </div>
            <Image
              src={BRAND_ASSETS.airLoungeLogo}
              alt="Air Lounge"
              width={280}
              height={145}
              className="h-auto w-[210px] object-contain sm:w-[240px]"
            />
          </div>
          <CardTitle className="text-xl text-[#2C2C2C] dark:text-gray-100">Wie war dein Erlebnis?</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Dein Feedback hilft uns, noch besser zu werden.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <StarInput label="Food" value={food} onChange={setFood} />
            <StarInput label="Ambiente" value={ambience} onChange={setAmbience} />
            <StarInput label="Service" value={service} onChange={setService} />

            <div className="space-y-2">
              <Label htmlFor="comment">Kommentar (optional)</Label>
              <Textarea
                id="comment"
                placeholder="Was hat dir besonders gefallen?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Dein Name (optional)</Label>
              <Input
                id="name"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 dark:text-red-400 text-center">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full bg-[#C5A572] hover:bg-[#A08050]"
              disabled={food === 0 || ambience === 0 || service === 0 || loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Bewertung abschicken
            </Button>

            <p className="text-center text-xs text-gray-400 dark:text-gray-500">
              Du erhältst einen Goody-Code als Dankeschön!
            </p>
            <p className="text-center text-[11px] text-[#7C6951]">
              Dakota Air Lounge · Amthausgasse 2 · Meiringen
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
