"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getLeads() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("leads")
    .select("id, name, company, lead_type, status, tags")
    .order("created_at", { ascending: false })
  if (error) throw error
  return data
}

export async function getLead(id: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("leads")
    .select("*, activities:lead_activities(*, contacted_member:team_members(*), event:events(id, title))")
    .eq("id", id)
    .single()
  if (error) throw error
  return data
}

export async function createLead(formData: FormData): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = createServerClient()
  const tags = (formData.get("tags") as string)
    ?.split(",")
    .map((t) => t.trim())
    .filter(Boolean) || []
  try {
    const { error } = await supabase.from("leads").insert({
      name: formData.get("name") as string,
      company: (formData.get("company") as string) || null,
      lead_type: (formData.get("lead_type") as string) || "privatperson",
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      address: (formData.get("address") as string) || null,
      notes: (formData.get("notes") as string) || null,
      tags: tags.length > 0 ? tags : null,
    })
    if (error) return { success: false, error: error.message }
    revalidatePath("/leads")
    return { success: true }
  } catch {
    return { success: false, error: "Unbekannter Fehler beim Speichern" }
  }
}

export async function updateLead(
  id: string,
  data: {
    name?: string
    company?: string | null
    email?: string | null
    phone?: string | null
    address?: string | null
    notes?: string | null
    lead_type?: string
    tags?: string[] | null
  }
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = createServerClient()
  try {
    const { error } = await supabase
      .from("leads")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
    if (error) return { success: false, error: error.message }
    revalidatePath("/leads")
    revalidatePath(`/leads/${id}`)
    return { success: true }
  } catch {
    return { success: false, error: "Unbekannter Fehler beim Aktualisieren" }
  }
}

export async function updateLeadStatus(id: string, status: string) {
  const supabase = createServerClient()
  const { error } = await supabase
    .from("leads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw error
  revalidatePath("/leads")
  revalidatePath(`/leads/${id}`)
}

// ============================================
// LEAD ↔ EVENT Linking (n:m via lead_events)
// ============================================

export async function getLeadEvents(leadId: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("lead_events")
    .select("lead_id, event_id, status, notes, event:events(id, title, start_date, event_type)")
    .eq("lead_id", leadId)
  if (error) throw error
  return data
}

export async function linkLeadToEvent(
  leadId: string,
  eventId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = createServerClient()
  try {
    const { error } = await supabase
      .from("lead_events")
      .insert({ lead_id: leadId, event_id: eventId })
    if (error) return { success: false, error: error.message }
    revalidatePath(`/leads/${leadId}`)
    revalidatePath(`/kalender/${eventId}`)
    return { success: true }
  } catch {
    return { success: false, error: "Fehler beim Verknüpfen" }
  }
}

export async function unlinkLeadFromEvent(
  leadId: string,
  eventId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = createServerClient()
  try {
    const { error } = await supabase
      .from("lead_events")
      .delete()
      .eq("lead_id", leadId)
      .eq("event_id", eventId)
    if (error) return { success: false, error: error.message }
    revalidatePath(`/leads/${leadId}`)
    revalidatePath(`/kalender/${eventId}`)
    return { success: true }
  } catch {
    return { success: false, error: "Fehler beim Entfernen der Verknüpfung" }
  }
}

export async function getEventLeads(eventId: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("lead_events")
    .select("lead_id, event_id, status, notes, lead:leads(id, name, company, status, lead_type)")
    .eq("event_id", eventId)
  if (error) throw error
  return data
}

export async function addLeadActivity(formData: FormData) {
  const supabase = createServerClient()
  const leadId = formData.get("lead_id") as string

  // Auto-assign current round
  const { data: currentRound } = await supabase
    .from("lead_rounds")
    .select("id")
    .eq("lead_id", leadId)
    .is("ended_at", null)
    .order("round_number", { ascending: false })
    .limit(1)
    .single()

  const { error } = await supabase.from("lead_activities").insert({
    lead_id: leadId,
    activity_type: formData.get("activity_type") as string,
    description: formData.get("description") as string,
    contacted_by: (formData.get("contacted_by") as string) || null,
    event_id: (formData.get("event_id") as string) || null,
    round_id: currentRound?.id ?? null,
  })
  if (error) throw error
  revalidatePath(`/leads/${leadId}`)
}

// ============================================
// LEAD ROUNDS (Durchlauf-Tracking)
// ============================================

export async function getLeadRounds(leadId: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("lead_rounds")
    .select("*, started_member:team_members(*), activities:lead_activities(*, contacted_member:team_members(*), event:events(id, title))")
    .eq("lead_id", leadId)
    .order("round_number", { ascending: false })
  if (error) throw error
  return data
}

export async function getLeadsWithRounds() {
  const supabase = createServerClient()

  // Leads with all rounds
  const { data: leads, error: leadsErr } = await supabase
    .from("leads")
    .select("*, rounds:lead_rounds(*)")
    .order("updated_at", { ascending: false })
  if (leadsErr) throw leadsErr

  // Last activity per lead
  const { data: activities, error: actErr } = await supabase
    .from("lead_activities")
    .select("lead_id, activity_type, contacted_at")
    .order("contacted_at", { ascending: false })
  if (actErr) throw actErr

  // Build last-activity map
  const lastActivityMap = new Map<string, { activity_type: string; contacted_at: string }>()
  for (const act of activities || []) {
    if (!lastActivityMap.has(act.lead_id)) {
      lastActivityMap.set(act.lead_id, { activity_type: act.activity_type, contacted_at: act.contacted_at })
    }
  }

  return (leads || []).map((lead) => {
    const rounds = (lead.rounds || []) as Array<{ id: string; round_number: number; reason: string; started_at: string; ended_at: string | null; outcome: string | null }>
    const currentRound = rounds.find((r) => !r.ended_at) || rounds[0]
    return {
      ...lead,
      round_count: rounds.length,
      current_round: currentRound || null,
      last_activity: lastActivityMap.get(lead.id) || null,
    }
  })
}

export async function startNewRound(
  leadId: string,
  reason: string,
  startedBy?: string
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = createServerClient()
  try {
    // Get current lead status + current round
    const { data: lead } = await supabase.from("leads").select("status").eq("id", leadId).single()
    if (!lead) return { success: false, error: "Lead nicht gefunden" }

    // Close current open round
    const { data: openRound } = await supabase
      .from("lead_rounds")
      .select("id, round_number")
      .eq("lead_id", leadId)
      .is("ended_at", null)
      .order("round_number", { ascending: false })
      .limit(1)
      .single()

    if (openRound) {
      await supabase
        .from("lead_rounds")
        .update({ ended_at: new Date().toISOString(), outcome: lead.status })
        .eq("id", openRound.id)
    }

    // Get highest round number
    const { data: maxRound } = await supabase
      .from("lead_rounds")
      .select("round_number")
      .eq("lead_id", leadId)
      .order("round_number", { ascending: false })
      .limit(1)
      .single()

    const nextNumber = (maxRound?.round_number || 0) + 1

    // Create new round
    const { error: roundErr } = await supabase.from("lead_rounds").insert({
      lead_id: leadId,
      round_number: nextNumber,
      reason,
      started_by: startedBy || null,
    })
    if (roundErr) return { success: false, error: roundErr.message }

    // Reset lead status to "neu"
    await supabase
      .from("leads")
      .update({ status: "neu", updated_at: new Date().toISOString() })
      .eq("id", leadId)

    // Log activity
    await supabase.from("lead_activities").insert({
      lead_id: leadId,
      activity_type: "status_change",
      description: `Neuer Durchlauf #${nextNumber} gestartet: ${reason}`,
      contacted_by: startedBy || null,
    })

    revalidatePath("/leads")
    revalidatePath(`/leads/${leadId}`)
    revalidatePath("/")
    return { success: true }
  } catch {
    return { success: false, error: "Fehler beim Starten des neuen Durchlaufs" }
  }
}
