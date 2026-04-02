"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building,
  Tag,
  Clock,
  Pencil,
  Save,
  X,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { updateLead } from "@/lib/actions/leads"
import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from "@/lib/constants"
import type { LeadStatus, LeadType } from "@/types/database"
import { LeadStatusSelect } from "./lead-status-select"
import { ActivityForm } from "./activity-form"
import { useRouter } from "next/navigation"

const LEAD_TYPE_LABELS: Record<LeadType, string> = {
  verein: "Verein",
  firma: "Firma",
  privatperson: "Privatperson",
  behoerde: "Behörde",
  medien: "Medien",
}

const ALL_LEAD_TYPES: LeadType[] = [
  "privatperson",
  "firma",
  "verein",
  "behoerde",
  "medien",
]

interface LeadData {
  id: string
  name: string
  company: string | null
  lead_type: string
  email: string | null
  phone: string | null
  address: string | null
  status: string
  notes: string | null
  tags: string[] | null
  created_at: string
  activities?: Array<{
    id: string
    activity_type: string
    description: string
    contacted_at: string
    contacted_member?: { name: string } | null
    event?: { id: string; title: string } | null
  }>
}

export function LeadDetail({ lead }: { lead: LeadData }) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const status = lead.status as LeadStatus

  function handleSave(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const tags = (formData.get("tags") as string)
        ?.split(",")
        .map((t) => t.trim())
        .filter(Boolean) || []

      const result = await updateLead(lead.id, {
        name: formData.get("name") as string,
        company: (formData.get("company") as string) || null,
        email: (formData.get("email") as string) || null,
        phone: (formData.get("phone") as string) || null,
        address: (formData.get("address") as string) || null,
        notes: (formData.get("notes") as string) || null,
        lead_type: (formData.get("lead_type") as string) || "privatperson",
        tags: tags.length > 0 ? tags : null,
      })

      if (result.success) {
        setIsEditing(false)
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/leads">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-[#2C2C2C]">{lead.name}</h1>
            <Badge
              style={{
                backgroundColor: LEAD_STATUS_COLORS[status],
                color: "white",
              }}
            >
              {LEAD_STATUS_LABELS[status]}
            </Badge>
          </div>
          {lead.company && (
            <p className="mt-1 text-gray-500">{lead.company}</p>
          )}
        </div>
        <Button
          variant={isEditing ? "outline" : "default"}
          className={isEditing ? "" : "bg-[#C5A572] hover:bg-[#A08050]"}
          onClick={() => {
            setIsEditing(!isEditing)
            setError(null)
          }}
        >
          {isEditing ? (
            <>
              <X className="mr-2 h-4 w-4" /> Abbrechen
            </>
          ) : (
            <>
              <Pencil className="mr-2 h-4 w-4" /> Bearbeiten
            </>
          )}
        </Button>
      </div>

      {isEditing ? (
        /* Edit Mode */
        <form action={handleSave}>
          <Card>
            <CardHeader>
              <CardTitle>Lead bearbeiten</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={lead.name}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Firma</Label>
                  <Input
                    id="company"
                    name="company"
                    defaultValue={lead.company || ""}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={lead.email || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    defaultValue={lead.phone || ""}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    name="address"
                    defaultValue={lead.address || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead_type">Typ</Label>
                  <select
                    id="lead_type"
                    name="lead_type"
                    defaultValue={lead.lead_type}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  >
                    {ALL_LEAD_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {LEAD_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (kommagetrennt)</Label>
                <Input
                  id="tags"
                  name="tags"
                  defaultValue={lead.tags?.join(", ") || ""}
                  placeholder="z.B. VIP, Stammgast, Presse"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notizen</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  defaultValue={lead.notes || ""}
                  placeholder="Interne Notizen zum Lead..."
                />
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    setError(null)
                  }}
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  className="bg-[#C5A572] hover:bg-[#A08050]"
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Speichern
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      ) : (
        /* View Mode */
        <>
          {/* Info Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Building className="h-5 w-5 text-[#C5A572]" />
                <div>
                  <p className="text-xs text-gray-500">Typ</p>
                  <p className="font-medium capitalize">{LEAD_TYPE_LABELS[lead.lead_type as LeadType] || lead.lead_type}</p>
                </div>
              </CardContent>
            </Card>
            {lead.email && (
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <Mail className="h-5 w-5 text-[#C5A572]" />
                  <div>
                    <p className="text-xs text-gray-500">E-Mail</p>
                    <a href={`mailto:${lead.email}`} className="font-medium text-[#C5A572] hover:underline">
                      {lead.email}
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}
            {lead.phone && (
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <Phone className="h-5 w-5 text-[#C5A572]" />
                  <div>
                    <p className="text-xs text-gray-500">Telefon</p>
                    <a href={`tel:${lead.phone}`} className="font-medium text-[#C5A572] hover:underline">
                      {lead.phone}
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}
            {lead.address && (
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <MapPin className="h-5 w-5 text-[#C5A572]" />
                  <div>
                    <p className="text-xs text-gray-500">Adresse</p>
                    <p className="font-medium">{lead.address}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Clock className="h-5 w-5 text-[#C5A572]" />
                <div>
                  <p className="text-xs text-gray-500">Erstellt am</p>
                  <p className="font-medium">
                    {new Date(lead.created_at).toLocaleDateString("de-CH", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tags */}
          {lead.tags && lead.tags.length > 0 && (
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-gray-400" />
              <div className="flex flex-wrap gap-1">
                {lead.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Status + Notes */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                <LeadStatusSelect leadId={lead.id} currentStatus={status} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Notizen</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {lead.notes || "Keine Notizen vorhanden."}
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Activity History */}
      <Card>
        <CardHeader>
          <CardTitle>Kontakthistorie</CardTitle>
        </CardHeader>
        <CardContent>
          {lead.activities && lead.activities.length > 0 ? (
            <div className="space-y-4">
              {lead.activities
                .sort(
                  (a, b) =>
                    new Date(b.contacted_at).getTime() -
                    new Date(a.contacted_at).getTime()
                )
                .map((activity) => (
                  <div
                    key={activity.id}
                    className="flex gap-3 border-l-2 border-[#C5A572] pl-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="text-xs capitalize"
                        >
                          {activity.activity_type}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {new Date(activity.contacted_at).toLocaleDateString(
                            "de-CH",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-700">
                        {activity.description}
                      </p>
                      {activity.contacted_member && (
                        <p className="mt-0.5 text-xs text-gray-500">
                          von {activity.contacted_member.name}
                        </p>
                      )}
                      {activity.event && (
                        <p className="mt-0.5 text-xs text-gray-500">
                          Event: {activity.event.title}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              Noch keine Aktivitäten erfasst.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Add Activity Form */}
      <Card>
        <CardHeader>
          <CardTitle>Aktivität erfassen</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityForm leadId={lead.id} />
        </CardContent>
      </Card>
    </div>
  )
}
