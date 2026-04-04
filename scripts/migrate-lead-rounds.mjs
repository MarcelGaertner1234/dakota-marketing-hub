// Run: node --input-type=module < scripts/migrate-lead-rounds.mjs
// OR: node scripts/migrate-lead-rounds.mjs (with "type": "module" in package.json — we don't have that)
//
// This script creates the lead_rounds table via Supabase REST API
// Since PostgREST can't run DDL, we use individual INSERT/UPDATE operations

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const envContent = readFileSync('.env.local', 'utf8')
const env = {}
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^#=]+)=(.+)$/)
  if (m) env[m[1].trim()] = m[2].trim()
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_KEY)

// Check if table exists
const { error: checkErr } = await supabase.from('lead_rounds').select('id').limit(1)
if (!checkErr) {
  console.log('lead_rounds table already exists — checking seed data...')
} else {
  console.log('Table does not exist yet. Run the SQL migration in Supabase Dashboard:')
  console.log(`https://supabase.com/dashboard/project/${env.NEXT_PUBLIC_SUPABASE_URL.match(/https:\/\/(.+)\.supabase\.co/)?.[1]}/sql/new`)
  console.log('\nSQL to run:\n')
  console.log(readFileSync('supabase/migrations/003_lead_rounds.sql', 'utf8'))
  process.exit(1)
}

// Seed round 1 for leads that don't have one yet
const { data: leads } = await supabase.from('leads').select('id, created_at')
const { data: existingRounds } = await supabase.from('lead_rounds').select('lead_id')
const existingLeadIds = new Set((existingRounds || []).map(r => r.lead_id))

const newRounds = (leads || [])
  .filter(l => !existingLeadIds.has(l.id))
  .map(l => ({
    lead_id: l.id,
    round_number: 1,
    reason: 'Erstkontakt',
    started_at: l.created_at,
  }))

if (newRounds.length > 0) {
  const { error } = await supabase.from('lead_rounds').insert(newRounds)
  if (error) {
    console.error('Error seeding rounds:', error)
  } else {
    console.log(`Seeded ${newRounds.length} initial rounds`)
  }
} else {
  console.log('All leads already have rounds')
}

// Link activities to rounds
const { data: unlinked } = await supabase
  .from('lead_activities')
  .select('id, lead_id')
  .is('round_id', null)

if (unlinked && unlinked.length > 0) {
  const { data: rounds } = await supabase.from('lead_rounds').select('id, lead_id').eq('round_number', 1)
  const roundMap = new Map((rounds || []).map(r => [r.lead_id, r.id]))

  let updated = 0
  for (const act of unlinked) {
    const roundId = roundMap.get(act.lead_id)
    if (roundId) {
      await supabase.from('lead_activities').update({ round_id: roundId }).eq('id', act.id)
      updated++
    }
  }
  console.log(`Linked ${updated} activities to rounds`)
} else {
  console.log('All activities already linked to rounds')
}

console.log('Migration complete!')
