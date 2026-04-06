"use client"

import Image from "next/image"
import { useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Star, Gift, Loader2, Copy, Check } from "lucide-react"
import { BRAND_ASSETS, GOOGLE_REVIEW_URL } from "@/lib/brand"

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
                i < value ? "fill-[#C5A572] text-[#C5A572]" : "text-[#CFC6BA]"
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
  const [copied, setCopied] = useState(false)

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
      <div className="flex min-h-screen items-center justify-center bg-[#F8F6F3] p-4">
        <Card className="w-full max-w-md border-[#E7DED1] bg-white text-center text-[#2C2C2C] shadow-xl shadow-black/5">
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
            <h2 className="text-2xl text-[#2C2C2C]">Merci viumau!</h2>
            <p className="text-[#5E5346]">
              Danke für deine Bewertung. Als kleines Dankeschön:
            </p>
            <div className="rounded-lg bg-[#C5A572]/10 p-4">
              <p className="text-xs text-[#7C6951]">Dein Goody-Code</p>
              <p className="text-2xl font-bold tracking-wider text-[#C5A572]">
                {goodyCode}
              </p>
            </div>
            <p className="text-xs text-[#7C6951]">
              Zeig diesen Code beim nächsten Besuch vor!
            </p>
            <div className="mt-4 pt-4 border-t border-[#E7DED1] space-y-3">
              <p className="text-xs text-[#7C6951]">
                Würdest du uns auch auf Google empfehlen?
              </p>
              {comment && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(comment)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#E7DED1] bg-[#F8F6F3] px-4 py-2 text-xs text-[#5E5346] transition-colors hover:bg-[#F3EEE6]"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Text kopiert!" : "Deinen Kommentar kopieren"}
                </button>
              )}
              <a
                href={GOOGLE_REVIEW_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => { if (comment && !copied) { navigator.clipboard.writeText(comment); setCopied(true) } }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#E7DED1] bg-white px-4 py-2.5 text-sm font-medium text-[#2C2C2C] shadow-sm transition-colors hover:bg-gray-50"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Auf Google bewerten
              </a>
              {comment && (
                <p className="text-[10px] text-[#9A8D7A] text-center">
                  Dein Text wird kopiert — einfach bei Google einfügen
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F6F3] p-4">
      <Card className="w-full max-w-md border-[#E7DED1] bg-white text-[#2C2C2C] shadow-xl shadow-black/5">
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
          <CardTitle className="text-2xl text-[#2C2C2C]">Wie war dein Erlebnis?</CardTitle>
          <p className="text-sm font-medium text-[#5E5346]">
            Dein Feedback hilft uns, noch besser zu werden.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6 text-[#2C2C2C]">
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
                className="border-[#D9CFBF] bg-white text-[#2C2C2C] placeholder:text-[#9A8D7A]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Dein Name (optional)</Label>
              <Input
                id="name"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border-[#D9CFBF] bg-white text-[#2C2C2C] placeholder:text-[#9A8D7A]"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
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

            <p className="text-center text-xs font-medium text-[#7C6951]">
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
