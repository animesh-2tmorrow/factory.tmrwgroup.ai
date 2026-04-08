# Agent Zero Parity Operations

Date: 2026-03-27

## Scope Added

- Projects: `/projects` + `/api/projects`
- Skills: `/skills` + `/api/skills`
- Memory: `/memory` + `/api/memory`
- Scheduler: `/scheduler` + `/api/scheduler`
- Multi-agent delegation: `/multi-agent` + `/api/delegation`
- A2A integrations: `/integrations` + `/api/a2a/*`
- Voice profile: `/voice` + `/api/voice/*`

## Data Model Migration

Migration folder:

- `prisma/migrations/202603271230_agent_zero_foundations/migration.sql`

Apply on target environment:

```bash
npm run db:migrate:deploy
```

Generate Prisma client:

```bash
npm run db:generate
```

## Runtime Context Integration

Cloud chat now injects:

- project instructions (if agent is linked to a project)
- active skills (global + project scope)
- recent memory recalls (agent/project scoped)

Assistant replies are also written to `memory_entries` as `SUMMARY`.

## MCP Security Hardening

`/api/mcp` key-auth flow now validates:

- `context.agentId` must exist
- agent ownership is resolved server-side
- user spoofing via arbitrary context `userId` is rejected

## Verification Checklist

1. Open dashboard pages:
   - `/projects`, `/skills`, `/memory`, `/scheduler`, `/multi-agent`, `/integrations`, `/voice`
2. Create a project, skill, and memory entry.
3. Link an agent to project/parent from `/create`.
4. Chat with that agent and verify:
   - responses use context from skill/memory/project
   - new summary entries appear in `/memory`.
5. Test A2A relay from `/integrations`.
