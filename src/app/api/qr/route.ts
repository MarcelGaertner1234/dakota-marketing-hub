import { NextRequest, NextResponse } from "next/server"
import QRCode from "qrcode"
import { BRAND_COLORS } from "@/lib/brand"

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")
  const size = Math.min(Number(request.nextUrl.searchParams.get("size")) || 400, 1000)

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 })
  }

  const png = await QRCode.toBuffer(url, {
    width: size,
    margin: 2,
    color: { dark: BRAND_COLORS.ink, light: "#FFFFFF" },
    errorCorrectionLevel: "H",
  })

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  })
}
