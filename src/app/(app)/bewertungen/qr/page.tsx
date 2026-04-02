"use client"

/* eslint-disable @next/next/no-img-element */

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, Copy, RefreshCw, Printer, Plus, Check, Loader2 } from "lucide-react"
import QRCode from "qrcode"

const PRODUCTION_URL = "https://dakota-marketing-hub.vercel.app"

export default function QRGeneratorPage() {
  const [tokens, setTokens] = useState<string[]>([])
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState<string | null>(null)
  const [useProduction, setUseProduction] = useState(true)
  const printRef = useRef<HTMLDivElement>(null)

  const baseUrl = useProduction ? PRODUCTION_URL : "http://localhost:3002"

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
          urls[token] = await QRCode.toDataURL(reviewUrl, {
            width: 400,
            margin: 2,
            color: { dark: "#2C2C2C", light: "#FFFFFF" },
            errorCorrectionLevel: "M",
          })
        } catch { /* ignore */ }
      }
      setQrDataUrls(urls)
    }
    if (tokens.length > 0) generateQRs()
  }, [tokens, baseUrl])

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

      // Generate QR as data URL
      const qrDataUrl = await QRCode.toDataURL(reviewUrl, {
        width: 600,
        margin: 2,
        color: { dark: "#2C2C2C", light: "#FFFFFF" },
        errorCorrectionLevel: "M",
      })

      // Load QR image
      const qrImg = new Image()
      await new Promise<void>((resolve) => {
        qrImg.onload = () => resolve()
        qrImg.src = qrDataUrl
      })

      // Draw card on canvas
      const W = 900
      const H = 1200
      const canvas = document.createElement("canvas")
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext("2d")!

      // White background
      ctx.fillStyle = "#FFFFFF"
      ctx.fillRect(0, 0, W, H)

      // Gold accent line
      ctx.fillStyle = "#C5A572"
      ctx.fillRect(W / 2 - 60, 70, 120, 5)

      // DAKOTA
      ctx.fillStyle = "#2C2C2C"
      ctx.font = "bold 72px Georgia, serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText("DAKOTA", W / 2, 145)

      // AIR LOUNGE
      ctx.fillStyle = "#C5A572"
      ctx.font = "600 30px system-ui, sans-serif"
      ctx.fillText("A I R   L O U N G E", W / 2, 195)

      // MEIRINGEN
      ctx.fillStyle = "#BBBBBB"
      ctx.font = "400 18px system-ui, sans-serif"
      ctx.fillText("MEIRINGEN  ·  BERNER OBERLAND", W / 2, 235)

      // QR background box
      const qrSize = 440
      const qrBoxPad = 30
      const qrBoxW = qrSize + qrBoxPad * 2
      const qrBoxX = (W - qrBoxW) / 2
      const qrBoxY = 280
      ctx.fillStyle = "#F7F7F7"
      ctx.beginPath()
      ctx.roundRect(qrBoxX, qrBoxY, qrBoxW, qrBoxW, 20)
      ctx.fill()

      // QR code image
      ctx.drawImage(qrImg, qrBoxX + qrBoxPad, qrBoxY + qrBoxPad, qrSize, qrSize)

      // "Bewerte dein Erlebnis!"
      const textY = qrBoxY + qrBoxW + 50
      ctx.fillStyle = "#2C2C2C"
      ctx.font = "bold 38px system-ui, sans-serif"
      ctx.fillText("Bewerte dein Erlebnis!", W / 2, textY)

      // Subtitle
      ctx.fillStyle = "#999999"
      ctx.font = "400 24px system-ui, sans-serif"
      ctx.fillText("Scanne den QR-Code mit deinem Handy", W / 2, textY + 45)
      ctx.fillText("und erhalte ein Goody!", W / 2, textY + 80)

      // Bottom gold bar
      ctx.fillStyle = "#C5A572"
      ctx.fillRect(W / 2 - 60, H - 60, 120, 5)

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

    const cards = tokens.map((token, i) => {
      const qrUrl = qrDataUrls[token] || ""
      return `
        <div style="width:297px;height:420px;border:1px solid #e5e5e5;border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;page-break-inside:avoid;font-family:system-ui,-apple-system,sans-serif;background:white;">
          <div style="width:60px;height:3px;background:#C5A572;border-radius:2px;margin-bottom:16px;"></div>
          <h2 style="margin:0;font-size:22px;font-weight:800;color:#2C2C2C;letter-spacing:1px;">DAKOTA</h2>
          <h3 style="margin:2px 0 0;font-size:14px;font-weight:600;color:#C5A572;letter-spacing:3px;">AIR LOUNGE</h3>
          <p style="margin:4px 0 0;font-size:10px;color:#999;letter-spacing:1px;">MEIRINGEN · BERNER OBERLAND</p>
          <div style="margin:20px 0;padding:12px;background:#fafafa;border-radius:12px;">
            <img src="${qrUrl}" style="width:180px;height:180px;" alt="QR" />
          </div>
          <p style="margin:0;font-size:14px;font-weight:600;color:#2C2C2C;">Bewerte dein Erlebnis!</p>
          <p style="margin:6px 0 0;font-size:11px;color:#888;text-align:center;line-height:1.4;">Scanne den QR-Code mit deinem<br/>Handy und erhalte ein Goody 🎁</p>
          <div style="margin-top:16px;width:48px;height:3px;background:#C5A572;border-radius:2px;"></div>
        </div>
      `
    }).join("")

    printWindow.document.write(`
      <html>
        <head><title>Dakota Tischkarten</title></head>
        <body style="margin:0;padding:20px;display:flex;flex-wrap:wrap;gap:16px;justify-content:center;">
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
              <div id={`card-${index}`} className="bg-white p-6 flex flex-col items-center border-b">
                <div className="w-12 h-0.5 bg-[#C5A572] rounded mb-4" />
                <h2 className="text-xl font-extrabold text-[#2C2C2C] tracking-wide">DAKOTA</h2>
                <h3 className="text-xs font-semibold text-[#C5A572] tracking-[3px] mt-0.5">AIR LOUNGE</h3>
                <p className="text-[9px] text-gray-400 dark:text-gray-500 tracking-wider mt-1">MEIRINGEN · BERNER OBERLAND</p>

                <div className="my-4 rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                  {qrSrc ? (
                    <img src={qrSrc} alt={`QR Tisch ${index + 1}`} className="h-40 w-40" />
                  ) : (
                    <div className="h-40 w-40 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400 dark:text-gray-500" />
                    </div>
                  )}
                </div>

                <p className="text-sm font-semibold text-[#2C2C2C] dark:text-gray-100">Bewerte dein Erlebnis!</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center mt-1 leading-relaxed">
                  Scanne den QR-Code mit deinem<br />Handy und erhalte ein Goody 🎁
                </p>

                <div className="mt-3 w-12 h-0.5 bg-[#C5A572] rounded" />
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
