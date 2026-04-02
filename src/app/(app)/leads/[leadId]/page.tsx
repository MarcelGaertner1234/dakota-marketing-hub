import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Mail, Phone, MapPin, Building, Tag, Clock } from "lucide-react"
import Link from "next/link"
import { getLead } from "@/lib/actions/leads"
import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from "@/lib/constants"
import { notFound } from "next/navigation"
import type { LeadStatus } from "@/types/database"
import { LeadStatusSelect } from "./lead-status-select"
import { ActivityForm } from "./activity-form"

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ leadId: string }>
}) {
  const { leadId } = await params

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lead: any = await getLead(leadId).catch(() => null)
  if (!lead) notFound()

  const status = lead.status as LeadStatus

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
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Building className="h-5 w-5 text-[#C5A572]" />
            <div>
              <p className="text-xs text-gray-500">Typ</p>
              <p className="font-medium capitalize">{lead.lead_type}</p>
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
        {/* Status Change */}
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadStatusSelect leadId={lead.id} currentStatus={status} />
          </CardContent>
        </Card>

        {/* Notes */}
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

      {/* Activity History */}
      <Card>
        <CardHeader>
          <CardTitle>Kontakthistorie</CardTitle>
        </CardHeader>
        <CardContent>
          {lead.activities && lead.activities.length > 0 ? (
            <div className="space-y-4">
              {lead.activities
                .sort((a: { contacted_at: string }, b: { contacted_at: string }) =>
                  new Date(b.contacted_at).getTime() - new Date(a.contacted_at).getTime()
                )
                .map((activity: {
                  id: string
                  activity_type: string
                  description: string
                  contacted_at: string
                  contacted_member?: { name: string } | null
                  event?: { id: string; title: string } | null
                }) => (
                  <div key={activity.id} className="flex gap-3 border-l-2 border-[#C5A572] pl-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs capitalize">
                          {activity.activity_type}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {new Date(activity.contacted_at).toLocaleDateString("de-CH", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-700">{activity.description}</p>
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
            <p className="text-sm text-gray-400">Noch keine Aktivitäten erfasst.</p>
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
