# Agent Billing + ECS Deployment (Staging)

This runbook enables the end-to-end flow:

`User -> Login -> Buy Plan -> Create Cloud Agent -> ECS Provisioning -> Chat`

## 1) Apply database migration

From `tmrw/venture-factory`:

```bash
npm run db:migrate:deploy
```

Migration added:

- `subscriptions` table
- `agents` table
- enums: `BillingPlan`, `SubscriptionStatus`, `AgentPlatform`, `AgentStatus`

## 2) Required environment variables

Set these on the EC2 host/container runtime:

- `NEXT_PUBLIC_APP_URL`
- `APP_URL`
- `APP_ENV=staging`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_STARTER_MONTHLY`
- `STRIPE_PRICE_PRO_MONTHLY`
- `ECS_CLUSTER_ARN`
- `ECS_TASK_DEFINITION_ARN`
- `ECS_CLOUD_TASK_DEFINITION_ARN` (optional, cloud agents only)
- `ECS_SUBNET_IDS` (comma-separated)
- `ECS_SECURITY_GROUP_IDS` (comma-separated)
- `AGENT_CONTAINER_NAME` (default `agent`)
- `MCP_SHARED_KEY` (required for cloud tool-calling)
- `MCP_BASE_URL` (optional)
- `CLOUD_AGENT_MODEL` (optional; default `global.anthropic.claude-haiku-4-5-20251001-v1:0`)

If Stripe is omitted, checkout runs in simulated mode for test-only flow.

## 3) Build and run

```bash
npm install
npm run db:generate
npm run build
npm run start
```

## 4) Verify API flow

1. Login via `/login`.
2. Open `/create`:
   - If on free plan, buy `STARTER` or `PRO`.
   - Confirm checkout redirect completes.
3. Submit agent form with `Cloud Agent`.
4. Open `/agents` and verify status:
   - `PROVISIONING` when ECS runTask succeeds
   - `RUNNING` once runtime endpoint is discovered
5. Open `/agents/:id/chat` and send a test message.

## 5) Smoke checks

- `GET /api/health`
- `GET /api/billing/subscription`
- `POST /api/billing/checkout`
- `POST /api/billing/confirm`
- `GET /api/agents`
- `POST /api/agents`

## 6) Security notes

- Do not commit Stripe keys or bot tokens.
- Prefer secret references (Secrets Manager) for platform credentials.
- Keep least-privilege IAM on app role for ECS runTask.
