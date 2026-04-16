// In-Memory Rate Limiter — sliding window per IP+scope.
// Not distributed — each Vercel Fluid Compute instance has its own state.
// That is intentionally acceptable: this is an internal tool and the goal
// is to stop accidental loops + casual abuse against paid AI endpoints.
// If Dakota outgrows that, swap this for Upstash/Redis.

import { NextRequest, NextResponse } from "next/server"

type Hit = { count: number; resetAt: number }
const store = new Map<string, Hit>()

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0].trim()
  return req.headers.get("x-real-ip") ?? "unknown"
}

export function rateLimit(
  req: NextRequest,
  opts: { scope: string; max: number; windowMs: number }
): NextResponse | null {
  const now = Date.now()
  const key = `${opts.scope}:${clientIp(req)}`
  const hit = store.get(key)

  if (!hit || hit.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + opts.windowMs })
    return null
  }

  if (hit.count >= opts.max) {
    const retryAfter = Math.ceil((hit.resetAt - now) / 1000)
    return NextResponse.json(
      { error: "Rate limit exceeded. Bitte später erneut versuchen." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(opts.max),
          "X-RateLimit-Reset": String(Math.ceil(hit.resetAt / 1000)),
        },
      }
    )
  }

  hit.count++
  return null
}

// Opportunistic GC so the map doesn't grow unbounded on long-lived instances.
if (typeof globalThis !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [key, hit] of store) if (hit.resetAt <= now) store.delete(key)
  }, 60_000).unref?.()
}
