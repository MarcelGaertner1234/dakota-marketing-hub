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
  Camera,
  Globe,
  Music2,
  Lightbulb,
  Hash,
  Pencil,
  Save,
  X,
  Upload,
  ImageIcon,
  Loader2,
  Trash2,
  Plus,
  Clock,
  FileText,
} from "lucide-react"
import Link from "next/link"
import { updateSocialPost } from "@/lib/actions/social"
import { useRouter } from "next/navigation"
import { PostStatusSelect } from "./post-status-select"

interface PostData {
  id: string
  title: string | null
  platform: string
  post_type: string
  caption: string | null
  hashtags: string[] | null
  scheduled_at: string | null
  published_at: string | null
  status: string
  series_order: number | null
  created_at: string
  event?: { id: string; title: string; start_date: string } | null
  concept?: { id: string; name: string } | null
}

interface StorageFile {
  name: string
  path: string
  url: string
}

const PLATFORM_CONFIG: Record<string, { label: string; color: string; Icon: typeof Camera }> = {
  instagram: { label: "Instagram", color: "#E1306C", Icon: Camera },
  facebook: { label: "Facebook", color: "#1877F2", Icon: Globe },
  tiktok: { label: "TikTok", color: "#000", Icon: Music2 },
}

export function PostDetail({ post }: { post: PostData }) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [images, setImages] = useState<StorageFile[]>([])
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [deletingPath, setDeletingPath] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const platform = PLATFORM_CONFIG[post.platform] || PLATFORM_CONFIG.instagram

  const folder = `post-${post.id.substring(0, 8)}`

  // Post-URL aus Caption extrahieren (gespeichert als [URL:...] am Ende)
  function extractPostUrl(caption: string | null): { text: string; url: string } {
    if (!caption) return { text: "", url: "" }
    const match = caption.match(/\[URL:(.*?)\]\s*$/)
    if (match) {
      return { text: caption.replace(/\s*\[URL:.*?\]\s*$/, ""), url: match[1] }
    }
    return { text: caption, url: "" }
  }

  const { text: captionText, url: postUrl } = extractPostUrl(post.caption)

  const loadImages = useCallback(async () => {
    try {
      const res = await fetch(`/api/storage?bucket=social-images&folder=${folder}`)
      const data = await res.json()
      if (data.files) setImages(data.files)
    } catch { /* ignore */ }
  }, [folder])

  useEffect(() => { loadImages() }, [loadImages])

  function handleSave(formData: FormData) {
    const hashtags = (formData.get("hashtags") as string)
      ?.split(",").map((t) => t.trim()).filter(Boolean) || []
    const captionVal = (formData.get("caption") as string) || ""
    const urlVal = (formData.get("post_url") as string)?.trim() || ""
    // Merge URL into caption as marker
    const fullCaption = urlVal
      ? `${captionVal}\n[URL:${urlVal}]`.trim()
      : captionVal || null
    startTransition(async () => {
      await updateSocialPost(post.id, {
        title: (formData.get("title") as string) || null,
        caption: fullCaption,
        hashtags: hashtags.length > 0 ? hashtags : null,
        scheduled_at: (formData.get("scheduled_at") as string) || null,
      })
      setIsEditing(false)
      router.refresh()
    })
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    setIsUploading(true)
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.set("file", file)
        fd.set("bucket", "social-images")
        fd.set("folder", folder)
        await fetch("/api/upload", { method: "POST", body: fd })
      }
      await loadImages()
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function handleDeleteImage(file: StorageFile) {
    setDeletingPath(file.path)
    try {
      await fetch("/api/storage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket: "social-images", path: file.path }),
      })
      await loadImages()
    } finally {
      setDeletingPath(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/social">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-[#2C2C2C] dark:text-gray-100">{post.title || "Ohne Titel"}</h1>
            <Badge className="text-white" style={{ backgroundColor: platform.color }}>
              {platform.label}
            </Badge>
          </div>
          <p className="mt-1 text-gray-500 dark:text-gray-400 capitalize">
            {post.post_type}{post.series_order ? ` · Teil ${post.series_order}` : ""}
          </p>
        </div>
        <Button
          variant={isEditing ? "outline" : "default"}
          className={isEditing ? "" : "bg-[#C5A572] hover:bg-[#A08050]"}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? <><X className="mr-2 h-4 w-4" /> Abbrechen</> : <><Pencil className="mr-2 h-4 w-4" /> Bearbeiten</>}
        </Button>
      </div>

      {/* Status + Deadline + Platform */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
            <PostStatusSelect postId={post.id} currentStatus={post.status} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Calendar className="h-5 w-5 text-[#C5A572]" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Geplant für</p>
              <p className="font-medium">
                {post.scheduled_at
                  ? new Date(post.scheduled_at).toLocaleDateString("de-CH", { weekday: "short", day: "numeric", month: "long", year: "numeric" })
                  : "Noch nicht geplant"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <platform.Icon className="h-5 w-5" style={{ color: platform.color }} />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Plattform</p>
              <p className="font-medium">{platform.label}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Image Gallery */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Bilder & Medien ({images.length})
            </div>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            {isUploading ? "Hochladen..." : "Bild hinzufügen"}
          </Button>
        </CardHeader>
        <CardContent>
          {images.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {images.map((file) => (
                <div key={file.path} className="group relative">
                  <div className="relative overflow-hidden rounded-lg border cursor-pointer" onClick={() => setLightboxUrl(file.url)}>
                    <img src={file.url} alt={file.name} className="h-36 w-full object-cover" />
                    <div className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-black/50 via-transparent to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDeleteImage(file) }}
                        disabled={deletingPath === file.path}
                        className="rounded bg-red-500/90 p-1.5 text-white hover:bg-red-600"
                      >
                        {deletingPath === file.path ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-36 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 transition-colors hover:border-[#C5A572] hover:bg-[#C5A572]/5"
              >
                <Upload className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">Hinzufügen</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 transition-colors hover:border-[#C5A572] hover:bg-[#C5A572]/5"
            >
              {isUploading ? <Loader2 className="h-6 w-6 animate-spin text-[#C5A572]" /> : <ImageIcon className="h-6 w-6 text-gray-400 dark:text-gray-500" />}
              <span className="text-sm text-gray-500 dark:text-gray-400">{isUploading ? "Hochladen..." : "Bilder für den Post hochladen"}</span>
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleImageUpload} />
        </CardContent>
      </Card>

      {isEditing ? (
        <form action={handleSave}>
          <Card>
            <CardHeader><CardTitle>Post bearbeiten</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Titel</Label>
                  <Input id="title" name="title" defaultValue={post.title || ""} placeholder="Post-Titel" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduled_at">Deadline / Veröffentlichungsdatum</Label>
                  <Input
                    id="scheduled_at"
                    name="scheduled_at"
                    type="datetime-local"
                    defaultValue={post.scheduled_at ? post.scheduled_at.slice(0, 16) : ""}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="caption">Caption & Anweisungen</Label>
                <Textarea id="caption" name="caption" rows={5} defaultValue={captionText} placeholder="Post-Text, Anweisungen für die Person die postet..." />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hashtags">Hashtags (kommagetrennt)</Label>
                  <Input id="hashtags" name="hashtags" defaultValue={post.hashtags?.join(", ") || ""} placeholder="dakota, meiringen, airlounge" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="post_url">Link zum veröffentlichten Post</Label>
                  <Input id="post_url" name="post_url" type="url" defaultValue={postUrl} placeholder="https://instagram.com/p/..." />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Abbrechen</Button>
                <Button type="submit" className="bg-[#C5A572] hover:bg-[#A08050]" disabled={isPending}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Speichern
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      ) : (
        <>
          {/* Post-URL */}
          {postUrl && (
            <Card className="border-[#C5A572]/30 bg-[#C5A572]/5">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#C5A572]/20">
                  <platform.Icon className="h-5 w-5" style={{ color: platform.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Link zum Post</p>
                  <a
                    href={postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-[#C5A572] hover:underline truncate block"
                  >
                    {postUrl}
                  </a>
                </div>
                <a href={postUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">Öffnen</Button>
                </a>
              </CardContent>
            </Card>
          )}

          {/* Caption */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> Caption & Anweisungen</CardTitle></CardHeader>
            <CardContent>
              {captionText ? (
                <p className="text-sm whitespace-pre-wrap">{captionText}</p>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500 italic">Noch keine Caption. Klick auf &quot;Bearbeiten&quot; um Text und Anweisungen hinzuzufügen.</p>
              )}
            </CardContent>
          </Card>

          {/* Hashtags */}
          {post.hashtags && post.hashtags.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Hash className="h-4 w-4" /> Hashtags</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {post.hashtags.map((tag: string) => (
                    <Badge key={tag} variant="secondary">#{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Linked Event / Concept */}
      {(post.event || post.concept) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {post.event && (
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div><p className="text-xs text-gray-500 dark:text-gray-400">Verknüpftes Event</p><p className="font-medium">{post.event.title}</p></div>
                <Link href={`/kalender/${post.event.id}`}><Button variant="outline" size="sm">Ansehen</Button></Link>
              </CardContent>
            </Card>
          )}
          {post.concept && (
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-[#C5A572]" />
                  <div><p className="text-xs text-gray-500 dark:text-gray-400">Konzept</p><p className="font-medium">{post.concept.name}</p></div>
                </div>
                <Link href={`/konzepte/${post.concept.id}`}><Button variant="outline" size="sm">Ansehen</Button></Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Timestamps */}
      <Card>
        <CardContent className="flex gap-6 p-4 text-xs text-gray-400 dark:text-gray-500">
          <span><Clock className="mr-1 inline h-3 w-3" />Erstellt: {new Date(post.created_at).toLocaleDateString("de-CH")}</span>
          {post.published_at && <span>Veröffentlicht: {new Date(post.published_at).toLocaleDateString("de-CH")}</span>}
        </CardContent>
      </Card>

      {/* Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 cursor-pointer" onClick={() => setLightboxUrl(null)}>
          <button type="button" onClick={() => setLightboxUrl(null)} className="absolute top-4 right-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/40 transition-colors">
            <X className="h-6 w-6" />
          </button>
          <img src={lightboxUrl} alt="Vergrössert" className="max-h-[95vh] max-w-[95vw] object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
