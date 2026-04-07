// Legt den Storage-Bucket `story-illustrations` an (public).
// Idempotent: Überspringt wenn bereits vorhanden.

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envFile = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8')
const env = Object.fromEntries(
  envFile
    .split('\n')
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => {
      const idx = l.indexOf('=')
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^["']|["']$/g, '')]
    })
)

const sb = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
)

const BUCKET = 'story-illustrations'

const { data: existing } = await sb.storage.listBuckets()
const already = existing?.some((b) => b.name === BUCKET)

if (already) {
  console.log(`Bucket '${BUCKET}' existiert bereits — überspringe.`)
  process.exit(0)
}

const { data, error } = await sb.storage.createBucket(BUCKET, {
  public: true,
  fileSizeLimit: 10 * 1024 * 1024, // 10 MB
  allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
})

if (error) {
  console.error('FEHLER:', error.message)
  process.exit(1)
}

console.log(`Bucket '${BUCKET}' erstellt:`, data)
