import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get("file") as File | null
  const bucket = (formData.get("bucket") as string) || "concept-images"
  const folder = (formData.get("folder") as string) || ""

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const ext = file.name.split(".").pop() || "jpg"
  const fileName = `${folder ? folder + "/" : ""}${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`

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

  return NextResponse.json({ url: urlData.publicUrl, path: fileName })
}
