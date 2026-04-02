import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { supabase, resolveTeamMember, resolveLead } from "../supabase.js"

export function registerLeadTools(server: McpServer) {
  // ── list_leads ──────────────────────────────────────────────
  server.tool(
    "list_leads",
    "List leads with optional filters. Supports fuzzy search on name/company.",
    {
      status: z.string().optional().describe("Filter by status (e.g. new, contacted, qualified, won, lost)"),
      lead_type: z.string().optional().describe("Filter by lead_type (e.g. privatperson, firma, verein)"),
      search: z.string().optional().describe("Fuzzy search on name and company"),
      limit: z.number().optional().describe("Max results (default 50)"),
    },
    async ({ status, lead_type, search, limit }) => {
      try {
        let query = supabase.from("leads").select("*")

        if (status) query = query.eq("status", status)
        if (lead_type) query = query.eq("lead_type", lead_type)
        if (search) {
          query = query.or(`name.ilike.%${search}%,company.ilike.%${search}%`)
        }

        query = query.order("updated_at", { ascending: false }).limit(limit ?? 50)

        const { data, error } = await query
        if (error) throw new Error(error.message)

        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }
      } catch (e: any) {
        return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true }
      }
    }
  )

  // ── get_lead ────────────────────────────────────────────────
  server.tool(
    "get_lead",
    "Get a single lead by ID, including activities (with team member name) and linked events.",
    {
      id: z.string().describe("Lead UUID"),
    },
    async ({ id }) => {
      try {
        // Fetch lead
        const { data: lead, error: leadErr } = await supabase
          .from("leads")
          .select("*")
          .eq("id", id)
          .single()
        if (leadErr) throw new Error(leadErr.message)

        // Fetch activities with contacted_by team member name
        const { data: activities, error: actErr } = await supabase
          .from("lead_activities")
          .select("*, team_members(name)")
          .eq("lead_id", id)
          .order("contacted_at", { ascending: false })
        if (actErr) throw new Error(actErr.message)

        // Fetch linked events via lead_events
        const { data: leadEvents, error: evtErr } = await supabase
          .from("lead_events")
          .select("*, events(title, start_date)")
          .eq("lead_id", id)
        if (evtErr) throw new Error(evtErr.message)

        const result = {
          ...lead,
          activities: activities?.map((a: any) => ({
            ...a,
            contacted_by_name: a.team_members?.name ?? null,
            team_members: undefined,
          })),
          linked_events: leadEvents?.map((le: any) => ({
            ...le,
            event_title: le.events?.title ?? null,
            event_start_date: le.events?.start_date ?? null,
            events: undefined,
          })),
        }

        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (e: any) {
        return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true }
      }
    }
  )

  // ── create_lead ─────────────────────────────────────────────
  server.tool(
    "create_lead",
    "Create a new lead. Returns the created lead.",
    {
      name: z.string().describe("Lead name (person or organization)"),
      lead_type: z.string().optional().describe("Type: privatperson, firma, verein (default: privatperson)"),
      company: z.string().optional().describe("Company name"),
      email: z.string().optional().describe("Email address"),
      phone: z.string().optional().describe("Phone number"),
      address: z.string().optional().describe("Address"),
      notes: z.string().optional().describe("Notes"),
      tags: z.array(z.string()).optional().describe("Tags as string array"),
    },
    async ({ name, lead_type, company, email, phone, address, notes, tags }) => {
      try {
        const payload: Record<string, any> = {
          name,
          lead_type: lead_type ?? "privatperson",
        }
        if (company !== undefined) payload.company = company
        if (email !== undefined) payload.email = email
        if (phone !== undefined) payload.phone = phone
        if (address !== undefined) payload.address = address
        if (notes !== undefined) payload.notes = notes
        if (tags !== undefined) payload.tags = tags

        const { data, error } = await supabase
          .from("leads")
          .insert(payload)
          .select()
          .single()
        if (error) throw new Error(error.message)

        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }
      } catch (e: any) {
        return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true }
      }
    }
  )

  // ── update_lead ─────────────────────────────────────────────
  server.tool(
    "update_lead",
    "Update an existing lead. Returns the updated lead.",
    {
      id: z.string().describe("Lead UUID"),
      name: z.string().optional().describe("Updated name"),
      lead_type: z.string().optional().describe("Updated type"),
      company: z.string().optional().describe("Updated company"),
      email: z.string().optional().describe("Updated email"),
      phone: z.string().optional().describe("Updated phone"),
      address: z.string().optional().describe("Updated address"),
      notes: z.string().optional().describe("Updated notes"),
      tags: z.array(z.string()).optional().describe("Updated tags"),
      status: z.string().optional().describe("Updated status (e.g. new, contacted, qualified, won, lost)"),
    },
    async ({ id, ...fields }) => {
      try {
        // Build update payload from provided fields only
        const payload: Record<string, any> = {}
        for (const [key, value] of Object.entries(fields)) {
          if (value !== undefined) payload[key] = value
        }

        if (Object.keys(payload).length === 0) {
          throw new Error("No fields to update")
        }

        const { data, error } = await supabase
          .from("leads")
          .update(payload)
          .eq("id", id)
          .select()
          .single()
        if (error) throw new Error(error.message)

        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }
      } catch (e: any) {
        return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true }
      }
    }
  )

  // ── add_lead_activity ───────────────────────────────────────
  server.tool(
    "add_lead_activity",
    "Log a new activity for a lead (call, email, meeting, message, note).",
    {
      lead_id: z.string().describe("Lead UUID"),
      activity_type: z.enum(["anruf", "email", "treffen", "nachricht", "notiz"]).describe("Activity type"),
      description: z.string().describe("Activity description"),
      contacted_by: z.string().optional().describe("Team member name or UUID who made the contact"),
    },
    async ({ lead_id, activity_type, description, contacted_by }) => {
      try {
        const payload: Record<string, any> = {
          lead_id,
          activity_type,
          description,
        }

        if (contacted_by) {
          payload.contacted_by = await resolveTeamMember(contacted_by)
        }

        const { data, error } = await supabase
          .from("lead_activities")
          .insert(payload)
          .select()
          .single()
        if (error) throw new Error(error.message)

        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }
      } catch (e: any) {
        return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true }
      }
    }
  )
}
