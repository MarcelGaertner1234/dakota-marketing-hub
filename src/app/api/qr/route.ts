import { NextRequest, NextResponse } from "next/server"
import QRCode from "qrcode"
import { BRAND_COLORS } from "@/lib/brand"
import { rateLimit } from "@/lib/rate-limit"

const ALLOWED_HOSTS = new Set([
  "dakota-marketing-hub.vercel.app",
  "localhost",
  "127.0.0.1",
])

export async function GET(request: NextRequest) {
  const rl = rateLimit(request, { scope: "qr", max: 60, windowMs: 60_000 })
  if (rl) return rl

  const url = request.nextUrl.searchParams.get("url")
  const size = Math.min(Number(request.nextUrl.searchParams.get("size")) || 400, 1000)

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 })
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return NextResponse.json({ error: "Protocol not allowed" }, { status: 400 })
  }

  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 400 })
  }

  const png = await QRCode.toBuffer(parsed.toString(), {
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
