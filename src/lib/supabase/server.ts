import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let cached: SupabaseClient | null = null
let warned = false

/** Server-Client (Service-Key). Wird pro Prozess einmal erstellt und wiederverwendet. */
export function createServerClient(): SupabaseClient {
  if (cached) return cached
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error("Supabase-Umgebungsvariablen fehlen (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_KEY)")
  if (!process.env.SUPABASE_SERVICE_KEY && !warned) {
    warned = true
    console.warn("[supabase] SUPABASE_SERVICE_KEY fehlt – Fallback auf Anon-Key")
  }
  cached = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  return cached
}
