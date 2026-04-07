import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createStory } from "@/lib/actions/stories"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default function NeueStoryPage() {
  async function handleCreate(formData: FormData) {
    "use server"
    const result = await createStory(formData)
    if (result?.id) {
      redirect(`/stories/${result.id}`)
    }
    redirect("/stories")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/stories">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-[#2C2C2C] dark:text-gray-100">
            Neue Story
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Im Chesa-Rosatsch-Stil: Titel + 3 emotionale Absätze
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Story-Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleCreate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  placeholder="z.B. Die Meringue"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Kategorie</Label>
                <select
                  id="category"
                  name="category"
                  defaultValue="dish"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                >
                  <option value="dish">Gericht</option>
                  <option value="drink">Drink</option>
                  <option value="house">Haus / Manifest</option>
                  <option value="crew">Crew / Team</option>
                  <option value="location">Ort / Region</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Untertitel (emotional)</Label>
              <Input
                id="subtitle"
                name="subtitle"
                placeholder="z.B. Ein Stück Meiringen auf dem Löffel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paragraph_1">
                Absatz 1 — Die Herkunft / Der Mythos *
              </Label>
              <Textarea
                id="paragraph_1"
                name="paragraph_1"
                required
                rows={4}
                placeholder="Woher kommt das Gericht? Welche Geschichte gibt es uns?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paragraph_2">
                Absatz 2 — Die Zubereitung / Das Handwerk
              </Label>
              <Textarea
                id="paragraph_2"
                name="paragraph_2"
                rows={4}
                placeholder="Wie machen wir es? Welche regionalen Zutaten?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paragraph_3">
                Absatz 3 — Der emotionale Schlusssatz
              </Label>
              <Textarea
                id="paragraph_3"
                name="paragraph_3"
                rows={3}
                placeholder='z.B. "Ein Stück Dorfstolz. Ein Stück Meiringen. Ein Stück von uns."'
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="footer_signature">Signatur</Label>
                <Input
                  id="footer_signature"
                  name="footer_signature"
                  defaultValue="Ihre Dakota Crew"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue="draft"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Link href="/stories">
                <Button variant="outline">Abbrechen</Button>
              </Link>
              <Button
                type="submit"
                className="bg-[#C5A572] hover:bg-[#A08050]"
              >
                Story speichern
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
