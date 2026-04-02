import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { supabase, resolveTeamMember, resolveConcept, resolveLead } from "../supabase.js"

export function registerWorkflowTools(server: McpServer) {
  // ── create_event_campaign ────────────────────────────────────
  server.tool(
    "create_event_campaign",
    "Power workflow: Create a full event campaign with tasks, social posts, and lead invitations in one call.",
    {
      title: z.string().describe("Event title"),
      start_date: z.string().describe("Start date (YYYY-MM-DD)"),
      event_type: z.string().optional().describe("Event type (default: concept_event)"),
      concept: z.string().optional().describe("Concept slug, name, or ID"),
      description: z.string().optional().describe("Event description"),
      start_time: z.string().optional().describe("Start time (HH:MM)"),
      end_time: z.string().optional().describe("End time (HH:MM)"),
      location: z.string().optional().describe("Event location"),
      lead_time_days: z.number().optional().describe("Lead time in days for preparation"),
      tasks: z.array(z.object({
        title: z.string(),
        assigned_to: z.string().optional(),
        due_date: z.string().optional(),
        priority: z.string().optional(),
      })).optional().describe("Tasks to create for this event"),
      social_posts: z.array(z.object({
        platform: z.string(),
        post_type: z.string().optional(),
        title: z.string(),
        caption: z.string().optional(),
        hashtags: z.array(z.string()).optional(),
        scheduled_at: z.string().optional(),
      })).optional().describe("Social posts to create for this event"),
      invite_leads: z.array(z.string()).optional().describe("Lead names or IDs to invite"),
    },
    async ({ title, start_date, event_type, concept, description, start_time, end_time, location, lead_time_days, tasks, social_posts, invite_leads }) => {
      try {
        const results: {
          event: any
          tasks: any[]
          posts: any[]
          invited_leads: any[]
          errors: string[]
        } = { event: null, tasks: [], posts: [], invited_leads: [], errors: [] }

        // a) Resolve concept if provided
        let concept_id: string | undefined
        if (concept) {
          try {
            concept_id = await resolveConcept(concept)
          } catch (e: any) {
            results.errors.push(`Concept resolution: ${e.message}`)
          }
        }

        // b) Create event
        const eventPayload: Record<string, any> = {
          title,
          start_date,
          event_type: event_type ?? "concept_event",
        }
        if (description !== undefined) eventPayload.description = description
        if (start_time !== undefined) eventPayload.start_time = start_time
        if (end_time !== undefined) eventPayload.end_time = end_time
        if (location !== undefined) eventPayload.location = location
        if (lead_time_days !== undefined) eventPayload.lead_time_days = lead_time_days
        if (concept_id) eventPayload.concept_id = concept_id

        const { data: event, error: eventErr } = await supabase
          .from("events")
          .insert(eventPayload)
          .select()
          .single()

        if (eventErr) throw new Error(`Event creation failed: ${eventErr.message}`)
        results.event = event

        // c) Create tasks
        if (tasks && tasks.length > 0) {
          for (const task of tasks) {
            try {
              const taskPayload: Record<string, any> = {
                event_id: event.id,
                title: task.title,
                status: "todo",
              }
              if (task.due_date) taskPayload.due_date = task.due_date
              if (task.priority) taskPayload.priority = task.priority

              if (task.assigned_to) {
                try {
                  taskPayload.assigned_to = await resolveTeamMember(task.assigned_to)
                } catch (e: any) {
                  results.errors.push(`Task "${task.title}" assignment: ${e.message}`)
                }
              }

              const { data: created, error: taskErr } = await supabase
                .from("tasks")
                .insert(taskPayload)
                .select()
                .single()

              if (taskErr) {
                results.errors.push(`Task "${task.title}": ${taskErr.message}`)
              } else {
                results.tasks.push(created)
              }
            } catch (e: any) {
              results.errors.push(`Task "${task.title}": ${e.message}`)
            }
          }
        }

        // d) Create social posts
        if (social_posts && social_posts.length > 0) {
          for (const post of social_posts) {
            try {
              const postPayload: Record<string, any> = {
                event_id: event.id,
                platform: post.platform,
                title: post.title,
                status: "entwurf",
              }
              if (concept_id) postPayload.concept_id = concept_id
              if (post.post_type) postPayload.post_type = post.post_type
              if (post.caption) postPayload.caption = post.caption
              if (post.hashtags) postPayload.hashtags = post.hashtags
              if (post.scheduled_at) postPayload.scheduled_at = post.scheduled_at

              const { data: created, error: postErr } = await supabase
                .from("social_posts")
                .insert(postPayload)
                .select()
                .single()

              if (postErr) {
                results.errors.push(`Post "${post.title}": ${postErr.message}`)
              } else {
                results.posts.push(created)
              }
            } catch (e: any) {
              results.errors.push(`Post "${post.title}": ${e.message}`)
            }
          }
        }

        // e) Invite leads
        if (invite_leads && invite_leads.length > 0) {
          for (const leadRef of invite_leads) {
            try {
              const leadId = await resolveLead(leadRef)

              // Create lead_events entry
              const { data: leadEvent, error: leErr } = await supabase
                .from("lead_events")
                .insert({
                  lead_id: leadId,
                  event_id: event.id,
                  status: "eingeladen",
                })
                .select()
                .single()

              if (leErr) {
                results.errors.push(`Lead invite "${leadRef}": ${leErr.message}`)
                continue
              }

              // Create lead_activity
              await supabase
                .from("lead_activities")
                .insert({
                  lead_id: leadId,
                  activity_type: "notiz",
                  description: `Eingeladen zu ${event.title}`,
                })

              results.invited_leads.push({ lead_id: leadId, lead_event: leadEvent })
            } catch (e: any) {
              results.errors.push(`Lead invite "${leadRef}": ${e.message}`)
            }
          }
        }

        // f) Return result
        const response: any = {
          event: results.event,
          tasks: results.tasks,
          posts: results.posts,
          invited_leads: results.invited_leads,
        }
        if (results.errors.length > 0) {
          response.partial_errors = results.errors
        }

        return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] }
      } catch (e: any) {
        return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true }
      }
    }
  )

  // ── invite_lead_to_event ─────────────────────────────────────
  server.tool(
    "invite_lead_to_event",
    "Invite a lead to an event. Creates lead_events entry and logs activity.",
    {
      lead: z.string().describe("Lead name or UUID"),
      event_id: z.string().describe("Event UUID"),
      status: z.string().optional().describe("Invitation status (default: eingeladen)"),
      notes: z.string().optional().describe("Notes for the invitation"),
    },
    async ({ lead, event_id, status, notes }) => {
      try {
        // a) Resolve lead
        const leadId = await resolveLead(lead)

        // b) Get event title
        const { data: event, error: evtErr } = await supabase
          .from("events")
          .select("title")
          .eq("id", event_id)
          .single()
        if (evtErr) throw new Error(`Event not found: ${evtErr.message}`)

        // c) Upsert into lead_events
        const lePayload: Record<string, any> = {
          lead_id: leadId,
          event_id,
          status: status ?? "eingeladen",
        }
        if (notes !== undefined) lePayload.notes = notes

        const { data: leadEvent, error: leErr } = await supabase
          .from("lead_events")
          .upsert(lePayload, { onConflict: "lead_id,event_id" })
          .select()
          .single()
        if (leErr) throw new Error(`Lead event creation failed: ${leErr.message}`)

        // d) Create lead_activity
        const { data: activity, error: actErr } = await supabase
          .from("lead_activities")
          .insert({
            lead_id: leadId,
            activity_type: "notiz",
            description: `Eingeladen zu ${event.title}`,
          })
          .select()
          .single()
        if (actErr) throw new Error(`Activity creation failed: ${actErr.message}`)

        return { content: [{ type: "text", text: JSON.stringify({ lead_event: leadEvent, activity }, null, 2) }] }
      } catch (e: any) {
        return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true }
      }
    }
  )

  // ── get_dashboard ────────────────────────────────────────────
  server.tool(
    "get_dashboard",
    "Get a dashboard overview: stats, upcoming events, open tasks, recent reviews.",
    {},
    async () => {
      try {
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth() // 0-indexed
        const firstDay = `${year}-${String(month + 1).padStart(2, "0")}-01`
        const lastDay = new Date(year, month + 1, 0)
        const lastDayStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`
        const today = now.toISOString().split("T")[0]

        const [
          eventsThisMonth,
          activeLeads,
          activeConcepts,
          reviewData,
          upcomingEvents,
          openTasks,
          recentReviews,
        ] = await Promise.all([
          // a) Events this month
          supabase
            .from("events")
            .select("id", { count: "exact", head: true })
            .gte("start_date", firstDay)
            .lte("start_date", lastDayStr),

          // b) Active leads
          supabase
            .from("leads")
            .select("id", { count: "exact", head: true })
            .neq("status", "verloren"),

          // c) Active concepts
          supabase
            .from("concepts")
            .select("id", { count: "exact", head: true })
            .eq("is_active", true),

          // d) Review ratings
          supabase
            .from("reviews")
            .select("food_rating, ambience_rating, service_rating"),

          // e) Upcoming events (top 5)
          supabase
            .from("events")
            .select("id, title, start_date, start_time, event_type, location")
            .gte("start_date", today)
            .order("start_date", { ascending: true })
            .limit(5),

          // f) Open tasks (top 5) with FK hints
          supabase
            .from("tasks")
            .select("id, title, status, priority, due_date, team_members!tasks_assigned_to_fkey(name), events!tasks_event_id_fkey(title)")
            .in("status", ["todo", "in_progress"])
            .order("due_date", { ascending: true })
            .limit(5),

          // g) Recent reviews (top 3)
          supabase
            .from("reviews")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(3),
        ])

        // Calculate review averages
        const reviews = reviewData.data ?? []
        const reviewCount = reviews.length
        let foodAvg = 0, ambienceAvg = 0, serviceAvg = 0, overallAvg = 0

        if (reviewCount > 0) {
          foodAvg = reviews.reduce((sum: number, r: any) => sum + (r.food_rating ?? 0), 0) / reviewCount
          ambienceAvg = reviews.reduce((sum: number, r: any) => sum + (r.ambience_rating ?? 0), 0) / reviewCount
          serviceAvg = reviews.reduce((sum: number, r: any) => sum + (r.service_rating ?? 0), 0) / reviewCount
          overallAvg = (foodAvg + ambienceAvg + serviceAvg) / 3
        }

        // Format open tasks
        const formattedTasks = (openTasks.data ?? []).map((t: any) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          due_date: t.due_date,
          assigned_to: t.team_members?.name ?? null,
          event_title: t.events?.title ?? null,
        }))

        const result = {
          stats: {
            events_this_month: eventsThisMonth.count ?? 0,
            active_leads: activeLeads.count ?? 0,
            concepts: activeConcepts.count ?? 0,
            reviews_total: reviewCount,
            review_average: Math.round(overallAvg * 10) / 10,
            review_food: Math.round(foodAvg * 10) / 10,
            review_ambience: Math.round(ambienceAvg * 10) / 10,
            review_service: Math.round(serviceAvg * 10) / 10,
          },
          upcoming_events: upcomingEvents.data ?? [],
          open_tasks: formattedTasks,
          recent_reviews: recentReviews.data ?? [],
        }

        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      } catch (e: any) {
        return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true }
      }
    }
  )
}
