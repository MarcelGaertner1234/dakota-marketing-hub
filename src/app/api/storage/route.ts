import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// GET: List files in a bucket/folder
export async function GET(request: NextRequest) {
  const bucket = request.nextUrl.searchParams.get("bucket") || "concept-images"
  const folder = request.nextUrl.searchParams.get("folder") || ""

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
  const body = await request.json()
  const { bucket, path } = body

  if (!bucket || !path) {
    return NextResponse.json({ error: "Missing bucket or path" }, { status: 400 })
  }

  const supabase = getSupabase()
  const { error } = await supabase.storage.from(bucket).remove([path])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
