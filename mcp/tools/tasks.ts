import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { supabase, resolveTeamMember } from "../supabase.js"

function success(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] }
}

function error(message: string) {
  return { content: [{ type: "text" as const, text: JSON.stringify({ error: message }) }], isError: true as const }
}

export function registerTaskTools(server: McpServer) {
  // 1. list_tasks
  server.tool(
    "list_tasks",
    "List tasks with optional filters. Includes assigned member name and event title.",
    {
      event_id: z.string().optional().describe("Filter by event ID"),
      status: z.string().optional().describe("Filter by status (e.g. todo, in_progress, done)"),
      assigned_to: z.string().optional().describe("Filter by assigned team member (name or UUID)"),
      limit: z.number().optional().describe("Max results (default 20)"),
    },
    async ({ event_id, status, assigned_to, limit }) => {
      try {
        let query = supabase
          .from("tasks")
          .select("*, assigned_member:team_members!tasks_assigned_to_fkey(*), event:events!tasks_event_id_fkey(id, title)")
          .order("created_at", { ascending: false })
          .limit(limit ?? 20)

        if (event_id) query = query.eq("event_id", event_id)
        if (status) query = query.eq("status", status)

        if (assigned_to) {
          const memberId = await resolveTeamMember(assigned_to)
          query = query.eq("assigned_to", memberId)
        }

        const { data, error: dbError } = await query
        if (dbError) return error(dbError.message)
        return success(data)
      } catch (e: any) {
        return error(e.message)
      }
    }
  )

  // 2. create_task
  server.tool(
    "create_task",
    "Create a new task for an event. Supports name resolution for assigned_to.",
    {
      event_id: z.string().describe("Event ID this task belongs to"),
      title: z.string().describe("Task title"),
      priority: z.string().optional().describe("Priority: low, medium, high"),
      assigned_to: z.string().optional().describe("Team member name or UUID"),
      due_date: z.string().optional().describe("Due date (YYYY-MM-DD)"),
      description: z.string().optional().describe("Task description"),
    },
    async ({ event_id, title, priority, assigned_to, due_date, description }) => {
      try {
        let resolvedAssignee: string | undefined
        if (assigned_to) {
          resolvedAssignee = await resolveTeamMember(assigned_to)
        }

        const taskData: Record<string, unknown> = {
          event_id,
          title,
          ...(priority && { priority }),
          ...(resolvedAssignee && { assigned_to: resolvedAssignee }),
          ...(due_date && { due_date }),
          ...(description && { description }),
        }

        const { data, error: dbError } = await supabase
          .from("tasks")
          .insert(taskData)
          .select("*, assigned_member:team_members!tasks_assigned_to_fkey(*), event:events!tasks_event_id_fkey(id, title)")
          .single()

        if (dbError) return error(dbError.message)
        return success(data)
      } catch (e: any) {
        return error(e.message)
      }
    }
  )

  // 3. update_task
  server.tool(
    "update_task",
    "Update an existing task by ID. Supports name resolution for assigned_to.",
    {
      id: z.string().describe("Task ID (UUID)"),
      title: z.string().optional().describe("Task title"),
      status: z.string().optional().describe("Status: todo, in_progress, done"),
      priority: z.string().optional().describe("Priority: low, medium, high"),
      assigned_to: z.string().optional().describe("Team member name or UUID"),
      due_date: z.string().optional().describe("Due date (YYYY-MM-DD)"),
      description: z.string().optional().describe("Task description"),
    },
    async ({ id, assigned_to, ...fields }) => {
      try {
        const updates: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(fields)) {
          if (value !== undefined) updates[key] = value
        }

        if (assigned_to) {
          updates.assigned_to = await resolveTeamMember(assigned_to)
        }

        const { data, error: dbError } = await supabase
          .from("tasks")
          .update(updates)
          .eq("id", id)
          .select("*, assigned_member:team_members!tasks_assigned_to_fkey(*), event:events!tasks_event_id_fkey(id, title)")
          .single()

        if (dbError) return error(dbError.message)
        return success(data)
      } catch (e: any) {
        return error(e.message)
      }
    }
  )

  // 4. complete_task
  server.tool(
    "complete_task",
    "Mark a task as done and set completed_at to now.",
    {
      id: z.string().describe("Task ID (UUID)"),
    },
    async ({ id }) => {
      try {
        const { data, error: dbError } = await supabase
          .from("tasks")
          .update({
            status: "done",
            completed_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select("*, assigned_member:team_members!tasks_assigned_to_fkey(*), event:events!tasks_event_id_fkey(id, title)")
          .single()

        if (dbError) return error(dbError.message)
        return success(data)
      } catch (e: any) {
        return error(e.message)
      }
    }
  )
}
