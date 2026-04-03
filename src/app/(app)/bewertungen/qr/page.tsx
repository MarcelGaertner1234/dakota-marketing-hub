"use client"

/* eslint-disable @next/next/no-img-element */

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, Copy, RefreshCw, Printer, Plus, Check, Loader2 } from "lucide-react"
import QRCode from "qrcode"
import { BRAND_ASSETS, BRAND_COLORS } from "@/lib/brand"

const PRODUCTION_URL = "https://dakota-marketing-hub.vercel.app"
const FONT_IMPORT_URL = "https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;500;600;700&family=Calistoga&display=swap"

const imageCache = new Map<string, Promise<HTMLImageElement>>()

function loadImage(src: string) {
  const cached = imageCache.get(src)
  if (cached) return cached

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Image could not be loaded: ${src}`))
    image.src = src
  })

  imageCache.set(src, promise)
  return promise
}

async function ensureBrandFonts() {
  if (typeof document === "undefined" || !("fonts" in document)) {
    return
  }

  await Promise.all([
    document.fonts.load("400 54px Calistoga"),
    document.fonts.load("300 26px Assistant"),
    document.fonts.ready,
  ])
}

async function createBrandedQrDataUrl(url: string, size: number, logoSrc: string) {
  const qrDataUrl = await QRCode.toDataURL(url, {
    width: size,
    margin: 2,
    color: { dark: BRAND_COLORS.ink, light: "#FFFFFF" },
    errorCorrectionLevel: "H",
  })

  const [qrImage, logoImage] = await Promise.all([
    loadImage(qrDataUrl),
    loadImage(logoSrc),
  ])

  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    return qrDataUrl
  }

  ctx.fillStyle = "#FFFFFF"
  ctx.fillRect(0, 0, size, size)
  ctx.drawImage(qrImage, 0, 0, size, size)

  const logoSize = Math.round(size * 0.24)
  const logoPadding = Math.round(size * 0.03)
  const badgeX = (size - logoSize) / 2
  const badgeY = (size - logoSize) / 2

  ctx.fillStyle = "#FFFFFF"
  ctx.beginPath()
  ctx.roundRect(
    badgeX - logoPadding,
    badgeY - logoPadding,
    logoSize + logoPadding * 2,
    logoSize + logoPadding * 2,
    Math.round(size * 0.04)
  )
  ctx.fill()

  ctx.strokeStyle = "rgba(197, 165, 114, 0.35)"
  ctx.lineWidth = Math.max(2, Math.round(size * 0.006))
  ctx.stroke()
  ctx.drawImage(logoImage, badgeX, badgeY, logoSize, logoSize)

  return canvas.toDataURL("image/png")
}

export default function QRGeneratorPage() {
  const [tokens, setTokens] = useState<string[]>([])
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState<string | null>(null)
  const [useProduction, setUseProduction] = useState(true)
  const printRef = useRef<HTMLDivElement>(null)

  const baseUrl = useProduction ? PRODUCTION_URL : "http://localhost:3002"
  const assetBaseUrl = typeof window === "undefined" ? PRODUCTION_URL : window.location.origin
  const hotelLogoUrl = `${assetBaseUrl}${BRAND_ASSETS.hotelLogo}`
  const airLoungeLogoUrl = `${assetBaseUrl}${BRAND_ASSETS.airLoungeLogo}`

  useEffect(() => {
    if (tokens.length === 0) {
      setTokens([Math.random().toString(36).substring(2, 10)])
    }
  }, [tokens.length])

  // Generate QR data URLs whenever tokens or baseUrl change
  useEffect(() => {
    async function generateQRs() {
      const urls: Record<string, string> = {}
      for (const token of tokens) {
        const reviewUrl = `${baseUrl}/bewerten/${token}`
        try {
          urls[token] = await createBrandedQrDataUrl(reviewUrl, 400, hotelLogoUrl)
        } catch { /* ignore */ }
      }
      setQrDataUrls(urls)
    }
    if (tokens.length > 0) generateQRs()
  }, [tokens, baseUrl, hotelLogoUrl])

  function addToken() {
    setTokens([...tokens, Math.random().toString(36).substring(2, 10)])
  }

  function regenerateToken(index: number) {
    const newTokens = [...tokens]
    newTokens[index] = Math.random().toString(36).substring(2, 10)
    setTokens(newTokens)
  }

  function removeToken(index: number) {
    if (tokens.length <= 1) return
    setTokens(tokens.filter((_, i) => i !== index))
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url)
    setCopied(url)
    setTimeout(() => setCopied(null), 2000)
  }

  const [downloading, setDownloading] = useState<number | null>(null)

  async function downloadCard(token: string, index: number) {
    setDownloading(index)
    try {
      const reviewUrl = `${baseUrl}/bewerten/${token}`
      const qrDataUrl = await createBrandedQrDataUrl(reviewUrl, 600, hotelLogoUrl)
      await ensureBrandFonts()

      const [qrImg, hotelLogoImg, airLoungeLogoImg] = await Promise.all([
        loadImage(qrDataUrl),
        loadImage(hotelLogoUrl),
        loadImage(airLoungeLogoUrl),
      ])

      // Draw card on canvas
      const W = 900
      const H = 1200
      const canvas = document.createElement("canvas")
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext("2d")!

      // Background
      ctx.fillStyle = "#FFFFFF"
      ctx.fillRect(0, 0, W, H)

      // Brand header
      const brandBoxX = 84
      const brandBoxY = 44
      const brandBoxW = W - 168
      const brandBoxH = 222
      ctx.fillStyle = BRAND_COLORS.paper
      ctx.beginPath()
      ctx.roundRect(brandBoxX, brandBoxY, brandBoxW, brandBoxH, 34)
      ctx.fill()

      const hotelLogoSize = 118
      ctx.drawImage(hotelLogoImg, W / 2 - hotelLogoSize / 2, 58, hotelLogoSize, hotelLogoSize)

      const airLogoW = 372
      const airLogoH = airLogoW * (airLoungeLogoImg.naturalHeight / airLoungeLogoImg.naturalWidth)
      ctx.drawImage(airLoungeLogoImg, (W - airLogoW) / 2, 154, airLogoW, airLogoH)

      ctx.fillStyle = BRAND_COLORS.gold
      ctx.fillRect(W / 2 - 84, 250, 168, 4)

      // QR background box
      const qrSize = 430
      const qrBoxPad = 36
      const qrBoxW = qrSize + qrBoxPad * 2
      const qrBoxX = (W - qrBoxW) / 2
      const qrBoxY = 316
      ctx.fillStyle = BRAND_COLORS.paperMuted
      ctx.beginPath()
      ctx.roundRect(qrBoxX, qrBoxY, qrBoxW, qrBoxW, 28)
      ctx.fill()

      // QR code image
      ctx.drawImage(qrImg, qrBoxX + qrBoxPad, qrBoxY + qrBoxPad, qrSize, qrSize)

      // "Bewerte dein Erlebnis!"
      const textY = qrBoxY + qrBoxW + 74
      ctx.fillStyle = BRAND_COLORS.ink
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.font = "400 50px Calistoga, serif"
      ctx.fillText("Bewerte dein Erlebnis!", W / 2, textY)

      // Subtitle
      ctx.fillStyle = "#756A5C"
      ctx.font = "300 24px Assistant, sans-serif"
      ctx.fillText("Scanne den QR-Code mit deinem Handy", W / 2, textY + 48)
      ctx.fillText("und sichere dir dein Dakota-Goody", W / 2, textY + 84)

      // Bottom gold bar
      ctx.fillStyle = BRAND_COLORS.gold
      ctx.fillRect(W / 2 - 72, H - 72, 144, 4)
      ctx.fillStyle = "#756A5C"
      ctx.font = "300 18px Assistant, sans-serif"
      ctx.fillText("Dakota Air Lounge · Meiringen", W / 2, H - 38)

      // Download
      const a = document.createElement("a")
      a.href = canvas.toDataURL("image/png")
      a.download = `dakota-tischkarte-${index + 1}.png`
      a.click()
    } finally {
      setDownloading(null)
    }
  }

  function printCards() {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const cards = tokens.map((token) => {
      const qrUrl = qrDataUrls[token] || ""
      return `
        <div style="width:297px;height:420px;border:1px solid #E7DED1;border-radius:24px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:20px;page-break-inside:avoid;font-family:'Assistant',sans-serif;font-weight:300;background:white;box-sizing:border-box;">
          <div style="width:100%;display:flex;flex-direction:column;align-items:center;gap:8px;background:#F8F6F3;border-radius:18px;padding:14px 12px 12px;">
            <div style="display:flex;align-items:center;justify-content:center;border:1px solid #E7DED1;border-radius:999px;background:white;padding:4px;">
              <img src="${hotelLogoUrl}" style="width:54px;height:54px;object-fit:contain;" alt="Dakota Hotel" />
            </div>
            <img src="${airLoungeLogoUrl}" style="width:148px;height:auto;object-fit:contain;" alt="Air Lounge" />
          </div>
          <div style="margin:18px 0 14px;padding:12px;background:#F3EEE6;border-radius:18px;">
            <img src="${qrUrl}" style="width:180px;height:180px;" alt="QR" />
          </div>
          <p style="margin:0;font-family:'Calistoga',serif;font-size:22px;color:#2C2C2C;text-align:center;">Bewerte dein Erlebnis!</p>
          <p style="margin:8px 0 0;font-size:11px;color:#756A5C;text-align:center;line-height:1.45;">Scanne den QR-Code mit deinem<br/>Handy und sichere dir dein Dakota-Goody</p>
          <div style="margin-top:14px;width:52px;height:3px;background:#C5A572;border-radius:999px;"></div>
          <p style="margin:12px 0 0;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#7C6951;">Dakota Air Lounge · Meiringen</p>
        </div>
      `
    }).join("")

    printWindow.document.write(`
      <html>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="${FONT_IMPORT_URL}" rel="stylesheet">
          <title>Dakota Tischkarten</title>
        </head>
        <body style="margin:0;padding:20px;display:flex;flex-wrap:wrap;gap:16px;justify-content:center;background:#F8F6F3;">
          ${cards}
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 500);
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="space-y-6" suppressHydrationWarning>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2C2C2C] dark:text-gray-100">QR-Code Generator</h1>
          <p className="text-gray-500 dark:text-gray-400">Tischkarten mit QR-Codes für Gäste-Bewertungen</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={addToken}>
            <Plus className="mr-2 h-4 w-4" />
            Neue Karte
          </Button>
          <Button onClick={printCards} className="bg-[#C5A572] hover:bg-[#A08050]">
            <Printer className="mr-2 h-4 w-4" />
            Drucken
          </Button>
        </div>
      </div>

      {/* URL Setting */}
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <Label className="shrink-0 text-sm">Basis-URL:</Label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setUseProduction(true)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                useProduction ? "border-[#C5A572] bg-[#C5A572]/10 text-[#C5A572]" : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              Production (Vercel)
            </button>
            <button
              type="button"
              onClick={() => setUseProduction(false)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                !useProduction ? "border-[#C5A572] bg-[#C5A572]/10 text-[#C5A572]" : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              Localhost (Test)
            </button>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">{baseUrl}</span>
        </CardContent>
      </Card>

      {/* Cards Grid */}
      <div ref={printRef} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tokens.map((token, index) => {
          const reviewUrl = `${baseUrl}/bewerten/${token}`
          const qrSrc = qrDataUrls[token]

          return (
            <Card key={token} className="overflow-hidden">
              {/* Printable Card Preview */}
              <div
                id={`card-${index}`}
                className="flex flex-col items-center border-b bg-white p-5"
              >
                <div className="w-full rounded-[1.25rem] bg-[#F8F6F3] px-4 py-4">
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-full border border-[#E7DED1] bg-white p-1.5 shadow-sm">
                      <img
                        src={BRAND_ASSETS.hotelLogo}
                        alt="Dakota Hotel"
                        className="h-16 w-16 object-contain"
                      />
                    </div>
                    <img
                      src={BRAND_ASSETS.airLoungeLogo}
                      alt="Air Lounge"
                      className="h-auto w-40 object-contain"
                    />
                  </div>
                </div>

                <div className="my-5 rounded-[1.25rem] bg-[#F3EEE6] p-3 shadow-inner">
                  {qrSrc ? (
                    <img src={qrSrc} alt={`QR Tisch ${index + 1}`} className="h-40 w-40" />
                  ) : (
                    <div className="flex h-40 w-40 items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400 dark:text-gray-500" />
                    </div>
                  )}
                </div>

                <p className="font-heading text-xl text-[#2C2C2C] dark:text-gray-100">Bewerte dein Erlebnis!</p>
                <p className="mt-2 text-center text-[11px] leading-relaxed text-[#756A5C] dark:text-gray-400">
                  Scanne den QR-Code mit deinem<br />Handy und sichere dir dein Dakota-Goody
                </p>

                <div className="mt-4 h-0.5 w-12 rounded bg-[#C5A572]" />
                <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-[#7C6951]">
                  Dakota Air Lounge · Meiringen
                </p>
              </div>

              {/* Actions */}
              <CardContent className="p-3 space-y-2">
                <div className="flex gap-1.5">
                  <Input value={reviewUrl} readOnly className="bg-gray-50 dark:bg-gray-800 text-[10px] h-8" />
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 h-8"
                    onClick={() => copyUrl(reviewUrl)}
                  >
                    {copied === reviewUrl ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => regenerateToken(index)}>
                    <RefreshCw className="mr-1 h-3 w-3" /> Neuer Token
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 h-8 text-xs bg-[#C5A572] hover:bg-[#A08050]"
                    onClick={() => downloadCard(token, index)}
                    disabled={downloading === index}
                  >
                    {downloading === index ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Download className="mr-1 h-3 w-3" />}
                    Karte laden
                  </Button>
                  {tokens.length > 1 && (
                    <Button variant="outline" size="sm" className="h-8 text-xs text-red-500 dark:text-red-400 hover:text-red-600" onClick={() => removeToken(index)}>
                      ✕
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
        Tipp: Erstelle pro Tisch eine eigene Karte. So kannst du später nachvollziehen, welcher Tisch die Bewertung abgegeben hat.
      </p>
    </div>
  )
}
