"use client"

/* eslint-disable @next/next/no-img-element */

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { compressImage } from "@/lib/utils/compress-image"
import {
  Upload,
  Loader2,
  X,
  Sparkles,
  ImageIcon,
  RefreshCw,
} from "lucide-react"

interface Props {
  tischkarteId: string
  guestName: string
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

/**
 * KI-Illustration Modal für Tischkarten — funktional identisch zum
 * Stories-Modal, aber gegen die /api/tischkarten/[id]/generate-illustration
 * Endpoint. Bewusst geklont statt generic refactored: null Risiko für
 * den Stories-Stack.
 */
export function TischkarteIllustrationModal({
  tischkarteId,
  guestName,
  open,
  onClose,
  onSuccess,
}: Props) {
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [hint, setHint] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setResultUrl(null)
    setIsCompressing(true)

    try {
      const compressed = await compressImage(file)
      setPhoto(compressed)
      const reader = new FileReader()
      reader.onload = () => setPhotoPreview(reader.result as string)
      reader.readAsDataURL(compressed)
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Foto-Verarbeitung fehlgeschlagen"
      )
      setPhoto(null)
      setPhotoPreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    } finally {
      setIsCompressing(false)
    }
  }

  function handleClearPhoto() {
    setPhoto(null)
    setPhotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleGenerate() {
    setIsGenerating(true)
    setError(null)
    setResultUrl(null)

    try {
      const formData = new FormData()
      if (photo) formData.set("file", photo)
      if (hint.trim()) formData.set("hint", hint.trim())

      const res = await fetch(
        `/api/tischkarten/${tischkarteId}/generate-illustration`,
        {
          method: "POST",
          body: formData,
        }
      )

      if (!res.ok) {
        let msg: string
        try {
          const data = await res.json()
          msg = data.error || `Fehler ${res.status}`
        } catch {
          msg =
            res.status === 413
              ? "Foto zu groß — bitte kleineres Bild wählen (max ~4 MB)."
              : `Fehler ${res.status}: ${res.statusText || "Unbekannt"}`
        }
        throw new Error(msg)
      }

      const data = await res.json()
      setResultUrl(data.url)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler")
    } finally {
      setIsGenerating(false)
    }
  }

  function handleKeep() {
    onSuccess()
    onClose()
    setPhoto(null)
    setPhotoPreview(null)
    setHint("")
    setResultUrl(null)
  }

  function handleRetry() {
    setResultUrl(null)
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
              KI-Illustration generieren
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          Für <span className="font-medium">{guestName}</span> — eigenes
          KI-Motiv im Dakota-Stil. Foto optional, reines Text-zu-Bild auch
          möglich.
        </p>

        {resultUrl ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-[#E7DED1] bg-[#F8F6F3] p-4">
              <img
                src={resultUrl}
                alt="Generierte Illustration"
                className="mx-auto max-h-[50vh] w-auto object-contain"
              />
            </div>
            <p className="text-center text-xs text-gray-500">
              Wenn du &quot;Behalten&quot; klickst, wird dieses Bild als
              Illustration der Tischkarte gespeichert.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleRetry}
                disabled={isGenerating}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Nochmal generieren
              </Button>
              <Button
                className="flex-1 bg-[#C5A572] hover:bg-[#A08050]"
                onClick={handleKeep}
              >
                Behalten
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Foto (optional)</Label>
              {isCompressing ? (
                <div className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                  <Loader2 className="h-6 w-6 animate-spin text-[#C5A572]" />
                  <span className="text-sm text-gray-500">
                    Foto wird verarbeitet…
                  </span>
                </div>
              ) : photoPreview ? (
                <div className="relative rounded-lg border border-[#E7DED1] bg-[#F8F6F3] p-2">
                  <img
                    src={photoPreview}
                    alt="Vorschau"
                    className="mx-auto max-h-48 w-auto rounded object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleClearPhoto}
                    className="absolute top-2 right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 transition-colors hover:border-[#C5A572] hover:bg-[#C5A572]/5"
                >
                  <Upload className="h-6 w-6 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    Foto hochladen (oder weglassen für Text-zu-Bild)
                  </span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelect}
              />
            </div>

            <div>
              <Label htmlFor="hint">Stil-Hinweis (optional)</Label>
              <Input
                id="hint"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder="z.B. 'mehr Kerzen', 'romantischer', 'mit Bergblick'"
                disabled={isGenerating}
              />
            </div>

            <div className="rounded-lg bg-[#F8F6F3] dark:bg-gray-800 p-3 text-xs text-[#5E5346] dark:text-gray-400">
              <div className="flex items-start gap-2">
                <ImageIcon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                <div>
                  Kosten pro Generierung: ~CHF 0.18. Dauer: 15–30 Sekunden.
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
                disabled={isGenerating || isCompressing}
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
