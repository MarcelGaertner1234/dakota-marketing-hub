import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { rateLimit } from "@/lib/rate-limit"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const ALLOWED_HOSTS = new Set([
  "dakota-marketing-hub.vercel.app",
  "localhost:3000",
  "localhost:3001",
  "localhost:3002",
  "127.0.0.1:3000",
])

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin") || request.headers.get("referer")
  if (!origin) return false
  try {
    const url = new URL(origin)
    return ALLOWED_HOSTS.has(url.host)
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const rl = rateLimit(request, { scope: "lead-action-done", max: 30, windowMs: 60_000 })
  if (rl) return rl

  // Accept either (a) a same-origin request from the dashboard, or
  // (b) an external call bearing the LEAD_ACTION_SECRET (for future email-link flows).
  const secret = process.env.LEAD_ACTION_SECRET
  const provided =
    request.headers.get("x-lead-action-token") ||
    request.nextUrl.searchParams.get("token") ||
    ""
  const hasValidToken = !!secret && !!provided && timingSafeEqual(provided, secret)

  if (!isSameOrigin(request) && !hasValidToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { leadId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { leadId } = body
  if (!leadId || !UUID_REGEX.test(leadId)) {
    return NextResponse.json({ error: "Invalid leadId" }, { status: 400 })
  }

  const supabase = createServerClient()
  const { error } = await supabase
    .from("leads")
    .update({ next_action: null, next_action_date: null, updated_at: new Date().toISOString() })
    .eq("id", leadId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
