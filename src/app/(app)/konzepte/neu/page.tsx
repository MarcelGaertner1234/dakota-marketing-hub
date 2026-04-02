import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createConcept } from "@/lib/actions/concepts"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default function NeuesKonzeptPage() {
  async function handleCreate(formData: FormData) {
    "use server"
    await createConcept(formData)
    redirect("/konzepte")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/konzepte">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-[#2C2C2C] dark:text-gray-100">Neues Konzept</h1>
          <p className="text-gray-500 dark:text-gray-400">Nischen-Konzept erfassen</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Konzept-Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" name="name" required placeholder="z.B. Friday Lounge" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea id="description" name="description" rows={3} placeholder="Worum geht es bei diesem Konzept?" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description_berndeutsch">Beschreibung (Berndeutsch)</Label>
              <Textarea id="description_berndeutsch" name="description_berndeutsch" rows={3} placeholder="Ds Konzept uf Bärndütsch..." />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="target_audience">Zielgruppe</Label>
                <Input id="target_audience" name="target_audience" placeholder="z.B. Junge Berufstätige 25-40" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="channels">Kanäle (kommagetrennt)</Label>
                <Input id="channels" name="channels" placeholder="instagram, facebook, flyer" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="menu_description">Menu-Beschreibung</Label>
              <Textarea id="menu_description" name="menu_description" rows={3} placeholder="Was wird serviert?" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_range">Preisbereich</Label>
              <Input id="price_range" name="price_range" placeholder="z.B. CHF 25-45" />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Link href="/konzepte">
                <Button variant="outline">Abbrechen</Button>
              </Link>
              <Button type="submit" className="bg-[#C5A572] hover:bg-[#A08050]">
                Konzept speichern
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
