import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createLead } from "@/lib/actions/leads"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default function NeuerLeadPage() {
  async function handleCreate(formData: FormData) {
    "use server"
    await createLead(formData)
    redirect("/leads")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/leads">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-[#2C2C2C]">Neuer Lead</h1>
          <p className="text-gray-500">Kontakt erfassen und nachverfolgen</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kontakt-Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleCreate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name / Organisation *</Label>
                <Input id="name" name="name" required placeholder="z.B. Turnverein Meiringen" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead_type">Typ</Label>
                <select
                  id="lead_type"
                  name="lead_type"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  defaultValue="privatperson"
                >
                  <option value="verein">Verein</option>
                  <option value="firma">Firma</option>
                  <option value="privatperson">Privatperson</option>
                  <option value="behoerde">Behörde</option>
                  <option value="medien">Medien</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company">Firma/Verein</Label>
                <Input id="company" name="company" placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input id="email" name="email" type="email" placeholder="kontakt@example.ch" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" name="phone" placeholder="+41 79 123 45 67" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (kommagetrennt)</Label>
                <Input id="tags" name="tags" placeholder="brunch, firmenanlass, lokal" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notizen</Label>
              <Textarea id="notes" name="notes" rows={3} placeholder="Wichtige Infos zum Lead..." />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Link href="/leads">
                <Button variant="outline">Abbrechen</Button>
              </Link>
              <Button type="submit" className="bg-[#C5A572] hover:bg-[#A08050]">
                Lead speichern
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
