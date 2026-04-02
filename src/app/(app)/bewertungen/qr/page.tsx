"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { QrCode, Download, Copy } from "lucide-react"

export default function QRGeneratorPage() {
  const [baseUrl, setBaseUrl] = useState("https://dakota-hub.vercel.app")
  const [token] = useState(() =>
    Math.random().toString(36).substring(2, 10)
  )
  const reviewUrl = `${baseUrl}/bewerten/${token}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#2C2C2C]">QR-Code Generator</h1>
        <p className="text-gray-500">
          Erstelle QR-Codes für Tisch-Aufsteller
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Einstellungen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Base URL</Label>
              <Input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Bewertungs-Link</Label>
              <div className="flex gap-2">
                <Input value={reviewUrl} readOnly className="bg-gray-50" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigator.clipboard.writeText(reviewUrl)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Sobald Supabase verbunden ist, wird jeder QR-Code einen
              einzigartigen Token generieren und in der Datenbank speichern.
            </p>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Vorschau</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="flex h-48 w-48 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white">
              <div className="text-center">
                <QrCode className="mx-auto h-16 w-16 text-gray-400" />
                <p className="mt-2 text-xs text-gray-400">QR-Code Vorschau</p>
                <p className="text-xs text-gray-400">
                  (Supabase verbinden)
                </p>
              </div>
            </div>
            <div className="text-center">
              <h3 className="font-serif text-lg font-bold text-[#2C2C2C]">
                DAKOTA <span className="text-[#C5A572]">AIR LOUNGE</span>
              </h3>
              <p className="text-sm text-gray-500">
                Bewerte dein Erlebnis!
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Scanne den QR-Code und erhalte ein Goody
              </p>
            </div>
            <Button variant="outline" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              PDF für Tisch herunterladen
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
