"use client"

/* eslint-disable @next/next/no-img-element */

import { useState, useTransition, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Calendar,
  Pencil,
  Save,
  X,
  Upload,
  ImageIcon,
  Loader2,
  Trash2,
  Plus,
} from "lucide-react"
import Link from "next/link"
import { updateConcept, updateConceptImage } from "@/lib/actions/concepts"
import { useRouter } from "next/navigation"

interface StorageFile {
  name: string
  path: string
  url: string
  size?: number
  created_at?: string
}

interface ConceptData {
  id: string
  name: string
  slug: string
  description: string | null
  description_berndeutsch: string | null
  target_audience: string | null
  channels: string[] | null
  menu_description: string | null
  price_range: string | null
  image_url: string | null
  events?: Array<{ id: string; title: string; start_date: string }>
}

export function ConceptDetail({ concept }: { concept: ConceptData }) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [images, setImages] = useState<StorageFile[]>([])
  const [deletingPath, setDeletingPath] = useState<string | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const loadImages = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/storage?bucket=concept-images&folder=${concept.slug}`
      )
      const data = await res.json()
      if (data.files) setImages(data.files)
    } catch {
      // ignore
    }
  }, [concept.slug])

  useEffect(() => {
    loadImages()
  }, [loadImages])

  function handleSave(formData: FormData) {
    startTransition(async () => {
      await updateConcept(concept.id, formData)
      setIsEditing(false)
      router.refresh()
    })
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.set("file", file)
        formData.set("bucket", "concept-images")
        formData.set("folder", concept.slug)

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })
        const data = await res.json()

        // Set first image as cover if none exists
        if (data.url && !concept.image_url && images.length === 0) {
          await updateConceptImage(concept.id, data.url)
          router.refresh()
        }
      }
      await loadImages()
    } catch (err) {
      console.error("Upload failed:", err)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function handleDelete(file: StorageFile) {
    setDeletingPath(file.path)
    try {
      await fetch("/api/storage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket: "concept-images", path: file.path }),
      })

      // If deleted image was cover, update cover
      if (concept.image_url === file.url) {
        const remaining = images.filter((i) => i.path !== file.path)
        const newCover = remaining.length > 0 ? remaining[0].url : null
        await updateConceptImage(concept.id, newCover)
        router.refresh()
      }

      await loadImages()
    } catch (err) {
      console.error("Delete failed:", err)
    } finally {
      setDeletingPath(null)
    }
  }

  async function handleSetCover(url: string) {
    await updateConceptImage(concept.id, url)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/konzepte">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-[#2C2C2C]">{concept.name}</h1>
          {concept.description && (
            <p className="mt-1 text-gray-500">{concept.description}</p>
          )}
        </div>
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

      {/* Image Gallery */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Bilder für Social Media ({images.length})
            </div>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {isUploading ? "Hochladen..." : "Bild hinzufügen"}
          </Button>
        </CardHeader>
        <CardContent>
          {images.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {images.map((file) => (
                <div key={file.path} className="group relative">
                  <div className="relative overflow-hidden rounded-lg border cursor-pointer" onClick={() => setLightboxUrl(file.url)}>
                    <img
                      src={file.url}
                      alt={file.name}
                      className="h-40 w-full object-cover"
                    />
                    {/* Cover badge */}
                    {concept.image_url === file.url && (
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-[#C5A572] text-white text-[10px]">
                          Cover
                        </Badge>
                      </div>
                    )}
                    {/* Overlay actions */}
                    <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/60 via-transparent to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                      {concept.image_url !== file.url && (
                        <button
                          type="button"
                          onClick={() => handleSetCover(file.url)}
                          className="rounded bg-white/90 px-2 py-1 text-[10px] font-medium text-gray-700 hover:bg-white"
                        >
                          Als Cover
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(file)}
                        disabled={deletingPath === file.path}
                        className="ml-auto rounded bg-red-500/90 p-1.5 text-white hover:bg-red-600"
                      >
                        {deletingPath === file.path ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {/* Upload placeholder tile */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 transition-colors hover:border-[#C5A572] hover:bg-[#C5A572]/5"
              >
                <Upload className="h-6 w-6 text-gray-400" />
                <span className="text-xs text-gray-500">Hinzufügen</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-48 w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-[#C5A572] hover:bg-[#C5A572]/5"
            >
              {isUploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-[#C5A572]" />
              ) : (
                <ImageIcon className="h-8 w-8 text-gray-400" />
              )}
              <span className="text-sm text-gray-500">
                {isUploading
                  ? "Wird hochgeladen..."
                  : "Konzept-Bilder hochladen (für Social Media)"}
              </span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageUpload}
          />
        </CardContent>
      </Card>

      {isEditing ? (
        /* Edit Mode */
        <form action={handleSave}>
          <Card>
            <CardHeader>
              <CardTitle>Konzept bearbeiten</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={concept.name}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_range">Preisbereich</Label>
                  <Input
                    id="price_range"
                    name="price_range"
                    defaultValue={concept.price_range || ""}
                    placeholder="z.B. CHF 25-45"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={3}
                  defaultValue={concept.description || ""}
                  placeholder="Worum geht es bei diesem Konzept?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description_berndeutsch">
                  Beschreibung (Berndeutsch)
                </Label>
                <Textarea
                  id="description_berndeutsch"
                  name="description_berndeutsch"
                  rows={3}
                  defaultValue={concept.description_berndeutsch || ""}
                  placeholder="Ds Konzept uf Bärndütsch..."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="target_audience">Zielgruppe</Label>
                  <Input
                    id="target_audience"
                    name="target_audience"
                    defaultValue={concept.target_audience || ""}
                    placeholder="z.B. Junge Berufstätige 25-40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="channels">Kanäle (kommagetrennt)</Label>
                  <Input
                    id="channels"
                    name="channels"
                    defaultValue={concept.channels?.join(", ") || ""}
                    placeholder="instagram, facebook, flyer"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="menu_description">Menu-Beschreibung</Label>
                <Textarea
                  id="menu_description"
                  name="menu_description"
                  rows={3}
                  defaultValue={concept.menu_description || ""}
                  placeholder="Was wird serviert?"
                />
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
        /* View Mode */
        <>
          {/* Beschreibung */}
          {concept.description && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500">Beschreibung</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{concept.description}</p>
              </CardContent>
            </Card>
          )}

          {concept.description_berndeutsch && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500">Beschreibung (Berndeutsch)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{concept.description_berndeutsch}</p>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {concept.target_audience && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500">
                    Zielgruppe
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{concept.target_audience}</p>
                </CardContent>
              </Card>
            )}

            {concept.menu_description && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500">Menu</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{concept.menu_description}</p>
                </CardContent>
              </Card>
            )}

            {concept.price_range && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500">
                    Preisbereich
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-semibold text-[#C5A572]">
                    {concept.price_range}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {concept.channels && concept.channels.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-500">Kanäle</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {concept.channels.map((ch: string) => (
                    <Badge key={ch} variant="secondary">
                      {ch}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Fullscreen Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 cursor-pointer"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/40 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={lightboxUrl}
            alt="Vergrösserte Ansicht"
            className="max-h-[95vh] max-w-[95vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Linked Events */}
      {concept.events && concept.events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Verknüpfte Events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {concept.events.map(
              (event: { id: string; title: string; start_date: string }) => (
                <Link
                  key={event.id}
                  href={`/kalender/${event.id}`}
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50"
                >
                  <Calendar className="h-4 w-4 text-[#C5A572]" />
                  <div className="flex-1">
                    <p className="font-medium">{event.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(
                        event.start_date + "T12:00:00"
                      ).toLocaleDateString("de-CH", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </Link>
              )
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
