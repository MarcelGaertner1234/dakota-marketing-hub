import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { supabase } from "../supabase.js"

export function registerReviewTools(server: McpServer) {
  // ── get_review_stats ────────────────────────────────────────
  server.tool(
    "get_review_stats",
    "Get aggregated review statistics: average food, ambience, service ratings, total count, and overall average.",
    {},
    async () => {
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select("food_rating, ambience_rating, service_rating")

        if (error) throw new Error(error.message)

        if (!data || data.length === 0) {
          return {
            content: [{ type: "text", text: JSON.stringify({ food: 0, ambience: 0, service: 0, total: 0, average: 0 }) }],
          }
        }

        const total = data.length
        const food = data.reduce((sum, r) => sum + (r.food_rating ?? 0), 0) / total
        const ambience = data.reduce((sum, r) => sum + (r.ambience_rating ?? 0), 0) / total
        const service = data.reduce((sum, r) => sum + (r.service_rating ?? 0), 0) / total
        const average = (food + ambience + service) / 3

        const round1 = (n: number) => Math.round(n * 10) / 10

        const stats = {
          food: round1(food),
          ambience: round1(ambience),
          service: round1(service),
          total,
          average: round1(average),
        }

        return { content: [{ type: "text", text: JSON.stringify(stats, null, 2) }] }
      } catch (e: any) {
        return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true }
      }
    }
  )

  // ── list_reviews ────────────────────────────────────────────
  server.tool(
    "list_reviews",
    "List reviews sorted by newest first. Optionally filter by minimum rating across all categories.",
    {
      limit: z.number().optional().default(20).describe("Max results (default 20)"),
      min_rating: z.number().optional().describe("Minimum rating — filters where all three ratings >= this value"),
    },
    async ({ limit, min_rating }) => {
      try {
        let query = supabase
          .from("reviews")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit ?? 20)

        if (min_rating !== undefined) {
          query = query
            .gte("food_rating", min_rating)
            .gte("ambience_rating", min_rating)
            .gte("service_rating", min_rating)
        }

        const { data, error } = await query
        if (error) throw new Error(error.message)

        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }
      } catch (e: any) {
        return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true }
      }
    }
  )

  // ── claim_goody ─────────────────────────────────────────────
  server.tool(
    "claim_goody",
    "Mark a review's goody as claimed.",
    {
      review_id: z.string().describe("Review ID"),
    },
    async ({ review_id }) => {
      try {
        const { data, error } = await supabase
          .from("reviews")
          .update({ goody_claimed: true })
          .eq("id", review_id)
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
