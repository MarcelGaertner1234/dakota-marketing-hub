import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { supabase, resolveConcept } from "../supabase.js"

function success(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] }
}

function error(message: string) {
  return { content: [{ type: "text" as const, text: JSON.stringify({ error: message }) }], isError: true as const }
}

/**
 * Generate recurring dates from a start date until recurrence_end_date.
 */
function generateRecurrenceDates(startDate: string, recurrence: string, endDate: string): string[] {
  const dates: string[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  let current = new Date(start)

  // Advance once before generating (first occurrence is the parent)
  while (true) {
    if (recurrence === "weekly") {
      current.setDate(current.getDate() + 7)
    } else if (recurrence === "biweekly") {
      current.setDate(current.getDate() + 14)
    } else if (recurrence === "monthly") {
      current.setMonth(current.getMonth() + 1)
    } else if (recurrence === "yearly") {
      current.setFullYear(current.getFullYear() + 1)
    } else {
      break
    }

    if (current > end) break
    dates.push(current.toISOString().split("T")[0])
  }

  return dates
}

export function registerEventTools(server: McpServer) {
  // 1. list_events
  server.tool(
    "list_events",
    "List events with optional filters by year, month, type, concept. Returns events with concept name, sorted by start_date.",
    {
      year: z.number().optional().describe("Filter by year (e.g. 2026)"),
      month: z.number().optional().describe("Filter by month (1-12)"),
      event_type: z.string().optional().describe("Filter by event type"),
      concept_id: z.string().optional().describe("Filter by concept ID"),
      limit: z.number().optional().describe("Max results (default 50)"),
    },
    async ({ year, month, event_type, concept_id, limit }) => {
      try {
        let query = supabase
          .from("events")
          .select("*, concept:concepts(*)")
          .order("start_date", { ascending: true })
          .limit(limit ?? 50)

        if (year && month) {
          const startOfMonth = `${year}-${String(month).padStart(2, "0")}-01`
          const endMonth = month === 12 ? 1 : month + 1
          const endYear = month === 12 ? year + 1 : year
          const startOfNext = `${endYear}-${String(endMonth).padStart(2, "0")}-01`
          query = query.gte("start_date", startOfMonth).lt("start_date", startOfNext)
        } else if (year) {
          query = query.gte("start_date", `${year}-01-01`).lt("start_date", `${year + 1}-01-01`)
        }

        if (event_type) query = query.eq("event_type", event_type)
        if (concept_id) query = query.eq("concept_id", concept_id)

        const { data, error: dbError } = await query
        if (dbError) return error(dbError.message)
        return success(data)
      } catch (e: any) {
        return error(e.message)
      }
    }
  )

  // 2. get_event
  server.tool(
    "get_event",
    "Get a single event with its concept, tasks (with assigned members), and linked leads.",
    {
      id: z.string().describe("Event ID (UUID)"),
    },
    async ({ id }) => {
      try {
        const { data: event, error: dbError } = await supabase
          .from("events")
          .select("*, concept:concepts(*), tasks(*, assigned_member:team_members!tasks_assigned_to_fkey(*))")
          .eq("id", id)
          .single()

        if (dbError) return error(dbError.message)

        // Fetch linked leads via lead_events
        const { data: leadEvents } = await supabase
          .from("lead_events")
          .select("*, lead:leads(*)")
          .eq("event_id", id)

        return success({ ...event, linked_leads: leadEvents ?? [] })
      } catch (e: any) {
        return error(e.message)
      }
    }
  )

  // 3. create_event
  server.tool(
    "create_event",
    "Create a new event. Supports concept resolution by slug and automatic recurrence generation.",
    {
      title: z.string().describe("Event title"),
      start_date: z.string().describe("Start date (YYYY-MM-DD)"),
      event_type: z.string().optional().describe("Event type (e.g. concept_event, holiday, internal)"),
      description: z.string().optional().describe("Event description"),
      start_time: z.string().optional().describe("Start time (HH:MM)"),
      end_time: z.string().optional().describe("End time (HH:MM)"),
      end_date: z.string().optional().describe("End date (YYYY-MM-DD)"),
      location: z.string().optional().describe("Event location"),
      concept_id: z.string().optional().describe("Concept UUID"),
      concept_slug: z.string().optional().describe("Concept slug (resolved to ID)"),
      lead_time_days: z.number().optional().describe("Lead time in days before event"),
      recurrence: z.string().optional().describe("Recurrence pattern: none, weekly, biweekly, monthly, yearly"),
      recurrence_end_date: z.string().optional().describe("End date for recurrence (YYYY-MM-DD)"),
    },
    async ({ title, start_date, event_type, description, start_time, end_time, end_date, location, concept_id, concept_slug, lead_time_days, recurrence, recurrence_end_date }) => {
      try {
        // Resolve concept
        let resolvedConceptId = concept_id
        if (!resolvedConceptId && concept_slug) {
          resolvedConceptId = await resolveConcept(concept_slug)
        }

        const eventData: Record<string, unknown> = {
          title,
          start_date,
          ...(event_type && { event_type }),
          ...(description && { description }),
          ...(start_time && { start_time }),
          ...(end_time && { end_time }),
          ...(end_date && { end_date }),
          ...(location && { location }),
          ...(resolvedConceptId && { concept_id: resolvedConceptId }),
          ...(lead_time_days !== undefined && { lead_time_days }),
          ...(recurrence && { recurrence }),
          ...(recurrence_end_date && { recurrence_end_date }),
        }

        const { data: created, error: dbError } = await supabase
          .from("events")
          .insert(eventData)
          .select("*")
          .single()

        if (dbError) return error(dbError.message)

        // Generate child events for recurrence
        const childEvents: unknown[] = []
        if (recurrence && recurrence !== "none" && recurrence_end_date) {
          const dates = generateRecurrenceDates(start_date, recurrence, recurrence_end_date)
          for (const date of dates) {
            const { recurrence: _r, recurrence_end_date: _re, ...parentFields } = eventData
            const childData = {
              ...parentFields,
              start_date: date,
              parent_event_id: created.id,
            }

            const { data: child, error: childError } = await supabase
              .from("events")
              .insert(childData)
              .select("*")
              .single()

            if (!childError && child) childEvents.push(child)
          }
        }

        return success({ event: created, child_events: childEvents.length > 0 ? childEvents : undefined })
      } catch (e: any) {
        return error(e.message)
      }
    }
  )

  // 4. update_event
  server.tool(
    "update_event",
    "Update an existing event by ID. Only provided fields are updated.",
    {
      id: z.string().describe("Event ID (UUID)"),
      title: z.string().optional().describe("Event title"),
      start_date: z.string().optional().describe("Start date (YYYY-MM-DD)"),
      event_type: z.string().optional().describe("Event type"),
      description: z.string().optional().describe("Event description"),
      start_time: z.string().optional().describe("Start time (HH:MM)"),
      end_time: z.string().optional().describe("End time (HH:MM)"),
      end_date: z.string().optional().describe("End date (YYYY-MM-DD)"),
      location: z.string().optional().describe("Event location"),
      concept_id: z.string().optional().describe("Concept UUID"),
      concept_slug: z.string().optional().describe("Concept slug (resolved to ID)"),
      lead_time_days: z.number().optional().describe("Lead time in days"),
      recurrence: z.string().optional().describe("Recurrence pattern"),
      recurrence_end_date: z.string().optional().describe("Recurrence end date"),
    },
    async ({ id, concept_slug, ...fields }) => {
      try {
        const updates: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(fields)) {
          if (value !== undefined) updates[key] = value
        }

        // Resolve concept slug if provided
        if (concept_slug && !updates.concept_id) {
          updates.concept_id = await resolveConcept(concept_slug)
        }

        const { data, error: dbError } = await supabase
          .from("events")
          .update(updates)
          .eq("id", id)
          .select("*")
          .single()

        if (dbError) return error(dbError.message)
        return success(data)
      } catch (e: any) {
        return error(e.message)
      }
    }
  )

  // 5. delete_event
  server.tool(
    "delete_event",
    "Delete an event by ID.",
    {
      id: z.string().describe("Event ID (UUID)"),
    },
    async ({ id }) => {
      try {
        const { error: dbError } = await supabase
          .from("events")
          .delete()
          .eq("id", id)

        if (dbError) return error(dbError.message)
        return success({ success: true })
      } catch (e: any) {
        return error(e.message)
      }
    }
  )

  // 6. get_holidays
  server.tool(
    "get_holidays",
    "Get holidays for a given year, sorted by date.",
    {
      year: z.number().optional().describe("Year (default: current year)"),
    },
    async ({ year }) => {
      try {
        const targetYear = year ?? new Date().getFullYear()

        const { data, error: dbError } = await supabase
          .from("holidays")
          .select("*")
          .gte("date", `${targetYear}-01-01`)
          .lt("date", `${targetYear + 1}-01-01`)
          .order("date", { ascending: true })

        if (dbError) return error(dbError.message)
        return success(data)
      } catch (e: any) {
        return error(e.message)
      }
    }
  )
}
