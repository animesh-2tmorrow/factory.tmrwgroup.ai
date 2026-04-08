export const contextFiles: Record<string, string> = {
  "SYSTEM_PROMPT.md": `# Venture: [Name]
# Type: microapp | marketplace | saas | service | api | fullstack | mobile | pipeline
# Owner: Edward Unthank / Tomorrow Inc

## Domain
What this venture does, who it serves, core value proposition.
Business rules and constraints.

## TMRW Stack Conventions
- Framework: Next.js 14+ (App Router) | FastAPI | Go | React Native
- Styling: TailwindCSS
- Validation: Zod schemas for all inputs
- ORM: Prisma → PostgreSQL (AWS RDS)
- Email: AWS SES (PENDING → SENT → FAILED)
- Payments: Stripe (subscriptions, checkout, portal)

## Infrastructure (ECS)
- Compute: ECS Fargate (auto-scaling)
- Load Balancer: ALB with health checks
- Registry: ECR for Docker images
- Database: RDS PostgreSQL (per-venture schema)
- DNS: Route53 → ALB → ECS
- SSL: ACM certificates (auto-renewed)

## Code Conventions
- TypeScript strict mode
- Zod schema validates before DB write
- API responses: { success, data, error }
- Health endpoint required: /health and /api/health
- Docker multi-stage builds for small images

## What NOT to Do
- Never hardcode secrets (use AWS Secrets Manager + .env)
- Never skip Zod validation on API routes
- Never deploy without staging test first
- Never modify shared Terraform without Animesh review
- Never set ECS desired count to 0 in prod`,

  "ARCHITECTURE.md": `# Architecture: [Venture Name]

## Shared Infrastructure (managed by Animesh)
- AWS Account: coaip | Region: us-east-1
- ECS Cluster: tmrw-ventures (Fargate)
- ALB: tmrw-alb (shared, path/host-based routing)
- ECR: per-venture repositories
- RDS PostgreSQL (shared cluster, per-venture schema)
- SES email (verified domain)
- Route53 DNS (*.tmrwgroup.ai)
- Secrets Manager (per-venture secrets)

## ECS Service Architecture
Route53: venture.tmrwgroup.ai
  → ALB (shared) → Target Group
    → ECS Service (Fargate)
      ├── Task Definition
      │   ├── App Container (Next.js/API)
      │   └── Sidecar (log router, optional)
      ├── Desired Count: 2 (prod) / 1 (staging)
      ├── Auto-scaling: CPU 70% / Memory 80%
      └── Health Check: /health
        → RDS PostgreSQL (venture_db schema)
        → Secrets Manager (API keys, DB creds)
        → SES (transactional email)
        → Stripe (payments)

## Deployment
GitHub push → Actions CI → Docker build → ECR push
→ ECS task definition update → rolling deployment
→ ALB health check passes → traffic shifts → live

## Scaling
- Min: 1 task (staging), 2 tasks (production)
- Max: 10 tasks
- Target: 70% CPU, 80% memory
- Scale-in cooldown: 300s`,

  "RUNBOOK.md": `# Runbook: [Venture Name]

## Deploy to Staging
make deploy-staging
# Verify: https://staging.[name].tmrwgroup.ai/health

## Deploy to Production
make deploy-prod
# Verify: https://[name].tmrwgroup.ai/health

## Rollback
make rollback
# Reverts to previous ECS task definition

## Scale Up
make scale 4
# Sets ECS desired count to 4

## Check Status
make ecs-status
# Shows running tasks, pending deployments, health

## Logs
make logs
# Tails CloudWatch logs for this service

## Database
# Connect to RDS (via bastion or SSM)
# Schema: [venture_name]_db
# Never run migrations in prod without staging test

## Incident Response
1. Check /health endpoint
2. Check CloudWatch metrics (CPU, memory, 5xx errors)
3. Check ECS service events (make ecs-status)
4. If deployment failed: make rollback
5. If scaling issue: make scale <count>
6. If DB issue: check RDS metrics in AWS console
7. Notify team in #tmrw-ops Discord channel`,

  "API_CONTRACTS.md": `# API Contracts: [Venture Name]

## Standard Response Envelope
All API responses use this format:
{
  "success": boolean,
  "data": T | null,
  "error": string | null,
  "meta": { "timestamp": string, "requestId": string }
}

## Health Check
GET /health
GET /api/health
Response: { "status": "ok", "db": "connected", "ses": "connected" }

## Lead Capture
POST /api/leads
Body: { "email": string, "type": LeadType, "name"?: string, "company"?: string }
LeadType: "updates" | "founding_customer" | "incubator_interest" | "accelerator_interest" | "hiring_interest" | "investor_interest"

## Validation
All inputs validated via Zod schemas before processing.
Invalid requests return: { "success": false, "error": "Validation failed", "details": ZodError[] }

## Authentication (if applicable)
Bearer token in Authorization header.
JWT issued by NextAuth or custom auth service.

## Error Codes
400 — Validation error
401 — Unauthorized
403 — Forbidden
404 — Not found
429 — Rate limited
500 — Internal server error (logged, never expose details)`,

  "DESIGN_SYSTEM.md": `# Design System: [Venture Name]

## Brand
- Primary: TMRW Group brand palette
- Typography: Sora (headings) + Inter/system (body) + JetBrains Mono (code)
- Dark mode first

## Colors
- Background: #050509 (deep), #0A0A12 (base), #0F0F1A (card)
- Text: #E4E4F0 (primary), #9090B0 (secondary), #555575 (muted)
- Accent: Teal #00D4AA, Blue #5B8DEF, Gold #DDBE4D

## Components
- Cards: Dark elevated panels with subtle borders
- Buttons: Primary (teal), Secondary (outline), Ghost
- Inputs: Dark background, teal focus ring
- Badges: Color-coded pills for status/categories

## Spacing
- Use 4px base grid (4, 8, 12, 16, 24, 32, 48, 64)
- Card padding: 20-24px
- Section spacing: 48-80px

## Radius
- Buttons: 6px
- Cards: 10px
- Tags/badges: 999px (pill)
- Inputs: 6px`,

  "CONVENTIONS.md": `# Code Conventions

## TypeScript
- Strict mode enabled
- No \`any\` types (use \`unknown\` if needed)
- Prefer interfaces over types for objects
- Use const assertions for literal types

## API Routes
- Always validate input with Zod
- Return { success, data, error } envelope
- Log errors server-side, never expose to client
- Use NextResponse.json() in App Router

## Database
- Prisma as ORM
- UUID primary keys
- snake_case column names via @@map / @map
- Always include createdAt / updatedAt
- Index frequently queried fields

## Git
- Commit to main directly (internal tool)
- Descriptive commit messages
- No force push

## Testing
- Unit tests for business logic
- Integration tests for API routes
- E2E tests for critical flows`,

  "DATA_DICTIONARY.md": `# Data Dictionary: [Pipeline Name]

## Sources
| Source | Type | Frequency | Format |
|--------|------|-----------|--------|
| TBD    | API  | Hourly    | JSON   |

## Schemas
Define input/output schemas for each pipeline stage.

## Transformations
Document data transformations, cleaning rules, and feature engineering steps.

## Quality Rules
- Null checks
- Range validation
- Freshness checks
- Duplicate detection`,

  "EXPERIMENT_LOG.md": `# Experiment Log: [Pipeline Name]

## Template
| Field | Value |
|-------|-------|
| Experiment ID | EXP-001 |
| Date | YYYY-MM-DD |
| Hypothesis | ... |
| Dataset | ... |
| Model | ... |
| Metrics | ... |
| Result | ... |
| Next Steps | ... |

## Experiments
(Add new experiments here)`,
};
