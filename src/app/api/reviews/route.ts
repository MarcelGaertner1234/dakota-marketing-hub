import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { token, food_rating, ambience_rating, service_rating, comment, guest_name } = body

  if (!token || !food_rating || !ambience_rating || !service_rating) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const goodyCode = `DAKOTA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

  const goodyToken = `${token}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`

  const { error } = await supabase.from("reviews").insert({
    token: goodyToken,
    food_rating,
    ambience_rating,
    service_rating,
    comment: comment || null,
    guest_name: guest_name || null,
    goody_code: goodyCode,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ goody_code: goodyCode })
}
