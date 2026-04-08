# Venture Factory

Internal TMRW Group platform for venture ideation, paid agent provisioning, context engineering, and deployment playbooks.

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS v4 + custom token layer (`src/styles/vf-tokens.css`)
- NextAuth Google sign-in
- Prisma + PostgreSQL

## Routes

- `/` - public Venture Factory home
- `/login` - Google sign-in
- `/billing` - subscription purchase/activation
- `/dashboard` - private workspace dashboard
- `/agents` - deployed cloud agent runtime list and status
- `/create` - cloud agent creation + provisioning flow
- `/docs` - private product documentation
- `/district` - public district surface
- `/collective` - public collective surface
- `/watch` - public watch surface
- `/api/health` - service health check
- `/api/billing/subscription` - current plan status
- `/api/billing/checkout` - create checkout session
- `/api/billing/confirm` - confirm checkout result
- `/api/agents` - create/list user agents

## UI System

- Tokens: `src/styles/vf-tokens.css`
- Global primitives and utility classes: `src/app/globals.css`
- Layout shell:
  - sidebar: `src/components/layout/Sidebar.tsx`
  - header: `src/components/layout/Header.tsx`
  - footer: `src/components/layout/Footer.tsx`

See `docs/theme-and-structure.md` for theme controls and structure guidance.

## End-To-End User Flow

1. User lands on `factory.tmrwgroup.ai` and clicks login.
2. Google OAuth completes and routes to `/billing` if no callback is provided.
3. User buys `STARTER` or `PRO` in Stripe sandbox/production checkout.
4. Checkout confirm marks subscription active.
5. User accesses `/dashboard`, `/agents`, and `/create`.
6. User creates a Cloud Agent with runtime instructions.
7. API enforces plan limits and triggers ECS Fargate provisioning.
8. User tracks status in `/agents` (`QUEUED`, `PROVISIONING`, `RUNNING`, `FAILED`) and chats on `/agents/:id/chat`.

## Local Run

```bash
npm install
npm run dev
```

## Verify

```bash
npm run lint
npm run build
```

## Required Environment Variables (Agent + Billing)

- `NEXT_PUBLIC_APP_URL` or `APP_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_STARTER_MONTHLY`
- `STRIPE_PRICE_PRO_MONTHLY`
- `ECS_CLUSTER_ARN`
- `ECS_TASK_DEFINITION_ARN`
- `ECS_SUBNET_IDS` (comma-separated)
- `ECS_SECURITY_GROUP_IDS` (comma-separated)
- `ECS_EFS_FILE_SYSTEM_ID` (for persistent CloudAgent workspaces)
- `ECS_EFS_ACCESS_POINT_ID` (recommended for isolation and IAM auth)
- `AGENT_CONTAINER_NAME` (default: `agent`)
- `APP_ENV` (dev|staging|prod, used for ECS tags)
- `CLOUD_AGENT_MODEL` (optional; defaults to Haiku model in code)
- `RUNNER_SHARED_KEY` / `MCP_SHARED_KEY` (required for runner/MCP auth)
