import { createClient } from "@supabase/supabase-js"

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_KEY

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables")
  process.exit(1)
}

export const supabase = createClient(url, key)

// Helper: resolve team member name to ID
export async function resolveTeamMember(nameOrId: string): Promise<string> {
  // If it looks like a UUID, return as-is
  if (nameOrId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-/i)) return nameOrId

  const { data, error } = await supabase
    .from("team_members")
    .select("id")
    .ilike("name", nameOrId)
    .limit(1)
    .single()

  if (error || !data) throw new Error(`Team member '${nameOrId}' not found`)
  return data.id
}

// Helper: resolve concept slug/name to ID
export async function resolveConcept(slugOrNameOrId: string): Promise<string> {
  if (slugOrNameOrId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-/i)) return slugOrNameOrId

  // Try slug first
  const { data: bySlug } = await supabase
    .from("concepts")
    .select("id")
    .eq("slug", slugOrNameOrId.toLowerCase())
    .limit(1)
    .single()

  if (bySlug) return bySlug.id

  // Try name
  const { data: byName } = await supabase
    .from("concepts")
    .select("id")
    .ilike("name", slugOrNameOrId)
    .limit(1)
    .single()

  if (byName) return byName.id
  throw new Error(`Concept '${slugOrNameOrId}' not found`)
}

// Helper: resolve lead name to ID
export async function resolveLead(nameOrId: string): Promise<string> {
  if (nameOrId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-/i)) return nameOrId

  const { data } = await supabase
    .from("leads")
    .select("id")
    .or(`name.ilike.%${nameOrId}%,company.ilike.%${nameOrId}%`)
    .limit(1)
    .single()

  if (!data) throw new Error(`Lead '${nameOrId}' not found`)
  return data.id
}
