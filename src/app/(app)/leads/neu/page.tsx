"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createLead } from "@/lib/actions/leads"
import { ArrowLeft, User, Flame, Zap, BookOpen, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function NeuerLeadPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleCreate(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createLead(formData)
      if (!result.success) {
        setError(result.error)
        return
      }
      router.push("/leads")
    })
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
          <h1 className="text-3xl font-bold text-[#2C2C2C] dark:text-gray-100">Neuer Lead</h1>
          <p className="text-gray-500 dark:text-gray-400">Kontakt erfassen und nachverfolgen</p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          <strong>Fehler:</strong> {error}
        </div>
      )}

      <form action={handleCreate} className="space-y-6">
        {/* Basis-Infos */}
        <Card>
          <CardHeader>
            <CardTitle>Kontakt-Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        {/* Ansprechpartner */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-[#C5A572]" />
              Ansprechpartner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact_person">Name</Label>
                <Input id="contact_person" name="contact_person" placeholder="z.B. Hans Müller" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_role">Rolle / Position</Label>
                <Input id="contact_role" name="contact_role" placeholder="z.B. Präsident, Marketing-Leiter" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Story & Strategie */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#C5A572]" />
              Story & Strategie
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="story">Story / Verbindung zu Dakota</Label>
              <Textarea
                id="story"
                name="story"
                rows={3}
                placeholder="Warum ist dieser Lead relevant? Was ist die Verbindung? z.B. 'Vereinspräsident ist Stammgast, hat schon 2x Afterwork besucht. Sucht Location für Jahresessen.'"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trigger_points">Trigger-Punkte (kommagetrennt)</Label>
              <Input
                id="trigger_points"
                name="trigger_points"
                placeholder="z.B. Vereinsessen, Generalversammlung, Sommerfest, Weihnachtsfeier"
              />
              <p className="text-xs text-gray-400">Anlässe die den Lead aktivieren könnten</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperatur</Label>
                <select
                  id="temperature"
                  name="temperature"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  defaultValue="kalt"
                >
                  <option value="kalt">Kalt -- noch kein Kontakt</option>
                  <option value="warm">Warm -- Interesse vorhanden</option>
                  <option value="heiss">Heiss -- kurz vor Abschluss</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nächste Aktion */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#C5A572]" />
              Nächste Aktion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="next_action">Was ist der nächste Schritt?</Label>
                <Input
                  id="next_action"
                  name="next_action"
                  placeholder="z.B. Anrufen und Osterbrunch vorstellen"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="next_action_date">Bis wann?</Label>
                <Input id="next_action_date" name="next_action_date" type="date" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notizen</Label>
              <Textarea id="notes" name="notes" rows={3} placeholder="Weitere Infos..." />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Link href="/leads">
            <Button variant="outline">Abbrechen</Button>
          </Link>
          <Button type="submit" disabled={isPending} className="bg-[#C5A572] hover:bg-[#A08050]">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Speichert...
              </>
            ) : (
              "Lead speichern"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
