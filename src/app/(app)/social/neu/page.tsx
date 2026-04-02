import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createSocialPost } from "@/lib/actions/social"
import { getConcepts } from "@/lib/actions/concepts"
import { getEvents } from "@/lib/actions/events"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function NeuerPostPage() {
  const [concepts, events] = await Promise.all([getConcepts(), getEvents()])

  async function handleCreate(formData: FormData) {
    "use server"
    await createSocialPost(formData)
    redirect("/social")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/social">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-[#2C2C2C]">Neuer Post</h1>
          <p className="text-gray-500">Social Media Beitrag planen</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Post-Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleCreate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Titel *</Label>
                <Input id="title" name="title" required placeholder="z.B. Afterwork Launch Teaser" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform">Plattform *</Label>
                <select
                  id="platform"
                  name="platform"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  required
                >
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="tiktok">TikTok</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="post_type">Typ</Label>
                <select
                  id="post_type"
                  name="post_type"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  <option value="post">Post</option>
                  <option value="story">Story</option>
                  <option value="reel">Reel</option>
                  <option value="short">Short</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  <option value="draft">Entwurf</option>
                  <option value="planned">Geplant</option>
                  <option value="ready">Bereit</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="caption">Caption / Text</Label>
              <Textarea id="caption" name="caption" rows={4} placeholder="Post-Text..." />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="hashtags">Hashtags (kommagetrennt)</Label>
                <Input id="hashtags" name="hashtags" placeholder="#dakota, #meiringen, #airlounge" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduled_at">Geplantes Datum</Label>
                <Input id="scheduled_at" name="scheduled_at" type="datetime-local" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="event_id">Verknüpftes Event</Label>
                <select
                  id="event_id"
                  name="event_id"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  <option value="">Kein Event</option>
                  {events?.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title} ({new Date(e.start_date).toLocaleDateString("de-CH")})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="concept_id">Verknüpftes Konzept</Label>
                <select
                  id="concept_id"
                  name="concept_id"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  <option value="">Kein Konzept</option>
                  {concepts?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="series_id">Serie (optional)</Label>
                <Input id="series_id" name="series_id" placeholder="z.B. afterwork-launch" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="series_order">Serie — Teil Nr.</Label>
                <Input id="series_order" name="series_order" type="number" min={1} max={10} placeholder="z.B. 1 (von 5)" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Link href="/social">
                <Button variant="outline">Abbrechen</Button>
              </Link>
              <Button type="submit" className="bg-[#C5A572] hover:bg-[#A08050]">
                Post erstellen
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
