"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, Copy, RefreshCw } from "lucide-react"

export default function QRGeneratorPage() {
  const [baseUrl, setBaseUrl] = useState("")
  const [token, setToken] = useState(() =>
    Math.random().toString(36).substring(2, 10)
  )

  useEffect(() => {
    setBaseUrl(window.location.origin)
  }, [])

  const reviewUrl = `${baseUrl}/bewerten/${token}`
  const qrApiUrl = `${baseUrl}/api/qr?url=${encodeURIComponent(reviewUrl)}`

  function regenerateToken() {
    setToken(Math.random().toString(36).substring(2, 10))
  }

  async function downloadQR() {
    const res = await fetch(qrApiUrl)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `dakota-qr-${token}.png`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#2C2C2C]">QR-Code Generator</h1>
        <p className="text-gray-500">Erstelle QR-Codes für Tisch-Aufsteller</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Einstellungen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Bewertungs-Link</Label>
              <div className="flex gap-2">
                <Input value={reviewUrl} readOnly className="bg-gray-50 text-xs" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigator.clipboard.writeText(reviewUrl)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button variant="outline" onClick={regenerateToken} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Neuen Token generieren
            </Button>
            <p className="text-xs text-gray-500">
              Jeder QR-Code hat einen einzigartigen Token. So kannst du pro Tisch
              einen eigenen Code erstellen.
            </p>
          </CardContent>
        </Card>

        {/* QR Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Vorschau</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {baseUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrApiUrl}
                alt="QR Code"
                className="h-48 w-48 rounded-xl border-2 border-gray-200"
              />
            )}
            <div className="text-center">
              <h3 className="font-serif text-lg font-bold text-[#2C2C2C]">
                DAKOTA <span className="text-[#C5A572]">AIR LOUNGE</span>
              </h3>
              <p className="text-sm text-gray-500">Bewerte dein Erlebnis!</p>
              <p className="mt-1 text-xs text-gray-400">
                Scanne den QR-Code und erhalte ein Goody
              </p>
            </div>
            <div className="flex gap-2 w-full">
              <Button onClick={downloadQR} className="flex-1 bg-[#C5A572] hover:bg-[#A08050]">
                <Download className="mr-2 h-4 w-4" />
                QR-Code herunterladen
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
