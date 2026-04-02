# Dakota MCP Server — Design Spec

## Purpose

MCP server that connects Claude Code directly to the Dakota Marketing Hub database. Enables bidirectional data access and moduluebergreifende workflows — from single CRUD operations to full campaign creation in one call.

## Architecture

```
Claude Code <-> stdio <-> dakota-mcp (Node.js/TypeScript) <-> Supabase (Postgres + Storage)
```

- **Runtime:** Standalone Node.js process, started by Claude Code via stdio
- **Location:** `mcp/` directory in the dakota-marketing-hub repo
- **DB access:** Direct Supabase connection using Service Role Key (no RLS)
- **Protocol:** MCP via `@modelcontextprotocol/sdk` (stdio transport)
- **No Auth:** Internal team tool, same as the web app

## File Structure

```
mcp/
├── index.ts          — Entry point: MCP server setup, tool registration
├── supabase.ts       — Supabase client singleton (Service Key from env)
├── tools/
│   ├── events.ts     — Event CRUD + holidays
│   ├── tasks.ts      — Task CRUD
│   ├── leads.ts      — Lead CRUD + activities
│   ├── concepts.ts   — Concept CRUD
│   ├── social.ts     — Social post CRUD
│   ├── reviews.ts    — Review stats + list + goody
│   ├── team.ts       — Team members (read-only)
│   └── workflows.ts  — Campaign creation, lead invites, dashboard
├── package.json
└── tsconfig.json
```

## Dependencies

```json
{
  "@modelcontextprotocol/sdk": "^1.12.0",
  "@supabase/supabase-js": "^2.101.1",
  "tsx": "^4.19.0",
  "typescript": "^5"
}
```

## Tools (31 total)

### Events (6 tools)

**`list_events`**
- Params: `year?: number`, `month?: number`, `event_type?: string`, `concept_id?: string`, `limit?: number`
- Returns: Array of events with concept name
- Default: upcoming events, sorted by start_date

**`get_event`**
- Params: `id: string`
- Returns: Event with tasks (incl. assigned member), concept, linked leads

**`create_event`**
- Params: `title: string`, `start_date: string`, `event_type?: string`, `description?: string`, `start_time?: string`, `end_time?: string`, `end_date?: string`, `location?: string`, `concept_id?: string`, `concept_slug?: string` (lookup by slug), `lead_time_days?: number`, `recurrence?: string`, `recurrence_end_date?: string`
- Returns: Created event
- Note: If `concept_slug` is provided instead of `concept_id`, resolve the ID via slug lookup. If `recurrence` is set with `recurrence_end_date`, generate child events (same logic as web app).

**`update_event`**
- Params: `id: string`, plus any field from create_event
- Returns: Updated event

**`delete_event`**
- Params: `id: string`
- Returns: `{ success: true }`

**`get_holidays`**
- Params: `year?: number` (default: current year)
- Returns: Array of holidays

### Tasks (4 tools)

**`list_tasks`**
- Params: `event_id?: string`, `status?: string`, `assigned_to?: string` (name or ID), `limit?: number`
- Returns: Tasks with assigned member name and event title
- Note: Uses `!tasks_assigned_to_fkey` hint on all joins

**`create_task`**
- Params: `event_id: string`, `title: string`, `priority?: string`, `assigned_to?: string` (name or ID), `due_date?: string`, `description?: string`
- Returns: Created task
- Note: If `assigned_to` is a name (not UUID), resolve to team_member ID

**`update_task`**
- Params: `id: string`, plus any field from create_task, `status?: string`
- Returns: Updated task

**`complete_task`**
- Params: `id: string`
- Returns: Updated task with status=done and completed_at set

### Leads (5 tools)

**`list_leads`**
- Params: `status?: string`, `lead_type?: string`, `search?: string` (name/company), `limit?: number`
- Returns: Leads sorted by updated_at desc

**`get_lead`**
- Params: `id: string`
- Returns: Lead with activities and linked events

**`create_lead`**
- Params: `name: string`, `lead_type?: string`, `company?: string`, `email?: string`, `phone?: string`, `address?: string`, `notes?: string`, `tags?: string[]`
- Returns: Created lead

**`update_lead`**
- Params: `id: string`, plus any field from create_lead, `status?: string`
- Returns: Updated lead

**`add_lead_activity`**
- Params: `lead_id: string`, `activity_type: string` (anruf/email/treffen/nachricht/notiz), `description: string`, `contacted_by?: string` (name or ID)
- Returns: Created activity

### Concepts (4 tools)

**`list_concepts`**
- Params: `include_inactive?: boolean`
- Returns: All concepts sorted by sort_order

**`get_concept`**
- Params: `id: string` or `slug: string`
- Returns: Concept with linked events

**`create_concept`**
- Params: `name: string`, `description?: string`, `description_berndeutsch?: string`, `target_audience?: string`, `channels?: string[]`, `menu_description?: string`, `price_range?: string`
- Returns: Created concept (slug auto-generated from name)

**`update_concept`**
- Params: `id: string`, plus any field from create_concept
- Returns: Updated concept

### Social Posts (5 tools)

**`list_posts`**
- Params: `status?: string`, `platform?: string`, `event_id?: string`, `concept_id?: string`, `limit?: number`
- Returns: Posts with event and concept names

**`get_post`**
- Params: `id: string`
- Returns: Post with event and concept details

**`create_post`**
- Params: `title: string`, `platform: string` (instagram/facebook/tiktok), `post_type?: string` (post/story/reel/short), `caption?: string`, `hashtags?: string[]`, `scheduled_at?: string`, `status?: string`, `event_id?: string`, `concept_id?: string`, `series_id?: string`, `series_order?: number`
- Returns: Created post

**`update_post`**
- Params: `id: string`, plus any field from create_post
- Returns: Updated post

**`delete_post`**
- Params: `id: string`
- Returns: `{ success: true }`

### Reviews (3 tools)

**`get_review_stats`**
- Params: none
- Returns: `{ food: number, ambience: number, service: number, total: number, average: number }`

**`list_reviews`**
- Params: `limit?: number`, `min_rating?: number`
- Returns: Reviews sorted by created_at desc

**`claim_goody`**
- Params: `review_id: string`
- Returns: Updated review with goody_claimed=true

### Team (1 tool)

**`list_team_members`**
- Params: none
- Returns: All team members with id, name, role, color

### Workflows (3 tools)

**`create_event_campaign`**
- Params:
  ```
  title: string
  start_date: string
  event_type?: string (default: "concept_event")
  concept?: string (slug or ID)
  description?: string
  start_time?: string
  end_time?: string
  location?: string
  lead_time_days?: number
  tasks?: Array<{
    title: string
    assigned_to?: string (name)
    due_date?: string
    priority?: string
  }>
  social_posts?: Array<{
    platform: string
    post_type?: string
    title: string
    caption?: string
    hashtags?: string[]
    scheduled_at?: string
  }>
  invite_leads?: string[] (names or IDs)
  ```
- Returns: `{ event, tasks, posts, invited_leads }` — all created objects
- Logic:
  1. Resolve concept slug to ID if needed
  2. Create event
  3. Create tasks with event_id, resolve assigned_to names to IDs
  4. Create social posts with event_id and concept_id
  5. For each lead name: find by name search, create lead_events entry, log activity "Eingeladen zu [event title]"

**`invite_lead_to_event`**
- Params: `lead: string` (name or ID), `event_id: string`, `status?: string`, `notes?: string`
- Returns: `{ lead_event, activity }`
- Logic: Resolve lead by name if needed, create lead_events row, log lead_activity with type "notiz" and description "Eingeladen zu [event title]"

**`get_dashboard`**
- Params: none
- Returns:
  ```
  {
    stats: { events_this_month, active_leads, concepts, reviews_total, review_average },
    upcoming_events: [...top 5],
    open_tasks: [...top 5],
    recent_reviews: [...top 3]
  }
  ```

## Name Resolution Convention

Many tools accept human-readable names instead of UUIDs:
- **Team members:** `assigned_to: "Vanessa"` resolves to her UUID via case-insensitive name match
- **Concepts:** `concept: "afterwork"` resolves via slug or name match
- **Leads:** `lead: "Sportverein Meiringen"` resolves via case-insensitive name/company search

This makes Claude Code conversations natural: "Weise die Task Thomas zu" instead of requiring UUIDs.

## Error Handling

- All tools return structured errors: `{ error: string, details?: string }`
- DB errors are caught and returned with the Supabase error message
- Name resolution failures return: `{ error: "Team member 'XY' not found" }`
- Missing required params caught before DB call

## Registration

```json
// .mcp.json in project root (env vars loaded from .env.local)
{
  "mcpServers": {
    "dakota": {
      "command": "npx",
      "args": ["tsx", "mcp/index.ts"],
      "cwd": "<project-root>/mcp",
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_SERVICE_KEY": "${SUPABASE_SERVICE_KEY}"
      }
    }
  }
}
```

Env vars are read from `.env.local` (not committed) which contains `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`.
