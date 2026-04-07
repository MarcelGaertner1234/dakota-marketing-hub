import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { supabase } from "../supabase.js"

// Production base URL — same convention as the public_url constants in
// stories.ts. The KI generators run on the deployed Vercel functions
// (where AI Gateway auth + OIDC tokens are configured) so all KI tools
// here call those endpoints via fetch.
const DAKOTA_BASE_URL = "https://dakota-marketing-hub.vercel.app"

// ──────────────────────────────────────────────────────────────
// Helper: resolve UUID or fuzzy guest_name match → row id
// ──────────────────────────────────────────────────────────────
async function resolveTischkarte(idOrGuestName: string): Promise<string> {
  if (idOrGuestName.match(/^[0-9a-f]{8}-[0-9a-f]{4}-/i)) return idOrGuestName

  // Most-recent first — Marcel often refers to "die Karte für Müller"
  // and means the latest one for that guest
  const { data } = await supabase
    .from("tischkarten")
    .select("id")
    .ilike("guest_name", `%${idOrGuestName}%`)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (!data) throw new Error(`Tischkarte für '${idOrGuestName}' nicht gefunden`)
  return data.id
}

const OCCASIONS = [
  "birthday",
  "anniversary",
  "business",
  "family",
  "wedding",
  "none",
] as const

export function registerTischkartenTools(server: McpServer) {
  // ── list_tischkarten ──────────────────────────────────────────
  server.tool(
    "list_tischkarten",
    "List Dakota Tischkarten (personalized A5 reservation cards) with optional filters by occasion or date range. Returns most recent first.",
    {
      occasion: z
        .enum(OCCASIONS)
        .optional()
        .describe("Filter by occasion (birthday, anniversary, business, family, wedding, none)"),
      date_from: z
        .string()
        .optional()
        .describe("ISO date (YYYY-MM-DD) — only tischkarten with reservation_date >= this"),
      date_to: z
        .string()
        .optional()
        .describe("ISO date (YYYY-MM-DD) — only tischkarten with reservation_date <= this"),
      limit: z
        .number()
        .optional()
        .describe("Max results (default 50)"),
    },
    async ({ occasion, date_from, date_to, limit }) => {
      try {
        let query = supabase
          .from("tischkarten")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit ?? 50)

        if (occasion) query = query.eq("occasion", occasion)
        if (date_from) query = query.gte("reservation_date", date_from)
        if (date_to) query = query.lte("reservation_date", date_to)

        const { data, error } = await query
        if (error) throw new Error(error.message)

        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        }
      } catch (e: any) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: e.message }) }],
          isError: true,
        }
      }
    }
  )

  // ── get_tischkarte ────────────────────────────────────────────
  server.tool(
    "get_tischkarte",
    "Get a single tischkarte by UUID or fuzzy guest name match (returns the most recent matching one).",
    {
      id_or_guest: z
        .string()
        .describe("Tischkarte UUID or fuzzy guest name (e.g. 'Müller', 'Familie Schmidt')"),
    },
    async ({ id_or_guest }) => {
      try {
        const id = await resolveTischkarte(id_or_guest)
        const { data, error } = await supabase
          .from("tischkarten")
          .select("*")
          .eq("id", id)
          .single()
        if (error) throw new Error(error.message)

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  ...data,
                  preview_url: `${DAKOTA_BASE_URL}/tischkarten/${data.id}/preview`,
                  detail_url: `${DAKOTA_BASE_URL}/tischkarten/${data.id}`,
                },
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

  // ── create_tischkarte ─────────────────────────────────────────
  server.tool(
    "create_tischkarte",
    "Create a new Dakota Tischkarte for a reservation. KI generates the personalized title + 3 warm welcome paragraphs in the Dakota voice (Claude Haiku 4.5, ~2 seconds, ~$0.001). Returns the new tischkarte with preview URL ready to print.",
    {
      guest_name: z
        .string()
        .describe("Wie der Gast auf der Karte begrüsst werden soll, z.B. 'Familie Müller', 'Herr Schmidt', 'Anna & Tom'"),
      occasion: z
        .enum(OCCASIONS)
        .optional()
        .describe("Anlass — birthday, anniversary, business, family, wedding, oder none (default)"),
      party_size: z
        .number()
        .optional()
        .describe("Personenanzahl — z.B. 4"),
      reservation_date: z
        .string()
        .optional()
        .describe("Reservierungsdatum als ISO YYYY-MM-DD, z.B. '2026-04-12'"),
      table_number: z
        .string()
        .optional()
        .describe("Tischnummer, z.B. '7' oder 'Stube'"),
      custom_hint: z
        .string()
        .optional()
        .describe("Free-text Hinweis für die KI, z.B. '50. Geburtstag der Mutter, kommen aus Bern, war schon vor 5 Jahren da'"),
    },
    async (input) => {
      try {
        const res = await fetch(`${DAKOTA_BASE_URL}/api/tischkarten`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || `HTTP ${res.status}`)
        }
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        }
      } catch (e: any) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: e.message }) }],
          isError: true,
        }
      }
    }
  )

  // ── regenerate_tischkarte_text ────────────────────────────────
  server.tool(
    "regenerate_tischkarte_text",
    "Regenerate the KI text (title + 3 paragraphs) for an existing tischkarte, using its stored inputs. Useful when the first generation didn't hit the right tone.",
    {
      id_or_guest: z
        .string()
        .describe("Tischkarte UUID or fuzzy guest name"),
    },
    async ({ id_or_guest }) => {
      try {
        const id = await resolveTischkarte(id_or_guest)
        const res = await fetch(
          `${DAKOTA_BASE_URL}/api/tischkarten/${id}/regenerate-text`,
          { method: "POST" }
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
          content: [{ type: "text", text: JSON.stringify({ error: e.message }) }],
          isError: true,
        }
      }
    }
  )

  // ── generate_tischkarte_illustration ──────────────────────────
  server.tool(
    "generate_tischkarte_illustration",
    "Generate a custom KI illustration for a tischkarte (replacing the default Dakota welcome image). Uses GPT Image 1.5 via AI Gateway, takes 15-30s, ~$0.18. Pass an optional hint to steer the style.",
    {
      id_or_guest: z
        .string()
        .describe("Tischkarte UUID or fuzzy guest name"),
      hint: z
        .string()
        .optional()
        .describe("Optional style hint, z.B. 'mit Bergblick', 'romantischer', 'mehr Kerzen'"),
    },
    async ({ id_or_guest, hint }) => {
      try {
        const id = await resolveTischkarte(id_or_guest)
        const formData = new FormData()
        if (hint) formData.set("hint", hint)
        const res = await fetch(
          `${DAKOTA_BASE_URL}/api/tischkarten/${id}/generate-illustration`,
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
          content: [{ type: "text", text: JSON.stringify({ error: e.message }) }],
          isError: true,
        }
      }
    }
  )

  // ── update_tischkarte_illustration ────────────────────────────
  server.tool(
    "update_tischkarte_illustration",
    "Manually set or unset the illustration_url of a tischkarte. Pass null to revert to the default image.",
    {
      id_or_guest: z
        .string()
        .describe("Tischkarte UUID or fuzzy guest name"),
      illustration_url: z
        .string()
        .nullable()
        .describe("Public image URL or null to revert to default"),
    },
    async ({ id_or_guest, illustration_url }) => {
      try {
        const id = await resolveTischkarte(id_or_guest)
        const { data, error } = await supabase
          .from("tischkarten")
          .update({
            illustration_url,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select()
          .single()
        if (error) throw new Error(error.message)
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        }
      } catch (e: any) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: e.message }) }],
          isError: true,
        }
      }
    }
  )

  // ── delete_tischkarte ─────────────────────────────────────────
  server.tool(
    "delete_tischkarte",
    "Permanently delete a tischkarte. Accepts UUID or fuzzy guest name.",
    {
      id_or_guest: z
        .string()
        .describe("Tischkarte UUID or fuzzy guest name"),
    },
    async ({ id_or_guest }) => {
      try {
        const id = await resolveTischkarte(id_or_guest)
        const { error } = await supabase
          .from("tischkarten")
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
          content: [{ type: "text", text: JSON.stringify({ error: e.message }) }],
          isError: true,
        }
      }
    }
  )
}
