import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { supabase } from "../supabase.js"

export function registerSocialTools(server: McpServer) {
  // ── list_posts ──────────────────────────────────────────────
  server.tool(
    "list_posts",
    "List social posts with optional filters. Returns posts with linked event and concept names.",
    {
      status: z.string().optional().describe("Filter by status (draft, scheduled, published)"),
      platform: z.string().optional().describe("Filter by platform (instagram, facebook, tiktok)"),
      event_id: z.string().optional().describe("Filter by event ID"),
      concept_id: z.string().optional().describe("Filter by concept ID"),
      limit: z.number().optional().default(50).describe("Max results (default 50)"),
    },
    async ({ status, platform, event_id, concept_id, limit }) => {
      try {
        let query = supabase
          .from("social_posts")
          .select("*, event:events(id, title), concept:concepts(id, name)")
          .order("scheduled_at", { ascending: true, nullsFirst: false })
          .limit(limit ?? 50)

        if (status) query = query.eq("status", status)
        if (platform) query = query.eq("platform", platform)
        if (event_id) query = query.eq("event_id", event_id)
        if (concept_id) query = query.eq("concept_id", concept_id)

        const { data, error } = await query
        if (error) throw new Error(error.message)

        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }
      } catch (e: any) {
        return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true }
      }
    }
  )

  // ── get_post ────────────────────────────────────────────────
  server.tool(
    "get_post",
    "Get a single social post by ID with event and concept details.",
    {
      id: z.string().describe("Post ID"),
    },
    async ({ id }) => {
      try {
        const { data, error } = await supabase
          .from("social_posts")
          .select("*, event:events(id, title, start_date), concept:concepts(id, name)")
          .eq("id", id)
          .single()

        if (error) throw new Error(error.message)

        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }
      } catch (e: any) {
        return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true }
      }
    }
  )

  // ── create_post ─────────────────────────────────────────────
  server.tool(
    "create_post",
    "Create a new social post.",
    {
      title: z.string().describe("Post title"),
      platform: z.enum(["instagram", "facebook", "tiktok"]).describe("Platform"),
      post_type: z.enum(["post", "story", "reel", "short"]).optional().default("post").describe("Post type (default: post)"),
      caption: z.string().optional().describe("Post caption text"),
      hashtags: z.array(z.string()).optional().describe("Array of hashtags"),
      scheduled_at: z.string().optional().describe("ISO datetime for scheduling"),
      status: z.string().optional().default("draft").describe("Post status (default: draft)"),
      event_id: z.string().optional().describe("Linked event ID"),
      concept_id: z.string().optional().describe("Linked concept ID"),
      series_id: z.string().optional().describe("Series ID for grouped posts"),
      series_order: z.number().optional().describe("Order within a series"),
    },
    async ({ title, platform, post_type, caption, hashtags, scheduled_at, status, event_id, concept_id, series_id, series_order }) => {
      try {
        const insert: Record<string, any> = {
          title,
          platform,
          post_type: post_type ?? "post",
          status: status ?? "draft",
        }

        if (caption !== undefined) insert.caption = caption
        if (hashtags !== undefined) insert.hashtags = hashtags
        if (scheduled_at !== undefined) insert.scheduled_at = scheduled_at
        if (event_id !== undefined) insert.event_id = event_id
        if (concept_id !== undefined) insert.concept_id = concept_id
        if (series_id !== undefined) insert.series_id = series_id
        if (series_order !== undefined) insert.series_order = series_order

        const { data, error } = await supabase
          .from("social_posts")
          .insert(insert)
          .select()
          .single()

        if (error) throw new Error(error.message)

        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }
      } catch (e: any) {
        return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true }
      }
    }
  )

  // ── update_post ─────────────────────────────────────────────
  server.tool(
    "update_post",
    "Update an existing social post. If status is set to 'published', published_at is auto-set.",
    {
      id: z.string().describe("Post ID"),
      title: z.string().optional().describe("Post title"),
      platform: z.enum(["instagram", "facebook", "tiktok"]).optional().describe("Platform"),
      post_type: z.enum(["post", "story", "reel", "short"]).optional().describe("Post type"),
      caption: z.string().optional().describe("Post caption text"),
      hashtags: z.array(z.string()).optional().describe("Array of hashtags"),
      scheduled_at: z.string().optional().describe("ISO datetime for scheduling"),
      status: z.string().optional().describe("Post status"),
      event_id: z.string().optional().describe("Linked event ID"),
      concept_id: z.string().optional().describe("Linked concept ID"),
      series_id: z.string().optional().describe("Series ID"),
      series_order: z.number().optional().describe("Order within a series"),
    },
    async ({ id, title, platform, post_type, caption, hashtags, scheduled_at, status, event_id, concept_id, series_id, series_order }) => {
      try {
        const updates: Record<string, any> = {}

        if (title !== undefined) updates.title = title
        if (platform !== undefined) updates.platform = platform
        if (post_type !== undefined) updates.post_type = post_type
        if (caption !== undefined) updates.caption = caption
        if (hashtags !== undefined) updates.hashtags = hashtags
        if (scheduled_at !== undefined) updates.scheduled_at = scheduled_at
        if (status !== undefined) {
          updates.status = status
          if (status === "published") {
            updates.published_at = new Date().toISOString()
          }
        }
        if (event_id !== undefined) updates.event_id = event_id
        if (concept_id !== undefined) updates.concept_id = concept_id
        if (series_id !== undefined) updates.series_id = series_id
        if (series_order !== undefined) updates.series_order = series_order

        const { data, error } = await supabase
          .from("social_posts")
          .update(updates)
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

  // ── delete_post ─────────────────────────────────────────────
  server.tool(
    "delete_post",
    "Delete a social post by ID.",
    {
      id: z.string().describe("Post ID"),
    },
    async ({ id }) => {
      try {
        const { error } = await supabase
          .from("social_posts")
          .delete()
          .eq("id", id)

        if (error) throw new Error(error.message)

        return { content: [{ type: "text", text: JSON.stringify({ success: true }) }] }
      } catch (e: any) {
        return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true }
      }
    }
  )

  // ── generate_social_illustration ────────────────────────────
  server.tool(
    "generate_social_illustration",
    "Generate a KI illustration for a social media post in the Dakota hand-drawn style. Auto-maps the platform to the optimal aspect ratio (Instagram → square, Facebook → landscape, TikTok → portrait). Uses GPT Image 1.5, takes 15-30s, ~$0.18.",
    {
      post_id: z.string().describe("Social post UUID"),
      hint: z
        .string()
        .optional()
        .describe("Optional style hint, z.B. 'mit Bergblick', 'wärmere Töne'"),
      size: z
        .enum(["1024x1024", "1536x1024", "1024x1536"])
        .optional()
        .describe(
          "Override the auto-mapped size (square / landscape / portrait). Default is auto from platform."
        ),
    },
    async ({ post_id, hint, size }) => {
      try {
        const formData = new FormData()
        if (hint) formData.set("hint", hint)
        if (size) formData.set("size", size)
        const res = await fetch(
          `https://dakota-marketing-hub.vercel.app/api/social/${post_id}/generate-illustration`,
          { method: "POST", body: formData }
        )
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || `HTTP ${res.status}`)
        }
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }
      } catch (e: any) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: e.message }) }],
          isError: true,
        }
      }
    }
  )

  // ── generate_social_caption ─────────────────────────────────
  server.tool(
    "generate_social_caption",
    "Generate a KI caption + hashtags for a social media post in the Dakota voice. Plattform-specific (short hooks for Instagram/TikTok, longer for Facebook). Uses Claude Haiku 4.5, ~2s, ~$0.001. Returns the generated text WITHOUT persisting — call update_post separately if you want to save it.",
    {
      post_id: z.string().describe("Social post UUID"),
      hint: z
        .string()
        .optional()
        .describe(
          "Optional Marcel-input, z.B. 'Fokus auf Familien', 'Erwähn das Wetter'"
        ),
      auto_save: z
        .boolean()
        .optional()
        .describe(
          "If true, automatically saves the generated caption + hashtags to the post. Default false (returns only)."
        ),
    },
    async ({ post_id, hint, auto_save }) => {
      try {
        const formData = new FormData()
        if (hint) formData.set("hint", hint)
        const res = await fetch(
          `https://dakota-marketing-hub.vercel.app/api/social/${post_id}/generate-caption`,
          { method: "POST", body: formData }
        )
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || `HTTP ${res.status}`)
        }

        // Optional: persist to the post immediately
        if (auto_save && data.caption) {
          const { error } = await supabase
            .from("social_posts")
            .update({
              caption: data.caption,
              hashtags: data.hashtags,
              updated_at: new Date().toISOString(),
            })
            .eq("id", post_id)
          if (error) throw new Error(`auto_save failed: ${error.message}`)
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { ...data, saved: auto_save === true },
                null,
                2
              ),
            },
          ],
        }
      } catch (e: any) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: e.message }) }],
          isError: true,
        }
      }
    }
  )
}
