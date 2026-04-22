import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { rateLimit } from "@/lib/rate-limit"

const ALLOWED_BUCKETS = new Set([
  "concept-images",
  "event-images",
  "social-images",
  "story-illustrations",
])

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function isSafePath(value: string): boolean {
  if (value.includes("..") || value.startsWith("/")) return false
  try {
    if (decodeURIComponent(value).includes("..")) return false
  } catch {
    return false
  }
  return true
}

// GET: List files in a bucket/folder
export async function GET(request: NextRequest) {
  const rl = rateLimit(request, { scope: "storage-list", max: 60, windowMs: 60_000 })
  if (rl) return rl

  const bucket = request.nextUrl.searchParams.get("bucket") || "concept-images"
  const folder = request.nextUrl.searchParams.get("folder") || ""

  if (!ALLOWED_BUCKETS.has(bucket)) {
    return NextResponse.json({ error: "Invalid bucket" }, { status: 400 })
  }

  if (folder && !isSafePath(folder)) {
    return NextResponse.json({ error: "Invalid folder" }, { status: 400 })
  }

  const supabase = getSupabase()
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(folder, { sortBy: { column: "created_at", order: "desc" } })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const files = (data || [])
    .filter((f) => f.name !== ".emptyFolderPlaceholder")
    .map((f) => {
      const path = folder ? `${folder}/${f.name}` : f.name
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
      return {
        name: f.name,
        path,
        url: urlData.publicUrl,
        size: f.metadata?.size,
        created_at: f.created_at,
      }
    })

  return NextResponse.json({ files })
}

// DELETE: Remove a file from storage
export async function DELETE(request: NextRequest) {
  const rl = rateLimit(request, { scope: "storage-delete", max: 30, windowMs: 60_000 })
  if (rl) return rl

  let body: { bucket?: string; path?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { bucket, path } = body

  if (!bucket || !path) {
    return NextResponse.json({ error: "Missing bucket or path" }, { status: 400 })
  }

  if (!ALLOWED_BUCKETS.has(bucket)) {
    return NextResponse.json({ error: "Invalid bucket" }, { status: 400 })
  }

  if (!isSafePath(path)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 })
  }

  const supabase = getSupabase()
  const { error } = await supabase.storage.from(bucket).remove([path])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
