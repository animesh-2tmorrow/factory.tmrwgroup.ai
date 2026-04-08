# Claude Handover - Venture Factory (Factory.tmrwgroup.ai)

Date: 2026-03-30 (IST)
Prepared by: Codex (continuation after Claude token exhaustion)
Primary system: https://factory.tmrwgroup.ai
AWS account: 049405321468 (coaip)
Region: us-east-1

## 1) Why this handover exists

Claude was progressing on Venture Factory end-to-end flow (onboarding, CloudAgent runtime, chat UX, reliability, agent-zero parity features), then hit token limits. This file captures the exact latest state so Claude can continue immediately without rediscovery.

## 2) Current production snapshot (confirmed)

- App URL: `https://factory.tmrwgroup.ai`
- EC2 host: `i-007b58b669019691d`
- Current public IP: `44.202.200.32`
- Hostname: `ip-10-81-0-180.ec2.internal`
- Running container: `venture-factory`
- Container image: `venture-factory:latest`
- Health check: `GET /api/health` returns `{"status":"ok","database":"ok"}`
- DNS resolves `factory.tmrwgroup.ai -> 44.202.200.32`

## 3) What is currently built (functional flow)

### 3.1 User-facing flow

1. User lands on `https://factory.tmrwgroup.ai/`
2. User logs in via Google OAuth
3. Billing gate and plan experience exist (Stripe test-mode wiring in progress/history in prior sessions)
4. User reaches dashboard after auth and subscription state checks
5. User goes to `New Agent` and creates a Cloud Agent
6. Agent provisioning records are written, ECS task launch is triggered
7. User opens `/agents/:id/chat` and can chat with agent runtime

### 3.2 Under-the-hood flow (CloudAgent)

1. Frontend posts to `POST /api/agents`
2. Backend creates `agent` record and provisioning metadata
3. Provisioning logic uses ECS env config (`ECS_CLUSTER_ARN`, `ECS_CLOUD_TASK_DEFINITION_ARN`, subnets, SGs)
4. ECS Fargate task starts for the agent runtime
5. Chat UI uses `POST /api/agents/[id]/chat`
6. Chat API attempts runner endpoint proxy first (`proxyToRunner`) and falls back when configured
7. Chat sessions/messages/usage are persisted in Postgres (Prisma models)
8. Tool cards and usage are shown in the chat UI

## 4) Major work completed across recent sessions

- Home/dashboard/create/docs/chat UI heavily upgraded (dark premium enterprise style)
- Sidebar expanded with Projects, Skills, Memory, Scheduler, Multi-Agent, Integrations, Voice
- Session-based chat history + persistence implemented
- Tool-call cards and markdown rendering improved
- CloudAgent-only runtime option enforced (Slack/Discord options removed)
- Agent delete controls introduced with plan guardrails
- EFS-related runtime workspace groundwork added
- Bedrock model standardization moved to Haiku line in runtime path
- Multiple reliability fixes for chat route error handling and session loading

## 5) Latest work completed in this Codex session (2026-03-30)

### 5.1 Issue observed from user screenshot

User reported new agent chat intro still claims thread-only memory behavior (example: "my memory is limited to current thread"). This was inconsistent with current persisted session/memory architecture and caused UX distrust.

### 5.2 Code changes made

1. Updated runner system prompt to explicitly state memory capabilities and prevent false "no memory/thread-only memory" claims:
- `tmrw/venture-factory/runner/src/chat-loop.ts`

2. Updated fallback cloud chat system prompt with same memory policy:
- `tmrw/venture-factory/src/lib/cloud-agent-chat.ts`

3. Added server-side answer sanitization so problematic memory-disclaimer phrases are rewritten before reaching UI:
- `tmrw/venture-factory/src/app/api/agents/[id]/chat/route.ts`
- Added `sanitizeMemoryClaims()`
- Wired into `userFacingAnswer()`

4. Also normalized malformed ellipsis text rendering in chat API formatting path.

### 5.3 Deploy actions executed

- SSH access restored by whitelisting current operator IP (`223.178.211.88/32`) on instance SGs:
  - `sg-0648af8f50ac18c44`
  - `sg-02d3af0c9607f922f`
- Synced modified files to server path:
  - `/home/ec2-user/apps/venture-factory/...`
- Rebuilt and restarted production container:
  - `docker build -t venture-factory:latest .`
  - `docker rm -f venture-factory`
  - `docker run -d --name venture-factory --restart unless-stopped --env-file /home/ec2-user/.env -p 127.0.0.1:3000:3000 venture-factory:latest`
- Verified health from host:
  - `curl -sS https://factory.tmrwgroup.ai/api/health`

## 6) Important architectural reality check

The app repository contains `runner/` source, but production agent runtime behavior depends on the ECS runner image and task definition currently configured in env (`ECS_CLOUD_TASK_DEFINITION_ARN`).

Implication:
- Chat API sanitization is live immediately (because it is in web app container)
- Runner prompt-only changes are not guaranteed for already-running ECS tasks unless runner image/task def is rebuilt/rotated

If Claude wants deterministic runner-behavior changes for all future/new tasks, do this explicitly:
1. Build/push runner image
2. Register new `cloud-agent-runner` task definition revision
3. Update `ECS_CLOUD_TASK_DEFINITION_ARN` in app env
4. Rotate/refresh existing agents as needed

## 7) Known open issues / gaps

1. Some users still observe runtime UX confusion when model explains capabilities too defensively
2. Need stronger model-output policy enforcement for user-friendly answers
3. Execute-command access to ECS tasks depends on task launch with `enableExecuteCommand=true` and SSM channel readiness
4. Need tighter operational runbook for rotating stale agents and task defs
5. Billing flow UX should strictly enforce: home -> login -> billing -> dashboard

## 8) Highest-priority next steps for Claude

### P0

1. Validate chat behavior for this reported agent:
- `8775a9e5-9566-4cec-b464-b3ef3c8942eb`
- Prompt test: "What memory do you have access to?"

2. If wording still drifts, add hard post-processing policy in chat route for capability statements (short canonical answer blocks).

3. Standardize runner image rollout process:
- Build runner image
- Push to ECR
- Register new `cloud-agent-runner` task def revision
- Point app env to new revision

### P1

4. Improve chat confidence UX:
- Capability banner near composer
- Clear "session memory + saved memory" label
- Keep technical details collapsible

5. Tighten provisioning feedback:
- Reliable step progress bar from queued -> provisioning -> running -> ready

## 9) Commands Claude should run first when resuming

```bash
# 1) Confirm AWS identity
aws sts get-caller-identity --region us-east-1

# 2) Confirm factory instance/IP and SGs
aws ec2 describe-instances --region us-east-1 \
  --filters Name=tag:Name,Values=venture-factory \
  --query "Reservations[].Instances[].{Id:InstanceId,State:State.Name,IP:PublicIpAddress,SG:SecurityGroups[].GroupId}" --output table

# 3) SSH and inspect app container
ssh -i "C:\\Users\\Animesh Kumar\\.ssh\\id_ed25519" ec2-user@44.202.200.32
cd /home/ec2-user/apps/venture-factory
docker ps
curl -sS http://127.0.0.1:3000/api/health

# 4) Tail logs during live test
docker logs -f --tail 200 venture-factory
```

## 10) Sensitive data policy reminder

- Do not print secrets from `.env` or ECS task definition env blocks
- Do not commit keys/tokens
- Keep AWS, OAuth, Stripe, MCP secrets in env/secret managers only
- Any previously exposed credentials should be rotated outside this handover

## 11) Local workspace notes

- Parent repo (`openclaw-ai-console`) is dirty with many unrelated files
- `tmrw/venture-factory` is currently treated as a standalone project folder in this workspace flow
- Avoid touching unrelated files during targeted fixes

## 12) Verification checklist after next change

- `/api/health` returns ok
- Login works and session persists
- User with valid subscription can access dashboard/agents/create
- Creating CloudAgent succeeds
- `/agents/:id/chat` can send/receive without JSON parser errors
- Tool cards remain technical but user message stays natural-language
- No false "I only have thread memory" claims

---

If this handover is outdated, append a new dated section instead of rewriting history, so continuity remains auditable.