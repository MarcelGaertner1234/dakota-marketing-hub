import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { supabase, resolveConcept } from "../supabase.js"

// Helper: resolve event title/id to event UUID
async function resolveEvent(titleOrId: string): Promise<string> {
  if (titleOrId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-/i)) return titleOrId
  const { data } = await supabase
    .from("events")
    .select("id")
    .ilike("title", `%${titleOrId}%`)
    .limit(1)
    .single()
  if (!data) throw new Error(`Event '${titleOrId}' not found`)
  return data.id
}

// Helper: resolve story title/id to story UUID
async function resolveStory(titleOrId: string): Promise<string> {
  if (titleOrId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-/i)) return titleOrId
  const { data } = await supabase
    .from("stories")
    .select("id")
    .ilike("title", `%${titleOrId}%`)
    .limit(1)
    .single()
  if (!data) throw new Error(`Story '${titleOrId}' not found`)
  return data.id
}

const STORY_CATEGORIES = ["dish", "drink", "house", "crew", "location"] as const
const STORY_STATUSES = ["draft", "published"] as const

export function registerStoryTools(server: McpServer) {
  // ── list_stories ────────────────────────────────────────────
  server.tool(
    "list_stories",
    "List storytelling blätter (A5 Chesa-Rosatsch-style micro-stories) with optional filters by category, status, linked event, or linked concept. Returns stories sorted by sort_order.",
    {
      category: z
        .enum(STORY_CATEGORIES)
        .optional()
        .describe("Filter by category: dish, drink, house, crew, location"),
      status: z
        .enum(STORY_STATUSES)
        .optional()
        .describe("Filter by status: draft or published"),
      linked_event: z
        .string()
        .optional()
        .describe("Filter by linked event (title fuzzy or UUID)"),
      linked_concept: z
        .string()
        .optional()
        .describe("Filter by linked concept (name/slug or UUID)"),
      limit: z
        .number()
        .optional()
        .describe("Max results (default 50)"),
    },
    async ({ category, status, linked_event, linked_concept, limit }) => {
      try {
        let query = supabase
          .from("stories")
          .select(
            "*, linked_event:events(id, title, start_date), linked_concept:concepts(id, name, slug)"
          )
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false })
          .limit(limit ?? 50)

        if (category) query = query.eq("category", category)
        if (status) query = query.eq("status", status)
        if (linked_event) {
          const eventId = await resolveEvent(linked_event)
          query = query.eq("linked_event_id", eventId)
        }
        if (linked_concept) {
          const conceptId = await resolveConcept(linked_concept)
          query = query.eq("linked_concept_id", conceptId)
        }

        const { data, error } = await query
        if (error) throw new Error(error.message)

        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        }
      } catch (e: any) {
        return {
          content: [
            { type: "text", text: JSON.stringify({ error: e.message }) },
          ],
          isError: true,
        }
      }
    }
  )

  // ── get_story ───────────────────────────────────────────────
  server.tool(
    "get_story",
    "Get a single story by ID or fuzzy title match (e.g. 'Meringue'). Returns full content including paragraphs and linked event/concept.",
    {
      id_or_title: z
        .string()
        .describe("Story UUID or fuzzy title (e.g. 'Meringue', 'Dakota')"),
    },
    async ({ id_or_title }) => {
      try {
        const id = await resolveStory(id_or_title)
        const { data, error } = await supabase
          .from("stories")
          .select(
            "*, linked_event:events(id, title, start_date), linked_concept:concepts(id, name, slug)"
          )
          .eq("id", id)
          .single()
        if (error) throw new Error(error.message)

        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        }
      } catch (e: any) {
        return {
          content: [
            { type: "text", text: JSON.stringify({ error: e.message }) },
          ],
          isError: true,
        }
      }
    }
  )

  // ── create_story ────────────────────────────────────────────
  server.tool(
    "create_story",
    "Create a new A5 storytelling blatt in Chesa-Rosatsch style. Requires title and paragraph_1; all other fields optional. Category defaults to 'dish', status to 'draft'.",
    {
      title: z.string().describe("Story title (e.g. 'Die Meringue')"),
      subtitle: z
        .string()
        .optional()
        .describe(
          "Emotional subtitle (e.g. 'Ein Stück Meiringen auf dem Löffel')"
        ),
      category: z
        .enum(STORY_CATEGORIES)
        .optional()
        .describe("Category (default: dish)"),
      paragraph_1: z
        .string()
        .describe("Paragraph 1: origin/myth/tradition"),
      paragraph_2: z
        .string()
        .optional()
        .describe("Paragraph 2: preparation/craft/ingredients"),
      paragraph_3: z
        .string()
        .optional()
        .describe("Paragraph 3: emotional closing (short, rhythmic)"),
      footer_signature: z
        .string()
        .optional()
        .describe("Footer signature (default: 'Ihre Dakota Crew')"),
      linked_event: z
        .string()
        .optional()
        .describe("Link to event (title fuzzy or UUID)"),
      linked_concept: z
        .string()
        .optional()
        .describe("Link to concept (name/slug or UUID)"),
      status: z
        .enum(STORY_STATUSES)
        .optional()
        .describe("Status (default: draft)"),
      sort_order: z.number().optional().describe("Sort order"),
    },
    async ({
      title,
      subtitle,
      category,
      paragraph_1,
      paragraph_2,
      paragraph_3,
      footer_signature,
      linked_event,
      linked_concept,
      status,
      sort_order,
    }) => {
      try {
        const payload: Record<string, any> = { title, paragraph_1 }
        if (subtitle !== undefined) payload.subtitle = subtitle
        if (category !== undefined) payload.category = category
        if (paragraph_2 !== undefined) payload.paragraph_2 = paragraph_2
        if (paragraph_3 !== undefined) payload.paragraph_3 = paragraph_3
        if (footer_signature !== undefined)
          payload.footer_signature = footer_signature
        if (status !== undefined) payload.status = status
        if (sort_order !== undefined) payload.sort_order = sort_order
        if (linked_event)
          payload.linked_event_id = await resolveEvent(linked_event)
        if (linked_concept)
          payload.linked_concept_id = await resolveConcept(linked_concept)

        const { data, error } = await supabase
          .from("stories")
          .insert(payload)
          .select()
          .single()
        if (error) throw new Error(error.message)

        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        }
      } catch (e: any) {
        return {
          content: [
            { type: "text", text: JSON.stringify({ error: e.message }) },
          ],
          isError: true,
        }
      }
    }
  )

  // ── update_story ────────────────────────────────────────────
  server.tool(
    "update_story",
    "Update an existing story. Accepts story by UUID or fuzzy title. Only provided fields are changed.",
    {
      id_or_title: z.string().describe("Story UUID or fuzzy title"),
      title: z.string().optional(),
      subtitle: z.string().optional(),
      category: z.enum(STORY_CATEGORIES).optional(),
      paragraph_1: z.string().optional(),
      paragraph_2: z.string().optional(),
      paragraph_3: z.string().optional(),
      footer_signature: z.string().optional(),
      linked_event: z
        .string()
        .optional()
        .describe("Link to event (title fuzzy or UUID)"),
      linked_concept: z
        .string()
        .optional()
        .describe("Link to concept (name/slug or UUID)"),
      status: z.enum(STORY_STATUSES).optional(),
      sort_order: z.number().optional(),
    },
    async ({ id_or_title, linked_event, linked_concept, ...fields }) => {
      try {
        const id = await resolveStory(id_or_title)
        const payload: Record<string, any> = {}
        for (const [key, value] of Object.entries(fields)) {
          if (value !== undefined) payload[key] = value
        }
        if (linked_event)
          payload.linked_event_id = await resolveEvent(linked_event)
        if (linked_concept)
          payload.linked_concept_id = await resolveConcept(linked_concept)

        if (Object.keys(payload).length === 0) {
          throw new Error("No fields to update")
        }
        payload.updated_at = new Date().toISOString()

        const { data, error } = await supabase
          .from("stories")
          .update(payload)
          .eq("id", id)
          .select()
          .single()
        if (error) throw new Error(error.message)

        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        }
      } catch (e: any) {
        return {
          content: [
            { type: "text", text: JSON.stringify({ error: e.message }) },
          ],
          isError: true,
        }
      }
    }
  )

  // ── publish_story ───────────────────────────────────────────
  server.tool(
    "publish_story",
    "Publish a story (status → 'published'). Makes it visible on the public /story/[id] URL for QR-code access.",
    {
      id_or_title: z.string().describe("Story UUID or fuzzy title"),
    },
    async ({ id_or_title }) => {
      try {
        const id = await resolveStory(id_or_title)
        const { data, error } = await supabase
          .from("stories")
          .update({
            status: "published",
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select()
          .single()
        if (error) throw new Error(error.message)

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  ok: true,
                  id: data.id,
                  title: data.title,
                  public_url: `https://dakota-marketing-hub.vercel.app/story/${data.id}`,
                },
                null,
                2
              ),
            },
          ],
        }
      } catch (e: any) {
        return {
          content: [
            { type: "text", text: JSON.stringify({ error: e.message }) },
          ],
          isError: true,
        }
      }
    }
  )

  // ── unpublish_story ─────────────────────────────────────────
  server.tool(
    "unpublish_story",
    "Unpublish a story (status → 'draft'). Removes it from the public URL.",
    {
      id_or_title: z.string().describe("Story UUID or fuzzy title"),
    },
    async ({ id_or_title }) => {
      try {
        const id = await resolveStory(id_or_title)
        const { data, error } = await supabase
          .from("stories")
          .update({ status: "draft", updated_at: new Date().toISOString() })
          .eq("id", id)
          .select()
          .single()
        if (error) throw new Error(error.message)

        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        }
      } catch (e: any) {
        return {
          content: [
            { type: "text", text: JSON.stringify({ error: e.message }) },
          ],
          isError: true,
        }
      }
    }
  )

  // ── delete_story ────────────────────────────────────────────
  server.tool(
    "delete_story",
    "Permanently delete a story. Accepts story by UUID or fuzzy title.",
    {
      id_or_title: z.string().describe("Story UUID or fuzzy title"),
    },
    async ({ id_or_title }) => {
      try {
        const id = await resolveStory(id_or_title)
        const { error } = await supabase
          .from("stories")
          .delete()
          .eq("id", id)
        if (error) throw new Error(error.message)

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ ok: true, deleted_id: id }),
            },
          ],
        }
      } catch (e: any) {
        return {
          content: [
            { type: "text", text: JSON.stringify({ error: e.message }) },
          ],
          isError: true,
        }
      }
    }
  )

  // ── generate_story_illustration ─────────────────────────────
  server.tool(
    "generate_story_illustration",
    "Generate a hand-drawn KI illustration for a story in the Chesa-Rosatsch Tusche-Aquarell style. Uses GPT Image 1.5 via AI Gateway, takes 15-30s, ~$0.18 per image. The new image automatically replaces any existing illustration on the story.",
    {
      id_or_title: z
        .string()
        .describe("Story UUID or fuzzy title (e.g. 'Meringue')"),
      hint: z
        .string()
        .optional()
        .describe(
          "Optional style hint, z.B. 'wärmere Töne', 'mehr Aquarell', 'rustikaler'"
        ),
    },
    async ({ id_or_title, hint }) => {
      try {
        const id = await resolveStory(id_or_title)
        const formData = new FormData()
        if (hint) formData.set("hint", hint)
        const res = await fetch(
          `https://dakota-marketing-hub.vercel.app/api/stories/${id}/generate-illustration`,
          { method: "POST", body: formData }
        )
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || `HTTP ${res.status}`)
        }
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        }
      } catch (e: any) {
        return {
          content: [
            { type: "text", text: JSON.stringify({ error: e.message }) },
          ],
          isError: true,
        }
      }
    }
  )
}
