// Diagnose-Script: Prüft ob Stories-Tabelle existiert + ob DDL via RPC möglich ist
// Führt KEINE Änderungen durch — nur Reads.

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

const url = env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
console.log('Supabase URL:', url)
console.log('Service key set:', !!serviceKey, '(length:', serviceKey?.length, ')')

const sb = createClient(url, serviceKey, { auth: { persistSession: false } })

// Test 1: Does `stories` table already exist?
console.log('\n[1] Check stories table...')
const { data: storiesCheck, error: storiesErr } = await sb
  .from('stories')
  .select('id, title')
  .limit(3)
if (storiesErr) {
  console.log('  stories table: NOT FOUND (', storiesErr.message, ')')
} else {
  console.log('  stories table: EXISTS, rows =', storiesCheck?.length)
  storiesCheck?.forEach((s) => console.log('    -', s.id, s.title))
}

// Test 2: Does `exec_sql` RPC exist? (common Supabase admin helper)
console.log('\n[2] Check exec_sql RPC...')
const { error: execErr } = await sb.rpc('exec_sql', { sql: 'SELECT 1' })
if (execErr) {
  console.log('  exec_sql: NOT AVAILABLE (', execErr.message, ')')
} else {
  console.log('  exec_sql: AVAILABLE')
}

// Test 3: Other common DDL helper names
for (const fn of ['exec', 'execute_sql', 'run_sql', 'sql']) {
  const { error } = await sb.rpc(fn, { sql: 'SELECT 1' })
  if (!error) {
    console.log(`  ${fn}: AVAILABLE`)
  }
}

// Test 4: Storage bucket for illustrations
console.log('\n[3] Check storage bucket story-illustrations...')
const { data: buckets, error: bucketsErr } = await sb.storage.listBuckets()
if (bucketsErr) {
  console.log('  bucket list error:', bucketsErr.message)
} else {
  const names = buckets.map((b) => b.name)
  console.log('  buckets:', names.join(', '))
  console.log('  story-illustrations exists:', names.includes('story-illustrations'))
}

console.log('\nDone.')
