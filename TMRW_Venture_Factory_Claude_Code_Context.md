# TMRW Venture Factory — Claude Code Build Instructions
# Feed this entire file as context to Claude Code Opus 4.6 (AWS Bedrock)
# Date: March 2026
# Author: Animesh (Infrastructure & DevOps)

---

# SECTION 1: CURRENT STATE

## What Exists Now

The TMRW Venture Factory static site is live:

| Component      | Value                                                    |
|----------------|----------------------------------------------------------|
| URL            | https://tmrw-venture-factory.tmrwgroup.ai                |
| Instance ID    | i-0f60c02409a4a9b38                                      |
| Instance Type  | t3.micro                                                 |
| Public IP      | 44.211.156.225                                           |
| AMI            | ami-0f3caa1cf4417e51b (Amazon Linux 2023)                |
| Key Pair       | tmrw-animesh-ed25519                                     |
| Security Group | sg-0648af8f50ac18c44 (ports 22, 80, 443)                 |
| Subnet         | subnet-02546cc3fa9f4670a                                 |
| DNS            | Route53 A record → 44.211.156.225                        |
| SSL            | Let's Encrypt, expires 2026-06-02, auto-renewal via cron |
| Web Root       | /var/www/venture-factory/index.html                      |
| SSH            | ssh -i ~/.ssh/id_ed25519 ec2-user@44.211.156.225         |

## Existing TMRW Infrastructure

| Component        | Value                          |
|------------------|--------------------------------|
| AWS Account      | coaip                          |
| Region           | us-east-1                      |
| Production Site  | https://www.tmrwgroup.ai       |
| Staging Site     | https://staging.tmrwgroup.ai   |
| GitHub Org       | https://github.com/tmrwgroup   |
| Database         | AWS RDS PostgreSQL             |
| Email            | AWS SES                        |
| DNS              | AWS Route53                    |
| Current Compute  | EC2 t3.small (migrating to ECS)|

## Team

| Name    | Role                        |
|---------|-----------------------------|
| Edward  | Founder / Venture Builder   |
| Animesh | Infrastructure & DevOps     |
| Ronnie  | GTM / Design System         |
| Zach    | Engineering / Tooling       |

---

# SECTION 2: WHAT TO BUILD

## Objective

Transform the static Venture Factory HTML page into a **full interactive Next.js application** with these capabilities:

1. **Interactive dashboard** — Current templates, pipeline, context engineering, and infra tabs (already designed, needs to become React components)
2. **tmrw CLI integration** — A web UI that mirrors what `tmrw create <type> <name>` does
3. **Template browser** — Browse all 8 templates (4 ventures + 4 projects), view structures, copy context files
4. **Copy-to-clipboard** — One-click copy for SYSTEM_PROMPT.md, Makefile, Terraform modules, Docker configs
5. **Team role views** — Different views for Edward (strategy), Animesh (infra), Ronnie (GTM), Zach (tooling)

## Tech Stack (TMRW Standard)

- **Framework**: Next.js 14+ (App Router)
- **Styling**: TailwindCSS
- **Language**: TypeScript (strict mode)
- **Validation**: Zod
- **Database**: Prisma → PostgreSQL (AWS RDS)
- **Deployment**: Docker → ECS Fargate (target) or EC2 (current)
- **CI/CD**: GitHub Actions
- **Email**: AWS SES
- **DNS**: Route53

---

# SECTION 3: APPLICATION ARCHITECTURE

## Route Structure

```
/                           → Dashboard home (overview of all ventures + stats)
/templates                  → Template browser (all 8 templates)
/templates/[type]           → Individual template detail (structure, stack, context files)
/pipeline                   → Launch pipeline view (4 phases)
/context                    → Context engineering reference
/infra                      → Infrastructure dashboard (ECS architecture, current services)
/create                     → Venture creation wizard (step-by-step)
/api/health                 → Health check endpoint
/api/templates              → Template data API
/api/ventures               → List created ventures
```

## Component Architecture

```
src/
├── app/
│   ├── layout.tsx                 # Root layout with nav
│   ├── page.tsx                   # Dashboard home
│   ├── templates/
│   │   ├── page.tsx               # Template browser
│   │   └── [type]/page.tsx        # Template detail
│   ├── pipeline/page.tsx          # Launch pipeline
│   ├── context/page.tsx           # Context engineering
│   ├── infra/page.tsx             # Infrastructure view
│   ├── create/page.tsx            # Creation wizard
│   └── api/
│       ├── health/route.ts
│       ├── templates/route.ts
│       └── ventures/route.ts
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx            # Navigation sidebar
│   │   ├── Header.tsx             # Top bar with team role switcher
│   │   └── Footer.tsx
│   ├── templates/
│   │   ├── TemplateGrid.tsx       # Card grid for templates
│   │   ├── TemplateCard.tsx       # Individual template card
│   │   ├── StructureViewer.tsx    # File tree display
│   │   ├── StackBadges.tsx        # Tech stack pills
│   │   └── ContextFileList.tsx    # Context file cards
│   ├── pipeline/
│   │   ├── PhaseCard.tsx          # Pipeline phase
│   │   ├── PipelineFlow.tsx       # Visual flow diagram
│   │   └── CommandGrid.tsx        # CLI commands
│   ├── context/
│   │   ├── Accordion.tsx          # Expandable sections
│   │   ├── CodeBlock.tsx          # Syntax-highlighted code with copy
│   │   └── ContextLoader.tsx      # Dynamic context loading diagram
│   ├── infra/
│   │   ├── ECSArchDiagram.tsx     # ECS architecture layers
│   │   ├── InfraTable.tsx         # Infrastructure details
│   │   ├── TerraformViewer.tsx    # Terraform module display
│   │   └── DeployPipeline.tsx     # Deployment flow visual
│   └── shared/
│       ├── CopyButton.tsx         # Copy to clipboard
│       ├── CategoryTabs.tsx       # Sub-tab switcher
│       └── Badge.tsx              # Status badges
├── lib/
│   ├── templates.ts               # Template data (all 8 templates)
│   ├── constants.ts               # Colors, config
│   └── utils.ts                   # Helpers
├── hooks/
│   └── useCopyToClipboard.ts
└── styles/
    └── globals.css
```

---

# SECTION 4: TEMPLATE DATA

## All 8 templates to include:

### Category: TMRW Ventures

1. **Microapp** (⚡) — Lightweight single-purpose app with payments
   - Stack: Next.js, TailwindCSS, Prisma, Stripe, SES, ECS Fargate
   - Context files: SYSTEM_PROMPT.md, API_CONTRACTS.md, RUNBOOK.md
   - CLI: `tmrw create microapp myapp`

2. **Marketplace** (🏪) — Multi-sided platform: buyers, sellers, transactions
   - Stack: Next.js, TailwindCSS, Prisma, Stripe Connect, Redis, SES, ECS Fargate
   - Context files: SYSTEM_PROMPT.md, ARCHITECTURE.md, API_CONTRACTS.md, RUNBOOK.md
   - CLI: `tmrw create marketplace mymp`

3. **SaaS Product** (💎) — Auth, billing, dashboards, multi-tenancy
   - Stack: Next.js, TailwindCSS, Prisma, NextAuth, Stripe Billing, ECS Fargate
   - Context files: SYSTEM_PROMPT.md, ARCHITECTURE.md, API_CONTRACTS.md, DESIGN_SYSTEM.md, RUNBOOK.md
   - CLI: `tmrw create saas mysaas`

4. **Service Company** (🤝) — Lead gen site + CRM + email flows
   - Stack: Next.js, TailwindCSS, Prisma, AWS SES, ECS Fargate
   - Context files: SYSTEM_PROMPT.md, RUNBOOK.md
   - CLI: `tmrw create service mysvc`

### Category: General Projects

5. **Full-Stack Web App** (🌐) — Next.js frontend + FastAPI backend + DB
   - Stack: Next.js, React, TailwindCSS, FastAPI, Prisma, PostgreSQL, ECS Fargate, Docker
   - Context files: SYSTEM_PROMPT.md, ARCHITECTURE.md, API_CONTRACTS.md, CONVENTIONS.md
   - CLI: `tmrw create fullstack myproj`

6. **API / Microservice** (🔌) — REST/gRPC service with auth, rate limiting
   - Stack: FastAPI, Go, PostgreSQL, Redis, Docker, ECS Fargate, Prometheus
   - Context files: SYSTEM_PROMPT.md, ARCHITECTURE.md, API_CONTRACTS.md, RUNBOOK.md
   - CLI: `tmrw create api myapi`

7. **Mobile App** (📱) — React Native with shared API layer
   - Stack: React Native, TypeScript, Expo, Firebase/Supabase, ECS Fargate (API)
   - Context files: SYSTEM_PROMPT.md, DESIGN_SYSTEM.md, API_CONTRACTS.md
   - CLI: `tmrw create mobile myapp`

8. **Data / ML Pipeline** (🔬) — ETL, model training, serving on ECS
   - Stack: Python, Airflow/Prefect, PyTorch, DVC, MLflow, ECS Fargate, S3
   - Context files: SYSTEM_PROMPT.md, DATA_DICTIONARY.md, EXPERIMENT_LOG.md, ARCHITECTURE.md
   - CLI: `tmrw create pipeline mypipe`

---

# SECTION 5: DESIGN SYSTEM

## Theme

- **Aesthetic**: Dark, terminal-inspired, developer-focused
- **Background**: Deep navy-black (#050509 to #0F0F1A)
- **Cards**: Dark elevated panels (#0F0F1A) with subtle borders (#1A1A30)
- **Typography**: Sora (headings/body) + JetBrains Mono (code/technical)
- **Accent Colors**:
  - Teal (#00D4AA) — Primary actions, active states, infrastructure
  - Orange (#FF8C42) — Context engineering, warnings
  - Blue (#5B8DEF) — Stack, secondary actions
  - Pink (#E85D9A) — Build phase, architecture
  - Gold (#DDBE4D) — Ideation, planning
  - Lime (#8BD450) — Success, live status
- **Effects**: Subtle grain overlay, glow on active cards, smooth transitions
- **Border radius**: 10px for cards, 6px for buttons, 4px for tags

## Key UI Patterns

- **Category sub-tabs** for switching between Ventures and Projects
- **Card grid** (4 columns) for template selection
- **Split view** (structure left, details right) for template detail
- **Accordion** for expandable content sections
- **Copy button** on every code block and context file
- **Pipeline visual** with connected nodes and arrows

---

# SECTION 6: CONTEXT ENGINEERING FILES (FULL CONTENT)

Every venture/project template should include downloadable/copyable versions of these files.

## SYSTEM_PROMPT.md (Template)

```markdown
# Venture: [Name]
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
- Never set ECS desired count to 0 in prod
```

## ARCHITECTURE.md (Template)

```markdown
# Architecture: [Venture Name]

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
- Scale-in cooldown: 300s
```

## RUNBOOK.md (Template)

```markdown
# Runbook: [Venture Name]

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
7. Notify team in #tmrw-ops Discord channel
```

## API_CONTRACTS.md (Template)

```markdown
# API Contracts: [Venture Name]

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
500 — Internal server error (logged, never expose details)
```

---

# SECTION 7: INFRASTRUCTURE AS CODE

## Terraform Module: ECS Venture

This is the Terraform module that `tmrw create` should reference. Display it in the infra tab with copy functionality.

```hcl
module "venture" {
  source = "./modules/ecs-venture"

  name        = var.venture_name
  domain      = "${var.venture_name}.tmrwgroup.ai"
  environment = var.environment

  # ECS
  cluster_arn   = aws_ecs_cluster.tmrw.arn
  cpu           = 256
  memory        = 512
  desired_count = var.environment == "production" ? 2 : 1
  max_count     = 10

  # Auto-scaling
  cpu_target    = 70
  memory_target = 80

  # ALB
  alb_arn           = aws_lb.tmrw.arn
  listener_arn      = aws_lb_listener.https.arn
  health_check_path = "/health"

  # Database
  db_schema    = "${var.venture_name}_db"
  rds_cluster  = aws_rds_cluster.tmrw.id

  # Services
  ses_domain   = "tmrwgroup.ai"
  route53_zone = aws_route53_zone.tmrw.id
  acm_cert_arn = aws_acm_certificate.wildcard.arn

  # Payments
  stripe_enabled = true
}
```

## Dockerfile (Standard)

```dockerfile
# Multi-stage build for Next.js on ECS
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "server.js"]
```

## GitHub Actions: ECS Deploy

```yaml
name: Deploy to ECS
on:
  push:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: tmrw-${{ github.event.repository.name }}
  ECS_CLUSTER: tmrw-ventures
  ECS_SERVICE: ${{ github.event.repository.name }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to ECR
        id: ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push
        env:
          ECR_REGISTRY: ${{ steps.ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:latest .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster $ECS_CLUSTER \
            --service $ECS_SERVICE \
            --force-new-deployment
```

## Makefile (Standard)

```makefile
.PHONY: dev build test lint deploy-staging deploy-prod ecs-status logs scale rollback clean

VENTURE_NAME := $(shell basename $(CURDIR))
ECS_CLUSTER  := tmrw-ventures
ECS_SERVICE  := $(VENTURE_NAME)
AWS_REGION   := us-east-1

dev:
	docker-compose up --build

build:
	docker build -t $(VENTURE_NAME) .

test:
	npm test

lint:
	npm run lint && npx tsc --noEmit

deploy-staging:
	@echo "Deploying $(VENTURE_NAME) to staging..."
	aws ecs update-service --cluster $(ECS_CLUSTER) --service $(ECS_SERVICE)-staging --force-new-deployment --region $(AWS_REGION)
	@echo "Waiting for stable..."
	aws ecs wait services-stable --cluster $(ECS_CLUSTER) --services $(ECS_SERVICE)-staging --region $(AWS_REGION)
	@echo "Staging deploy complete."

deploy-prod:
	@read -p "Deploy $(VENTURE_NAME) to PRODUCTION? [y/N] " confirm; \
	[ "$$confirm" = "y" ] && \
	aws ecs update-service --cluster $(ECS_CLUSTER) --service $(ECS_SERVICE) --force-new-deployment --region $(AWS_REGION) && \
	aws ecs wait services-stable --cluster $(ECS_CLUSTER) --services $(ECS_SERVICE) --region $(AWS_REGION) && \
	echo "Production deploy complete." || echo "Cancelled."

ecs-status:
	aws ecs describe-services --cluster $(ECS_CLUSTER) --services $(ECS_SERVICE) --region $(AWS_REGION) --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount,Pending:pendingCount}' --output table

logs:
	aws logs tail /ecs/$(ECS_CLUSTER)/$(ECS_SERVICE) --follow --region $(AWS_REGION)

scale:
	@read -p "Scale $(VENTURE_NAME) to how many tasks? " count; \
	aws ecs update-service --cluster $(ECS_CLUSTER) --service $(ECS_SERVICE) --desired-count $$count --region $(AWS_REGION)

rollback:
	@echo "Rolling back $(VENTURE_NAME)..."
	@prev=$$(aws ecs describe-services --cluster $(ECS_CLUSTER) --services $(ECS_SERVICE) --region $(AWS_REGION) --query 'services[0].deployments[1].taskDefinition' --output text); \
	aws ecs update-service --cluster $(ECS_CLUSTER) --service $(ECS_SERVICE) --task-definition $$prev --region $(AWS_REGION)
	@echo "Rolled back."

clean:
	docker-compose down -v
	rm -rf node_modules .next
```

---

# SECTION 8: DEPLOYMENT INSTRUCTIONS

## Option A: Deploy to current EC2 instance (quick)

Replace the static HTML at `/var/www/venture-factory/` with the built Next.js app:

1. Build the Next.js app locally or in CI
2. SSH to the instance: `ssh -i ~/.ssh/id_ed25519 ec2-user@44.211.156.225`
3. Deploy the built output to the web root
4. Nginx serves the app (already configured)

## Option B: Deploy to ECS Fargate (recommended, aligns with new architecture)

1. Create ECR repository: `tmrw-venture-factory`
2. Build and push Docker image
3. Create ECS task definition (256 CPU, 512 memory)
4. Create ECS service in `tmrw-ventures` cluster
5. Add ALB target group for `tmrw-venture-factory.tmrwgroup.ai`
6. Update Route53 to point to ALB instead of EC2 IP
7. Set up GitHub Actions for auto-deploy

## DNS Cutover

When ready to move from EC2 to ECS:
1. Deploy to ECS and verify via ALB DNS
2. Update Route53 A record from 44.211.156.225 → ALB DNS (alias record)
3. Verify HTTPS works (ACM cert on ALB)
4. Decommission EC2 instance after 24h monitoring

---

# SECTION 9: ACCEPTANCE CRITERIA

The build is complete when:

1. All 8 templates render with correct structures, stacks, and context files
2. Category switching (Ventures / Projects) works
3. All 4 tabs function: Templates, Pipeline, Context Engineering, Infrastructure
4. Every code block and context file has a working "Copy to clipboard" button
5. The ECS architecture diagram renders correctly in the Infrastructure tab
6. Terraform module, Dockerfile, GitHub Actions, and Makefile are all viewable and copyable
7. /health endpoint returns 200
8. Site loads in under 2 seconds
9. Mobile responsive (works on phone)
10. Dark theme matches the design system in Section 5
11. Deployed and accessible at https://tmrw-venture-factory.tmrwgroup.ai

---

# SECTION 10: PROMPT FOR CLAUDE CODE

Use this as the initial prompt when starting the Claude Code session:

```
Build a Next.js 14 application for the TMRW Venture Factory. This is an internal tool for Tomorrow Inc that serves as a template browser, launch pipeline reference, context engineering guide, and infrastructure dashboard for rapidly launching ventures.

The app should be deployed to the existing EC2 instance at 44.211.156.225 (replacing the current static HTML), with a path to migrate to ECS Fargate.

Key requirements:
1. Next.js 14 App Router + TypeScript + TailwindCSS
2. Dark theme (navy-black background, teal/orange/blue accents)
3. Fonts: Sora (headings) + JetBrains Mono (code)
4. 4 main tabs: Templates, Launch Pipeline, Context Engineering, Infrastructure
5. 8 project templates (4 TMRW ventures + 4 general projects) with switchable categories
6. Every code block gets a copy-to-clipboard button
7. Full context engineering files (SYSTEM_PROMPT.md, ARCHITECTURE.md, RUNBOOK.md, API_CONTRACTS.md) viewable and copyable
8. ECS architecture diagram in Infrastructure tab
9. Terraform module, Dockerfile, GitHub Actions, Makefile all displayed
10. Mobile responsive
11. /health and /api/health endpoints
12. Docker multi-stage build for deployment

Read the full context document I've provided for complete template data, design system specs, component architecture, infrastructure details, and deployment instructions.

Start by setting up the Next.js project, then build components tab by tab. Deploy to the EC2 instance when complete.
```
