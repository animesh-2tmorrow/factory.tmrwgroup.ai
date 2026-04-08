# Claude Handover - Venture Factory + CloudAgent Runtime

Date: 2026-03-20 (IST)  
Prepared by: Codex (takeover after Claude token exhaustion)  
Primary target app: `https://factory.tmrwgroup.ai`  
Secondary infra touched during takeover: `openclaw-backend` ECS/ECR (`api.clawapi.io`)

## 1) Why This Handover Exists

Claude hit token limits during ongoing Factory work. I resumed from the point where Claude had left planning/execution in progress and continued through UI/runtime fixes, deployment troubleshooting, and infrastructure remediation.

This file is intended so Claude can resume without losing continuity, then continue implementation until next checkpoint.

## 2) Scope of What Happened (from Claude cutoff -> now)

### 2.1 Where Claude had stopped

- Claude was in plan/execution mode around Venture Factory dashboard + CloudAgent flow, and had left partial tasks.
- User specifically highlighted Claude had stopped during local package/layout work and planned ECS/runtime extensions.

### 2.2 What I took over and completed

1. Investigated broken `/district`/`/collective`/`/watch` and login loop behavior.
2. Fixed/iterated chat page reliability for CloudAgent:
   - `Unexpected end of JSON input`
   - `Failed to load agent (400)`
   - `Failed to load sessions (400)`
3. Deployed multiple live hotfixes to `factory.tmrwgroup.ai` EC2 container.
4. For separate user request, repaired `openclaw-backend` ECR/ECS deployment path:
   - missing image in ECR
   - task cannot pull image
5. Switched backend image line to Ubuntu 22.04 build path, built and rolled ECS service (manual + coordinated).
6. Expanded Factory EC2 root storage from 8 GB to 50 GB and grew filesystem.

### 2.3 What is still pending

1. Factory instance type upgrade from `t3.small` to `t3.large` (requested, not yet executed).
2. Main architectural ask: true VM-like CloudAgent runtime (shell/file workspace) is not implemented yet.
3. Existing cloud chat still runs in control plane app process (not in per-agent ECS runtime container).

## 3) Current Live State Snapshot

## 3.1 Factory app

- URL: `https://factory.tmrwgroup.ai`
- Host EC2: `i-007b58b669019691d`
- Public IP: `3.91.206.159`
- Name tag: `venture-factory`
- Current instance type: `t3.small` (pending resize to `t3.large`)
- Root volume: `vol-0fcf9e03c9c2a6d92`
- Root volume status: resized from 8 GB to 50 GB and filesystem expanded successfully

Disk verification done:
- `/dev/nvme0n1p1` XFS
- `df -h /` showed ~50G total, ~42G free after expansion

## 3.2 OpenClaw backend ECS (separate system, but touched in takeover)

- ECR repo: `049405321468.dkr.ecr.us-east-1.amazonaws.com/openclaw-backend`
- New digest rolled: `sha256:a070223563f1bea2e2ddf1c823dd48aefd7681da31813b6001a927b6893320ba`
- Tag(s): `ubuntu2204-20260320-2`, `latest`
- ECS service: `openclaw-backend`
- ECS cluster: `openclaw-backend`
- Task definition currently: `openclaw-backend:3`
- Running task verified healthy on new digest
- Health check verified: `https://api.clawapi.io/health` => `ok`

Important: this ECS rollout was for `api.clawapi.io` backend, not the Factory web app.

## 4) Exact Problem Analysis: Why Ubuntu Base Did Not Give CloudAgent Shell/File Access

The user expectation:
- "If CloudAgent container uses Ubuntu 22.04, it should behave like Claude Code on VM with shell + filesystem."

Current reality:
- Chat execution path is in Factory control plane route, not inside ECS agent runtime.
- Tool-calling is limited by current MCP tools, not by container OS capabilities.

Current implementation points:
- Chat route: `src/app/api/agents/[id]/chat/route.ts`
- Runtime loop: `src/lib/cloud-agent-chat.ts`
- MCP tools: `src/lib/mcp-tools.ts`

Current MCP tools only:
- `get_time`
- `get_agent_status`
- `recent_usage`
- `runtime_info`
- `web_fetch`

No `shell_command`, `read_file`, `write_file`, `list_dir` exist yet.  
Therefore CloudAgent responds correctly that shell/filesystem tool access is unavailable.

## 5) Chat Reliability Fixes Applied During Takeover

File impacted:
- `src/app/(dashboard)/agents/[id]/chat/page.tsx`

Fixes shipped to live:
1. Safe JSON parsing helper to avoid raw `response.json()` crashes on empty bodies.
2. Error extraction normalization.
3. Retry logic for `loadAgent` and `loadSessions`.
4. Clear stale error banners once subsequent fetch succeeds.
5. Non-blocking post-send refresh behavior to avoid showing hard error when message send succeeded but metadata refresh failed transiently.

Observed behavior before:
- intermittent `400` on `/api/agents/:id/sessions` while other calls succeeded
- frontend showed disruptive red banner even when chat worked

Mitigation:
- UI now degrades more safely under transient refresh failures.

Note:
- Intermittent 400 source was observed at edge logs but not fully root-caused at backend route layer; route code itself does not intentionally return 400 for GET sessions unless malformed path/context/auth edge condition.

## 6) Security/Operational Notes

High importance:
1. During ECS task-definition operations, sensitive environment variables were present in ECS task definition JSON output.
2. Move sensitive values to SSM/Secrets Manager and avoid plaintext env in task definitions.
3. Rotate any exposed credentials if they were shared in logs/chats/screens.

## 7) Architecture Gap and Required Direction (What Claude should build next)

Goal: true per-agent runtime experience (VM-like behavior) for CloudAgent:
- workspace access
- controlled shell execution
- file read/write
- tool calling from agent runtime

### Required architecture change

Current:
- Factory app runs Bedrock loop and calls MCP itself.

Target:
1. Per-agent ECS runtime container hosts runner service.
2. Factory `/api/agents/:id/chat` proxies chat turns to agent runner endpoint.
3. Runner executes tool calls locally within container workspace.

### Workspace strategy

Phase A (fast):
- use container local `/workspace/<agentId>` (ephemeral)

Phase B (production):
- mount EFS at `/workspace` for persistence across task restarts
- isolate by user/agent subpath

### Tooling to add

Add MCP/runner tools with strict controls:
1. `shell_command`
2. `list_dir`
3. `read_file`
4. `write_file`

Mandatory controls:
- path jail to workspace root
- command allowlist
- per-command timeout
- stdout/stderr truncation
- execution audit logging
- deny parent traversal/symlink escape
- non-root container user

## 8) Concrete Next Implementation Plan for Claude

1. Confirm working repo path: `tmrw/venture-factory`, env target `staging`.
2. Add runner module (new service endpoint in runtime container) for:
   - chat turn execution
   - local tool execution
3. Define and enforce tool safety policy (`allowed commands`, max output bytes, max runtime).
4. Update Factory API:
   - `POST /api/agents/:id/chat` should call runner endpoint (with auth token/shared key)
   - fallback only if runner unavailable (or return structured error)
5. Add workspace config envs:
   - `AGENT_WORKSPACE_ROOT=/workspace`
   - optional `AGENT_WORKSPACE_PERSISTENCE=ephemeral|efs`
6. Add docs:
   - new runbook for CloudAgent runner architecture
   - safety policy and plan limits
7. Add end-to-end verification script:
   - create cloud agent
   - run `pwd`/`ls`
   - write/read file
   - check usage event persisted

## 9) Immediate Action Items Still Open

1. Resize Factory instance type:
   - `i-007b58b669019691d` from `t3.small` -> `t3.large`
   - requires stop/start (possible IP change because no Elastic IP found for `3.91.206.159`)
2. Migrate secrets from task definition env to secret references.
3. Implement runner-based shell/file workspace flow.

## 10) Useful Commands and Verified References

## 10.1 Verify Factory host storage

```bash
ssh -i "C:\Users\Animesh Kumar\.ssh\id_ed25519" ec2-user@3.91.206.159
lsblk -f
df -h /
```

## 10.2 Verify openclaw-backend ECS rollout

```bash
aws ecs describe-services --region us-east-1 --cluster openclaw-backend --services openclaw-backend --query "services[0].taskDefinition"
aws ecs list-tasks --region us-east-1 --cluster openclaw-backend --service-name openclaw-backend --desired-status RUNNING
aws ecs describe-tasks --region us-east-1 --cluster openclaw-backend --tasks <task-arn> --query "tasks[0].containers[0].{image:image,imageDigest:imageDigest,lastStatus:lastStatus,healthStatus:healthStatus}"
curl -sS https://api.clawapi.io/health
```

## 10.3 Files to inspect first when resuming

- `src/app/(dashboard)/create/page.tsx`
- `src/app/api/agents/route.ts`
- `src/lib/agent-provisioning.ts`
- `src/app/api/agents/[id]/chat/route.ts`
- `src/lib/cloud-agent-chat.ts`
- `src/lib/mcp-tools.ts`
- `src/proxy.ts`
- `docs/cloud-agent-runtime.md` (outdated in parts, update required)

## 11) Known Documentation Drift

`docs/agent-billing-ecs-runbook.md` still references Slack/Discord flow in places.  
Current code is Cloud-only (`platform: CLOUD` via schema). Update docs to match current behavior.

## 12) Current User Flow (Factory)

This section is intentionally explicit because it was requested and was missing in earlier notes.

### 12.1 Home page -> Login

1. User opens `https://factory.tmrwgroup.ai/`.
2. Public home shows nav to `Collective`, `District`, `Watch`, and `Login`.
3. Clicking login goes to `/login`.
4. Google OAuth (NextAuth) is used.
5. If route was protected, middleware passes `callbackUrl` and user is redirected back there after sign-in.
6. Default post-login destination is `/create`.

Code:
- `src/app/page.tsx`
- `src/app/login/page.tsx`
- `src/proxy.ts`
- `src/lib/auth.ts`

### 12.2 Post-login -> Dashboard/Create

1. User can access `/dashboard` and `/create`.
2. `/create` fetches subscription state from `/api/billing/subscription`.
3. If plan is not paid+active, user is forced into billing flow:
   - `POST /api/billing/checkout`
   - redirect to Stripe checkout (or simulated flow if Stripe not configured)
   - `POST /api/billing/confirm` sets subscription active
4. Once active, user can submit CloudAgent create form.

Code:
- `src/app/(dashboard)/create/page.tsx`
- `src/app/api/billing/subscription/route.ts`
- `src/app/api/billing/checkout/route.ts`
- `src/app/api/billing/confirm/route.ts`

### 12.3 Create New CloudAgent (under the hood)

1. UI posts `POST /api/agents` with:
   - `name`
   - `platform: "CLOUD"`
   - optional `instructions`
2. API checks:
   - user authenticated
   - paid active plan
   - plan agent limit (`STARTER=3`, `PRO=20`)
   - payload validation (Zod)
3. DB inserts `agent` row with `status=QUEUED`.
4. API calls `provisionAgentOnEcs(...)`.
5. `provisionAgentOnEcs` attempts ECS `RunTask` with Fargate and env overrides:
   - `AGENT_ID`, `AGENT_OWNER_ID`, `AGENT_PLATFORM`, `AGENT_MODE=cloud`
   - `CLAUDE_CODE_USE_BEDROCK=1`
   - `ANTHROPIC_MODEL`
   - `MCP_BASE_URL`
6. If provisioning starts:
   - agent updated to `PROVISIONING`
   - ECS ARNs stored
   - chat endpoint set to `/agents/{id}/chat`
7. If provisioning config missing/fails:
   - agent remains `QUEUED`
   - `lastError` stores reason (often "ECS provisioning config is incomplete")

Code:
- `src/app/api/agents/route.ts`
- `src/lib/agent-provisioning.ts`
- `src/lib/agent-validation.ts`
- `src/lib/billing.ts`

### 12.4 CloudAgent created -> User can chat

1. User opens `/agents` and clicks `Open Chat`.
2. Chat page loads:
   - agent metadata (`GET /api/agents/:id`)
   - sessions (`GET /api/agents/:id/sessions`)
   - messages (`GET /api/agents/:id/messages?sessionId=...`)
3. User sends message:
   - `POST /api/agents/:id/chat` with stream enabled
4. Backend flow in current implementation:
   - creates/uses chat session
   - stores USER message
   - runs Bedrock conversation loop in control-plane app (`runCloudAgentTurn`)
   - optionally calls MCP tools (`/api/mcp`)
   - streams ASSISTANT response to UI
   - stores assistant message and usage events
   - updates agent status (`RUNNING` on success, `FAILED` on failure)

Code:
- `src/app/(dashboard)/agents/[id]/chat/page.tsx`
- `src/app/api/agents/[id]/chat/route.ts`
- `src/lib/cloud-agent-chat.ts`
- `src/app/api/mcp/route.ts`
- `src/lib/mcp-tools.ts`

### 12.5 What is currently lacking (explicit gap list)

1. Chat execution is still in Factory control-plane app, not the per-agent ECS runtime container.
2. No tool exists yet for:
   - shell command execution
   - file read/write/list in workspace
3. Ubuntu 22.04 image in ECS does not automatically grant Claude-like VM behavior.
4. No persistent per-agent workspace mounted yet (EFS not wired for CloudAgent workspace semantics).
5. Therefore user sees "tools available are limited" behavior in chat for filesystem/shell requests.

## 13) Final Notes for Claude

1. Do not assume Ubuntu base image alone changes tool permissions.
2. Keep infra and app concerns separate:
   - `factory.tmrwgroup.ai` is EC2 Docker app
   - `openclaw-backend` is ECS/Fargate service
3. Continue from runner architecture implementation, not further cosmetic UI work.
4. Keep staging-safe defaults and document rollback at each step.
5. At next token limit, write a delta handoff that includes:
   - exact commits
   - exact deployed container tags
   - exact unresolved errors with timestamps
