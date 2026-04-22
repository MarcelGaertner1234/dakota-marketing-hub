import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { secureFileSuffix } from "@/lib/crypto-id"

const ALLOWED_BUCKETS = new Set([
  "concept-images",
  "event-images",
  "social-images",
  "story-illustrations",
])

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
])

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 // 10 MB

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get("file") as File | null
  const rawBucket = (formData.get("bucket") as string) || "concept-images"
  const bucket = ALLOWED_BUCKETS.has(rawBucket) ? rawBucket : null
  const folder = (formData.get("folder") as string) || ""

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  if (!bucket) {
    return NextResponse.json({ error: "Invalid bucket" }, { status: 400 })
  }

  // folder is used in the storage path — reject traversal attempts
  if (folder.includes("..") || folder.startsWith("/")) {
    return NextResponse.json({ error: "Invalid folder" }, { status: 400 })
  }
  try {
    if (folder && decodeURIComponent(folder).includes("..")) {
      return NextResponse.json({ error: "Invalid folder" }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: "Invalid folder" }, { status: 400 })
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 415 })
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 413 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const ext = (file.name.split(".").pop() || "jpg").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "jpg"
  const fileName = `${folder ? folder + "/" : ""}${Date.now()}-${secureFileSuffix()}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName)

  // Insert metadata into the appropriate image tracking table
  if (bucket === "event-images" || bucket === "social-images") {
    const table = bucket === "event-images" ? "event_images" : "social_post_images"
    const idColumn = bucket === "event-images" ? "event_id" : "post_id"
    const parentId = (formData.get("parent_id") as string) || null
    if (parentId) {
      await supabase.from(table).insert({
        [idColumn]: parentId,
        storage_path: fileName,
        url: urlData.publicUrl,
        file_name: file.name,
        content_type: file.type,
      })
    }
  }

  return NextResponse.json({ url: urlData.publicUrl, path: fileName })
}
