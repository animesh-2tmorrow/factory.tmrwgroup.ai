# Cloud Agent Runtime (ECS + Bedrock + MCP)

This adds a third agent platform (`CLOUD`) in Venture Factory.

Flow:

1. User buys/has plan.
2. User opens `/create` and selects a runtime profile (`TMRW Cloud Runtime` or `Webster Chrome Runtime`).
3. API creates `agent` row and starts ECS task with Cloud env.
4. User opens `/agents/{id}/chat`.
5. Chat route proxies to per-agent runner endpoint when available (required by default).
6. Runner executes Bedrock turns + workspace tools (`shell_command`, file ops, web tools).
7. Token/latency usage is stored in `agent_usage_events`.
8. Each agent now runs in an isolated workspace root at `/workspace/agents/<agent_id>` by default.

## Runtime Profiles

- `GENERAL`
  - No bootstrap actions.
  - Starts with empty `/workspace`.
- `WEBSTER_EXTENSION`
  - Bootstraps repo: `git@github.com:tmrwgroup/webster-chrome-extension.git`
  - Branch: `main`
  - Startup commands: `npm ci` then `npm run build`
  - Runner health now exposes `bootstrap.state`, `bootstrap.steps`, and `projectDir`.

## Required Environment Variables

- `AWS_REGION=us-east-1`
- `ECS_CLUSTER_ARN`
- `ECS_TASK_DEFINITION_ARN`
- `ECS_CLOUD_TASK_DEFINITION_ARN` (optional, defaults to `ECS_TASK_DEFINITION_ARN`)
- `ECS_SUBNET_IDS` (comma-separated)
- `ECS_SECURITY_GROUP_IDS` (comma-separated)
- `ECS_EFS_FILE_SYSTEM_ID` (required for persistent workspaces)
- `ECS_EFS_ACCESS_POINT_ID` (recommended)
- `ECS_EFS_ROOT_DIRECTORY` (optional, default `/`)
- `ECS_EFS_TRANSIT_ENCRYPTION` (optional, default `ENABLED`)
- `ECS_EFS_IAM` (optional, default `ENABLED`)
- `ECS_EFS_VOLUME_NAME` (optional, default `workspace-efs`)
- `AGENT_CONTAINER_NAME` (default `agent`)
- `MCP_SHARED_KEY` (required for server-to-server MCP calls)
- `MCP_BASE_URL` (optional; default is `${APP_URL}/api/mcp`)
- `CLOUD_AGENT_MODEL` (optional; default `global.anthropic.claude-haiku-4-5-20251001-v1:0`)
- `ANTHROPIC_MODEL` (fallback model value)
- `CLAUDE_CODE_USE_BEDROCK=1` (set in ECS override)
- `CLOUD_CHAT_REQUIRE_RUNNER` (optional; defaults to `true`, set `false` only for fallback/debug)
- `AGENT_GIT_SSH_PRIVATE_KEY_B64` (recommended for private repo bootstrap, base64 encoded)
- `AGENT_GIT_SSH_PRIVATE_KEY` (fallback plain key env; avoid when possible)
- `AGENT_WORKSPACE_BASE` (optional; defaults to `/workspace/agents`)
- `AGENT_WORKSPACE_MOUNT_PATH` (optional; defaults to `/workspace`)

## Database Changes

Migration file:

- `prisma/migrations/202603191730_cloud_agent_chat_usage/migration.sql`

Adds:

- `AgentPlatform.CLOUD`
- `agent_usage_events`
- `agent_chat_messages`
- cloud metadata columns on `agents`

## Verification

1. Health:
   - `GET /api/health` returns `database: ok`.
2. MCP auth:
   - `POST /api/mcp` with valid `x-mcp-key` and `tools/list` returns tool list.
3. UI:
   - `/create` shows `Cloud Agent` in platform selector.
   - `/agents` shows `CLOUD` agents and `Open Chat`.
   - `/agents/:id/chat` persists sessions/messages across refresh (server + local cache).
4. Data:
   - Chat messages persist in `agent_chat_messages`.
   - Usage rows persist in `agent_usage_events`.

## Notes

- If `MCP_SHARED_KEY` is missing, tool calls from Cloud chat will fail with unauthorized.
- `mpc.tmrwgroup.ai` can be introduced later as a dedicated MCP host; current default is in-app `/api/mcp`.
- Workspace paths are now isolated by default (`/workspace/agents/<agent_id>`), which is the baseline for Agent Zero-style per-project isolation.
- When EFS vars are configured, provisioning auto-registers an EFS-mounted cloud task definition revision and runs agents on that revision.
