import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createTischkarte } from "@/lib/actions/tischkarten"
import { ArrowLeft, Sparkles } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default function NeueTischkartePage() {
  async function handleCreate(formData: FormData) {
    "use server"
    const result = await createTischkarte(formData)
    if (result?.id) {
      redirect(`/tischkarten/${result.id}/preview`)
    }
    redirect("/tischkarten")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/tischkarten">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-[#2C2C2C] dark:text-gray-100">
            Neue Tischkarte
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gastname eingeben, KI generiert den persönlichen Willkommens-Text
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reservierungs-Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="guest_name">
                Gastname *
              </Label>
              <Input
                id="guest_name"
                name="guest_name"
                required
                placeholder="z.B. Familie Müller, Herr Schmidt, Anna & Tom"
                autoFocus
              />
              <p className="text-xs text-gray-500">
                Wie der Gast auf der Karte angesprochen werden soll
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="occasion">Anlass</Label>
                <select
                  id="occasion"
                  name="occasion"
                  defaultValue="none"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                >
                  <option value="none">Kein besonderer Anlass</option>
                  <option value="birthday">Geburtstag</option>
                  <option value="anniversary">Jahrestag</option>
                  <option value="wedding">Hochzeit</option>
                  <option value="family">Familienfeier</option>
                  <option value="business">Geschäftsessen</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="party_size">Personenanzahl</Label>
                <Input
                  id="party_size"
                  name="party_size"
                  type="number"
                  min={1}
                  max={50}
                  placeholder="z.B. 4"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="reservation_date">Reservierungs-Datum</Label>
                <Input
                  id="reservation_date"
                  name="reservation_date"
                  type="date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="table_number">Tischnummer</Label>
                <Input
                  id="table_number"
                  name="table_number"
                  placeholder="z.B. 4 oder Stube"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom_hint">
                Hinweis für die KI (optional)
              </Label>
              <Textarea
                id="custom_hint"
                name="custom_hint"
                rows={3}
                placeholder="z.B. 'Familie kommt zum 50. Geburtstag der Mutter, war schon mal vor 5 Jahren da' — die KI baut diesen Kontext in den Text ein"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Link href="/tischkarten">
                <Button variant="outline">Abbrechen</Button>
              </Link>
              <Button
                type="submit"
                className="bg-[#C5A572] hover:bg-[#A08050]"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Karte mit KI generieren
              </Button>
            </div>
            <p className="text-center text-xs text-gray-500">
              Die KI erstellt Titel & Text in ~2 Sekunden — danach landest du
              direkt in der A5-Vorschau
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
