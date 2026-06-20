import { NextRequest, NextResponse } from "next/server"

// Internal-tool guard for write / KI / upload / delete routes.
//
// This app has NO login, so this is deliberately a *lightweight* guard, not
// cryptographic auth. Two accepted callers:
//   (a) the dashboard — a same-origin browser request (Origin/Referer matches
//       an allowed host), or
//   (b) the MCP server (ChatGPT / Claude.ai) — an external call with no Origin,
//       bearing the shared INTERNAL_API_SECRET.
//
// The Origin check is a cost-DoS / casual-abuse guard (Origin headers are
// forgeable); the per-IP rateLimit() is the second line of defence. The secret
// is the real gate for the external (MCP) path. If INTERNAL_API_SECRET is unset,
// the secret path is closed and only same-origin is allowed (fail-closed).

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
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return result === 0
}

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin") || request.headers.get("referer")
  if (!origin) return false
  try {
    return ALLOWED_HOSTS.has(new URL(origin).host)
  } catch {
    return false
  }
}

function hasValidSecret(request: NextRequest): boolean {
  const secret = process.env.INTERNAL_API_SECRET
  if (!secret) return false
  const provided =
    request.headers.get("x-internal-secret") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    ""
  return !!provided && timingSafeEqual(provided, secret)
}

/**
 * 401 NextResponse if the request is neither same-origin nor carrying a valid
 * INTERNAL_API_SECRET; null when allowed. Use at the top of every
 * write/KI/upload/delete handler (after rateLimit):
 *
 *   const denied = requireSameOriginOrSecret(request)
 *   if (denied) return denied
 */
export function requireSameOriginOrSecret(
  request: NextRequest
): NextResponse | null {
  if (isSameOrigin(request) || hasValidSecret(request)) return null
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
