/**
 * Client-side image compression helper.
 *
 * Why: Vercel Functions have a ~4.5 MB request body limit enforced by the
 * edge proxy BEFORE the function runs. iPhone photos are often 4–10 MB, so
 * raw uploads trigger `413 Payload Too Large` — which Safari surfaces as the
 * cryptic DOMException "The string did not match the expected pattern." when
 * the client tries to parse the HTML error body as JSON.
 *
 * This utility downscales + re-encodes images as JPEG client-side so uploads
 * consistently land well under the limit. Browser-only (uses canvas +
 * createImageBitmap — do not import from server code).
 */

export interface CompressImageOptions {
  /** Maximum width or height in pixels. Default 2048. */
  maxDimension?: number
  /** JPEG quality, 0–1. Default 0.85. */
  quality?: number
  /** Files smaller than this (bytes) are returned unchanged. Default 1 MB. */
  skipThreshold?: number
}

/**
 * Downscale an image File and re-encode as JPEG. Returns a new File, or the
 * original if it is already small enough / compression wouldn't help.
 */
export async function compressImage(
  file: File,
  options: CompressImageOptions = {}
): Promise<File> {
  const {
    maxDimension = 2048,
    quality = 0.85,
    skipThreshold = 1024 * 1024,
  } = options

  if (file.size <= skipThreshold) return file

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    })
  } catch {
    throw new Error(
      `Bild konnte nicht dekodiert werden (${file.type || "unbekannter Typ"}). Nutze JPG oder PNG.`
    )
  }

  try {
    const { width: srcW, height: srcH } = bitmap
    const scale = Math.min(1, maxDimension / Math.max(srcW, srcH))
    const dstW = Math.max(1, Math.round(srcW * scale))
    const dstH = Math.max(1, Math.round(srcH * scale))

    const canvas = document.createElement("canvas")
    canvas.width = dstW
    canvas.height = dstH
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas-Context nicht verfügbar")
    ctx.drawImage(bitmap, 0, 0, dstW, dstH)

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", quality)
    })
    if (!blob) throw new Error("Bild-Komprimierung fehlgeschlagen")

    // If the re-encode didn't shrink it (already tiny or PNG with transparency),
    // keep the original.
    if (blob.size >= file.size) return file

    const baseName = file.name.replace(/\.[^.]+$/, "") || "image"
    return new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    })
  } finally {
    bitmap.close?.()
  }
}
