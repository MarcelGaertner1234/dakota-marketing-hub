import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { supabase } from "../supabase.js"

export function registerConceptTools(server: McpServer) {
  // ── list_concepts ───────────────────────────────────────────
  server.tool(
    "list_concepts",
    "List all concepts, optionally including inactive ones. Sorted by sort_order.",
    {
      include_inactive: z.boolean().optional().describe("Include inactive concepts (default false)"),
    },
    async ({ include_inactive }) => {
      try {
        let query = supabase.from("concepts").select("*")

        if (!include_inactive) {
          query = query.eq("is_active", true)
        }

        query = query.order("sort_order", { ascending: true })

        const { data, error } = await query
        if (error) throw new Error(error.message)

        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }
      } catch (e: any) {
        return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true }
      }
    }
  )

  // ── get_concept ─────────────────────────────────────────────
  server.tool(
    "get_concept",
    "Get a single concept by ID or slug, including linked events.",
    {
      id: z.string().optional().describe("Concept UUID"),
      slug: z.string().optional().describe("Concept slug"),
    },
    async ({ id, slug }) => {
      try {
        if (!id && !slug) throw new Error("Either id or slug is required")

        let query = supabase.from("concepts").select("*, events(*)")

        if (id) {
          query = query.eq("id", id)
        } else {
          query = query.eq("slug", slug!)
        }

        const { data, error } = await query.single()
        if (error) throw new Error(error.message)

        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }
      } catch (e: any) {
        return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true }
      }
    }
  )

  // ── create_concept ──────────────────────────────────────────
  server.tool(
    "create_concept",
    "Create a new concept. Slug is auto-generated from name. Returns the created concept.",
    {
      name: z.string().describe("Concept name"),
      description: z.string().optional().describe("Description"),
      description_berndeutsch: z.string().optional().describe("Description in Berndeutsch"),
      target_audience: z.string().optional().describe("Target audience"),
      channels: z.array(z.string()).optional().describe("Marketing channels"),
      menu_description: z.string().optional().describe("Menu description"),
      price_range: z.string().optional().describe("Price range (e.g. '25-45 CHF')"),
    },
    async ({ name, description, description_berndeutsch, target_audience, channels, menu_description, price_range }) => {
      try {
        const slug = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")

        const payload: Record<string, any> = { name, slug }
        if (description !== undefined) payload.description = description
        if (description_berndeutsch !== undefined) payload.description_berndeutsch = description_berndeutsch
        if (target_audience !== undefined) payload.target_audience = target_audience
        if (channels !== undefined) payload.channels = channels
        if (menu_description !== undefined) payload.menu_description = menu_description
        if (price_range !== undefined) payload.price_range = price_range

        const { data, error } = await supabase
          .from("concepts")
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

  // ── update_concept ──────────────────────────────────────────
  server.tool(
    "update_concept",
    "Update an existing concept. Returns the updated concept.",
    {
      id: z.string().describe("Concept UUID"),
      name: z.string().optional().describe("Updated name"),
      description: z.string().optional().describe("Updated description"),
      description_berndeutsch: z.string().optional().describe("Updated Berndeutsch description"),
      target_audience: z.string().optional().describe("Updated target audience"),
      channels: z.array(z.string()).optional().describe("Updated channels"),
      menu_description: z.string().optional().describe("Updated menu description"),
      price_range: z.string().optional().describe("Updated price range"),
      is_active: z.boolean().optional().describe("Set active/inactive"),
      sort_order: z.number().optional().describe("Updated sort order"),
    },
    async ({ id, ...fields }) => {
      try {
        const payload: Record<string, any> = {}
        for (const [key, value] of Object.entries(fields)) {
          if (value !== undefined) payload[key] = value
        }

        // If name is updated, regenerate slug
        if (payload.name) {
          payload.slug = payload.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")
        }

        if (Object.keys(payload).length === 0) {
          throw new Error("No fields to update")
        }

        const { data, error } = await supabase
          .from("concepts")
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
}
