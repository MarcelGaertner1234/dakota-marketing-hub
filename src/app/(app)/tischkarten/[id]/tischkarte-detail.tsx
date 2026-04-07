"use client"

/* eslint-disable @next/next/no-img-element */

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Loader2,
  Trash2,
  Printer,
  RefreshCw,
  Sparkles,
  Calendar,
  Users,
  Hash,
  ImageIcon,
} from "lucide-react"
import Link from "next/link"
import {
  regenerateTischkarteText,
  updateTischkarteIllustration,
  deleteTischkarte,
} from "@/lib/actions/tischkarten"
import { useRouter } from "next/navigation"
import type { Tischkarte, TischkartenOccasion } from "@/types/database"
import { TischkarteIllustrationModal } from "@/components/tischkarten/tischkarte-illustration-modal"

const OCCASION_LABELS: Record<TischkartenOccasion, string> = {
  birthday: "Geburtstag",
  anniversary: "Jahrestag",
  business: "Geschäftsessen",
  family: "Familienfeier",
  wedding: "Hochzeit",
  none: "—",
}

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString("de-CH", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  } catch {
    return iso
  }
}

export function TischkarteDetail({ tischkarte }: { tischkarte: Tischkarte }) {
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const router = useRouter()

  function handleRegenerate() {
    startTransition(async () => {
      await regenerateTischkarteText(tischkarte.id)
      router.refresh()
    })
  }

  async function handleRemoveIllustration() {
    await updateTischkarteIllustration(tischkarte.id, null)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm("Tischkarte wirklich löschen?")) return
    setIsDeleting(true)
    try {
      await deleteTischkarte(tischkarte.id)
      router.push("/tischkarten")
    } catch (err) {
      console.error("Delete failed:", err)
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/tischkarten">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="secondary"
              style={{
                backgroundColor: "#C5A57215",
                color: "#9A8050",
              }}
            >
              {tischkarte.guest_name}
            </Badge>
            {tischkarte.occasion && tischkarte.occasion !== "none" && (
              <Badge variant="outline">
                {OCCASION_LABELS[tischkarte.occasion]}
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold text-[#2C2C2C] dark:text-gray-100 truncate">
            {tischkarte.title}
          </h1>
          {tischkarte.subtitle && (
            <p className="mt-1 text-gray-500 dark:text-gray-400 italic">
              {tischkarte.subtitle}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/tischkarten/${tischkarte.id}/preview`} target="_blank">
            <Button className="bg-[#C5A572] hover:bg-[#A08050]">
              <Printer className="mr-2 h-4 w-4" />
              A5 Druck
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Linke Seite */}
        <div className="space-y-6">
          {/* Reservierungs-Metadata */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-500 dark:text-gray-400">
                Reservierung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{formatDate(tischkarte.reservation_date)}</span>
              </div>
              {tischkarte.party_size && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span>{tischkarte.party_size} Personen</span>
                </div>
              )}
              {tischkarte.table_number && (
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-gray-400" />
                  <span>Tisch {tischkarte.table_number}</span>
                </div>
              )}
              {tischkarte.custom_hint && (
                <div className="mt-3 rounded-md bg-gray-50 dark:bg-gray-900 p-3 text-xs italic text-gray-600 dark:text-gray-400">
                  &ldquo;{tischkarte.custom_hint}&rdquo;
                </div>
              )}
            </CardContent>
          </Card>

          {/* Illustration */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Illustration
                </div>
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAiModalOpen(true)}
                  className="border-[#C5A572] text-[#C5A572] hover:bg-[#C5A572]/10"
                >
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  KI generieren
                </Button>
                {tischkarte.illustration_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveIllustration}
                    title="Auf Default zurücksetzen"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border bg-[#fbfaf6]">
                <img
                  src={
                    tischkarte.illustration_url ??
                    "/branding/tischkarten-default.png"
                  }
                  alt="Tischkarten Illustration"
                  className="h-48 w-full object-contain"
                />
              </div>
              {!tischkarte.illustration_url && (
                <p className="mt-2 text-center text-[11px] italic text-gray-400">
                  Default-Bild — klick &ldquo;KI generieren&rdquo; für ein eigenes Motiv
                </p>
              )}
            </CardContent>
          </Card>

          {/* Text-Absätze */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-gray-500 dark:text-gray-400">
                KI-Text
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                )}
                Neu generieren
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed">
              <p>{tischkarte.paragraph_1}</p>
              {tischkarte.paragraph_2 && <p>{tischkarte.paragraph_2}</p>}
              {tischkarte.paragraph_3 && (
                <p className="italic">{tischkarte.paragraph_3}</p>
              )}
            </CardContent>
          </Card>

          {/* Aktionen */}
          <Card>
            <CardContent className="flex flex-wrap gap-2 p-4">
              <Button
                variant="outline"
                className="ml-auto text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Löschen
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Rechte Seite — A5-Vorschau-Hinweis */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-sm text-gray-500 dark:text-gray-400">
                A5-Vorschau & Druck
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-6 text-center">
                <Printer className="mx-auto mb-3 h-8 w-8 text-gray-400" />
                <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                  Die fertige A5-Tischkarte öffnet sich in einem neuen Tab —
                  ein Klick auf &ldquo;Als PDF herunterladen&rdquo;, A5
                  drucken, auf den Tisch stellen.
                </p>
                <Link
                  href={`/tischkarten/${tischkarte.id}/preview`}
                  target="_blank"
                >
                  <Button className="bg-[#C5A572] hover:bg-[#A08050]">
                    <Printer className="mr-2 h-4 w-4" />
                    A5-Vorschau öffnen
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* KI Illustration Modal */}
      <TischkarteIllustrationModal
        tischkarteId={tischkarte.id}
        guestName={tischkarte.guest_name}
        open={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onSuccess={() => router.refresh()}
      />
    </div>
  )
}
