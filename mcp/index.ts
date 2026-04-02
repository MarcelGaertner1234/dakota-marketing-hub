import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { registerEventTools } from "./tools/events.js"
import { registerTaskTools } from "./tools/tasks.js"
import { registerLeadTools } from "./tools/leads.js"
import { registerConceptTools } from "./tools/concepts.js"
import { registerSocialTools } from "./tools/social.js"
import { registerReviewTools } from "./tools/reviews.js"
import { registerTeamTools } from "./tools/team.js"
import { registerWorkflowTools } from "./tools/workflows.js"

const server = new McpServer({
  name: "dakota-mcp",
  version: "1.0.0",
})

// Register all tool modules
registerEventTools(server)
registerTaskTools(server)
registerLeadTools(server)
registerConceptTools(server)
registerSocialTools(server)
registerReviewTools(server)
registerTeamTools(server)
registerWorkflowTools(server)

// Start server
const transport = new StdioServerTransport()
await server.connect(transport)
