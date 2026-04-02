import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { supabase } from "../supabase.js"

export function registerTeamTools(server: McpServer) {
  // ── list_team_members ───────────────────────────────────────
  server.tool(
    "list_team_members",
    "List all team members with id, name, role, and color. Sorted by name.",
    {},
    async () => {
      try {
        const { data, error } = await supabase
          .from("team_members")
          .select("id, name, role, color")
          .order("name", { ascending: true })

        if (error) throw new Error(error.message)

        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }
      } catch (e: any) {
        return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }], isError: true }
      }
    }
  )
}
