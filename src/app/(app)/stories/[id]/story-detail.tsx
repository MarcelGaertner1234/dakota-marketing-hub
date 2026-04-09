"use client"

/* eslint-disable @next/next/no-img-element */

import { useState, useTransition, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Pencil,
  Save,
  X,
  Upload,
  ImageIcon,
  Loader2,
  Trash2,
  Printer,
  ExternalLink,
  CheckCircle2,
  Download,
  EyeOff,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import {
  updateStory,
  updateStoryIllustration,
  deleteStory,
  publishStory,
  unpublishStory,
} from "@/lib/actions/stories"
import { useRouter } from "next/navigation"
import type { Story, StoryCategory } from "@/types/database"
import { IllustrationGeneratorModal } from "@/components/stories/illustration-generator-modal"

const CATEGORY_LABELS: Record<StoryCategory, string> = {
  dish: "Gericht",
  drink: "Drink",
  house: "Haus",
  crew: "Crew",
  location: "Ort",
}

const CATEGORY_COLORS: Record<StoryCategory, string> = {
  dish: "#10B981",
  drink: "#8B5CF6",
  house: "#C5A572",
  crew: "#EF4444",
  location: "#3B82F6",
}

/**
 * Lädt eine Illustration, brennt den Dakota-Hotel-Stempel rechts unten via
 * Canvas ein (multiply + opacity 0.32, gleiche Ratios wie StoryA5Card), und
 * triggert den Browser-Download als PNG. Kein Server, keine Dependency.
 */
async function downloadIllustrationWithLogo(
  illustrationUrl: string,
  storyTitle: string,
): Promise<void> {
  const loadImage = (
    src: string,
    crossOrigin?: "anonymous",
  ): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image()
      if (crossOrigin) img.crossOrigin = crossOrigin
      img.onload = () => resolve(img)
      img.onerror = () =>
        reject(new Error(`Bild konnte nicht geladen werden: ${src}`))
      img.src = src
    })

  const [illustration, logo] = await Promise.all([
    loadImage(illustrationUrl, "anonymous"),
    loadImage("/branding/dakota-hotel-logo.jpeg"),
  ])

  const canvas = document.createElement("canvas")
  canvas.width = illustration.naturalWidth
  canvas.height = illustration.naturalHeight
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas 2D context nicht verfügbar")

  // Weisser Grund falls die Illustration transparent ist
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(illustration, 0, 0, canvas.width, canvas.height)

  // Stempel unten rechts — identische Ratios zur A5-Card (24mm / 112mm Breite, 3mm Padding)
  const logoTargetWidth = canvas.width * (24 / 112)
  const logoAspect = logo.naturalWidth / logo.naturalHeight
  const logoTargetHeight = logoTargetWidth / logoAspect
  const padding = canvas.width * (3 / 112)
  const x = canvas.width - logoTargetWidth - padding
  const y = canvas.height - logoTargetHeight - padding

  ctx.save()
  ctx.globalAlpha = 0.32
  ctx.globalCompositeOperation = "multiply"
  ctx.drawImage(logo, x, y, logoTargetWidth, logoTargetHeight)
  ctx.restore()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  )
  if (!blob) throw new Error("Canvas toBlob liefert null")

  const slug =
    storyTitle
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "illustration"
  const downloadUrl = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = downloadUrl
  a.download = `dakota-${slug}.png`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(downloadUrl)
}

export function StoryDetail({ story }: { story: Story }) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleDownloadIllustration() {
    if (!story.illustration_url || isDownloading) return
    setIsDownloading(true)
    try {
      await downloadIllustrationWithLogo(story.illustration_url, story.title)
    } catch (err) {
      console.error("Illustration-Download fehlgeschlagen:", err)
      alert(
        "Illustration konnte nicht heruntergeladen werden. Bitte erneut versuchen.",
      )
    } finally {
      setIsDownloading(false)
    }
  }

  function handleSave(formData: FormData) {
    startTransition(async () => {
      await updateStory(story.id, formData)
      setIsEditing(false)
      router.refresh()
    })
  }

  async function handleIllustrationUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.set("file", file)
      formData.set("bucket", "story-illustrations")
      formData.set("folder", story.id)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (data.url) {
        await updateStoryIllustration(story.id, data.url)
        router.refresh()
      }
    } catch (err) {
      console.error("Upload failed:", err)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function handleRemoveIllustration() {
    await updateStoryIllustration(story.id, null)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm("Story wirklich löschen?")) return
    setIsDeleting(true)
    try {
      await deleteStory(story.id)
      router.push("/stories")
    } catch (err) {
      console.error("Delete failed:", err)
      setIsDeleting(false)
    }
  }

  async function handleTogglePublish() {
    startTransition(async () => {
      if (story.status === "published") {
        await unpublishStory(story.id)
      } else {
        await publishStory(story.id)
      }
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/stories">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="secondary"
              style={{
                backgroundColor: `${CATEGORY_COLORS[story.category]}15`,
                color: CATEGORY_COLORS[story.category],
              }}
            >
              {CATEGORY_LABELS[story.category]}
            </Badge>
            <Badge
              className={
                story.status === "published"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  : ""
              }
              variant={story.status === "published" ? "default" : "outline"}
            >
              {story.status === "published" ? "Published" : "Draft"}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold text-[#2C2C2C] dark:text-gray-100 truncate">
            {story.title}
          </h1>
          {story.subtitle && (
            <p className="mt-1 text-gray-500 dark:text-gray-400 italic">
              {story.subtitle}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/stories/${story.id}/preview`} target="_blank">
            <Button variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              A5 Druck
            </Button>
          </Link>
          <Button
            variant={isEditing ? "outline" : "default"}
            className={isEditing ? "" : "bg-[#C5A572] hover:bg-[#A08050]"}
            onClick={() => setIsEditing(!isEditing)}
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
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Linke Seite: Edit / Infos */}
        <div className="space-y-6">
          {/* Illustration Upload */}
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
                {story.illustration_url && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadIllustration}
                      disabled={isDownloading}
                    >
                      {isDownloading ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      {isDownloading ? "Lädt..." : "Download"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveIllustration}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {story.illustration_url ? (
                <div
                  className="group relative overflow-hidden rounded-lg border cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <img
                    src={story.illustration_url}
                    alt="Illustration"
                    className="h-48 w-full object-contain bg-[#fbfaf6]"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="rounded bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700">
                      Neu hochladen
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-48 w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 transition-colors hover:border-[#C5A572] hover:bg-[#C5A572]/5"
                >
                  {isUploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-[#C5A572]" />
                  ) : (
                    <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  )}
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {isUploading
                      ? "Wird hochgeladen..."
                      : "Handgezeichnete Illustration hochladen"}
                  </span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleIllustrationUpload}
              />
            </CardContent>
          </Card>

          {/* Edit Form */}
          {isEditing ? (
            <form action={handleSave}>
              <Card>
                <CardHeader>
                  <CardTitle>Story bearbeiten</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="title">Titel</Label>
                      <Input
                        id="title"
                        name="title"
                        defaultValue={story.title}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Kategorie</Label>
                      <select
                        id="category"
                        name="category"
                        defaultValue={story.category}
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
                    <Label htmlFor="subtitle">Untertitel</Label>
                    <Input
                      id="subtitle"
                      name="subtitle"
                      defaultValue={story.subtitle || ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paragraph_1">Absatz 1 *</Label>
                    <Textarea
                      id="paragraph_1"
                      name="paragraph_1"
                      required
                      rows={4}
                      defaultValue={story.paragraph_1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paragraph_2">Absatz 2</Label>
                    <Textarea
                      id="paragraph_2"
                      name="paragraph_2"
                      rows={4}
                      defaultValue={story.paragraph_2 || ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paragraph_3">Absatz 3</Label>
                    <Textarea
                      id="paragraph_3"
                      name="paragraph_3"
                      rows={3}
                      defaultValue={story.paragraph_3 || ""}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="footer_signature">Signatur</Label>
                      <Input
                        id="footer_signature"
                        name="footer_signature"
                        defaultValue={story.footer_signature}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <select
                        id="status"
                        name="status"
                        defaultValue={story.status}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
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
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500 dark:text-gray-400">
                    Absatz 1 — Herkunft / Mythos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">
                    {story.paragraph_1}
                  </p>
                </CardContent>
              </Card>

              {story.paragraph_2 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-500 dark:text-gray-400">
                      Absatz 2 — Zubereitung / Handwerk
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">
                      {story.paragraph_2}
                    </p>
                  </CardContent>
                </Card>
              )}

              {story.paragraph_3 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-500 dark:text-gray-400">
                      Absatz 3 — Emotionaler Schluss
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed italic">
                      {story.paragraph_3}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Aktionen */}
              <Card>
                <CardContent className="flex flex-wrap gap-2 p-4">
                  <Button
                    variant="outline"
                    onClick={handleTogglePublish}
                    disabled={isPending}
                  >
                    {story.status === "published" ? (
                      <>
                        <EyeOff className="mr-2 h-4 w-4" />
                        Zurück zu Draft
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Publishen
                      </>
                    )}
                  </Button>
                  <Link href={`/story/${story.id}`} target="_blank">
                    <Button variant="outline">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Öffentliche Ansicht
                    </Button>
                  </Link>
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
            </>
          )}
        </div>

        {/* Rechte Seite: Live-Vorschau-Hinweis */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-sm text-gray-500 dark:text-gray-400">
                A5-Vorschau
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-6 text-center">
                <Printer className="mx-auto mb-3 h-8 w-8 text-gray-400" />
                <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                  Die fertige A5-Ansicht im Chesa-Rosatsch-Stil öffnet
                  sich in einem neuen Tab — perfekt für Cmd+P → PDF.
                </p>
                <Link href={`/stories/${story.id}/preview`} target="_blank">
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

      {/* KI Illustration Generator Modal */}
      <IllustrationGeneratorModal
        storyId={story.id}
        storyTitle={story.title}
        open={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onSuccess={() => router.refresh()}
      />
    </div>
  )
}
