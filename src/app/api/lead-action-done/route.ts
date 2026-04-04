import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const { leadId } = await request.json()
  if (!leadId) return NextResponse.json({ error: "Missing leadId" }, { status: 400 })

  const supabase = createServerClient()
  const { error } = await supabase
    .from("leads")
    .update({ next_action: null, next_action_date: null, updated_at: new Date().toISOString() })
    .eq("id", leadId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
