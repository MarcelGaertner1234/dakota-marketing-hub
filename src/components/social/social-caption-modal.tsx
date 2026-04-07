"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  X,
  Sparkles,
  RefreshCw,
  FileText,
  Hash,
} from "lucide-react"
import { updateSocialPost } from "@/lib/actions/social"

interface Props {
  postId: string
  postTitle: string
  platform: string
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

interface GeneratedResult {
  caption: string
  hashtags: string[]
}

/**
 * KI-Caption Modal für Social Media Posts.
 *
 * Anders als das Illustration-Modal: das Resultat wird NICHT automatisch
 * persistiert. Der Generator gibt Caption + Hashtags zurück, Marcel
 * sieht das Preview, kann regenerieren oder mit "Übernehmen" bestätigen
 * — erst dann wird der Post via updateSocialPost überschrieben.
 *
 * Das schützt Marcels existierende manuell geschriebene Captions vor
 * versehentlichem Überschreiben.
 */
export function SocialCaptionModal({
  postId,
  postTitle,
  platform,
  open,
  onClose,
  onSuccess,
}: Props) {
  const [hint, setHint] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GeneratedResult | null>(null)

  if (!open) return null

  async function handleGenerate() {
    setIsGenerating(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      if (hint.trim()) formData.set("hint", hint.trim())

      const res = await fetch(`/api/social/${postId}/generate-caption`, {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Generierung fehlgeschlagen")
      }

      setResult(data as GeneratedResult)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler")
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleApply() {
    if (!result) return
    setIsSaving(true)
    try {
      await updateSocialPost(postId, {
        caption: result.caption,
        hashtags: result.hashtags,
      })
      onSuccess()
      onClose()
      setHint("")
      setResult(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Speichern fehlgeschlagen")
    } finally {
      setIsSaving(false)
    }
  }

  function handleRetry() {
    setResult(null)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white dark:bg-gray-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#C5A572]" />
            <h2 className="text-xl font-semibold text-[#2C2C2C] dark:text-gray-100">
              KI-Caption generieren
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          Für <span className="font-medium">{postTitle}</span> ·{" "}
          <span className="capitalize">{platform}</span> — in der
          Dakota-Stimme, plattformspezifisch zugeschnitten.
        </p>

        {result ? (
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                <FileText className="h-3.5 w-3.5" />
                CAPTION
              </div>
              <div className="rounded-lg border border-[#E7DED1] bg-[#F8F6F3] dark:bg-gray-800 p-4">
                <p className="whitespace-pre-wrap text-sm text-[#2C2C2C] dark:text-gray-100">
                  {result.caption}
                </p>
              </div>
              <p className="mt-1 text-right text-[10px] text-gray-400">
                {result.caption.length} Zeichen
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                <Hash className="h-3.5 w-3.5" />
                HASHTAGS ({result.hashtags.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {result.hashtags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>

            <p className="text-center text-xs text-gray-500">
              Wenn du &quot;Übernehmen&quot; klickst, wird die bestehende
              Caption + Hashtags dieses Posts überschrieben.
            </p>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 p-3 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleRetry}
                disabled={isGenerating || isSaving}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Nochmal generieren
              </Button>
              <Button
                className="flex-1 bg-[#C5A572] hover:bg-[#A08050]"
                onClick={handleApply}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Speichern…
                  </>
                ) : (
                  "Übernehmen"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="hint">Hinweis für die KI (optional)</Label>
              <Textarea
                id="hint"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder="z.B. 'Fokus auf Familien', 'Erwähn das Wetter dieses Wochenende', 'eher locker und kurz'"
                rows={3}
                disabled={isGenerating}
              />
            </div>

            <div className="rounded-lg bg-[#F8F6F3] dark:bg-gray-800 p-3 text-xs text-[#5E5346] dark:text-gray-400">
              <div className="flex items-start gap-2">
                <FileText className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                <div>
                  Die KI nutzt automatisch Titel, verlinktes Konzept und Event
                  als Kontext. Plattform-spezifisch: kurze hooks für
                  Instagram/TikTok, längere Texte für Facebook. Kosten ~CHF
                  0.001, Dauer ~2 Sekunden.
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 p-3 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isGenerating}
              >
                Abbrechen
              </Button>
              <Button
                className="bg-[#C5A572] hover:bg-[#A08050]"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wird generiert…
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generieren
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
