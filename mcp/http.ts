// Shared header helper for MCP tools that call the deployed Vercel KI routes.
//
// Those routes are guarded by requireSameOriginOrSecret(). The MCP server is an
// external (non-same-origin) caller, so every request must carry the shared
// INTERNAL_API_SECRET. It is loaded into process.env from .env.local by
// supabase.ts (loadLocalEnvFiles) and must also be set in Vercel's project env.
//
// If the secret is unset (e.g. local dev without it), no header is added — the
// route then falls back to same-origin only, which the MCP server can't satisfy,
// so the call gets a clear 401 instead of silently succeeding.

export function internalHeaders(
  extra: Record<string, string> = {}
): Record<string, string> {
  const secret = process.env.INTERNAL_API_SECRET
  if (secret) return { ...extra, "x-internal-secret": secret }
  return { ...extra }
}
