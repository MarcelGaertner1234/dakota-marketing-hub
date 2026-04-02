import { NextRequest, NextResponse } from "next/server"
import QRCode from "qrcode"

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")
  const size = Math.min(Number(request.nextUrl.searchParams.get("size")) || 400, 1000)

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 })
  }

  const png = await QRCode.toBuffer(url, {
    width: size,
    margin: 2,
    color: { dark: "#2C2C2C", light: "#FFFFFF" },
    errorCorrectionLevel: "M",
  })

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  })
}
