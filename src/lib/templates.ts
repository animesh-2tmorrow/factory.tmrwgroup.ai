export type TemplateCategory = "ventures" | "projects";

export type TemplateType =
  | "microapp"
  | "marketplace"
  | "saas"
  | "service"
  | "fullstack"
  | "api"
  | "mobile"
  | "pipeline";

export interface Template {
  type: TemplateType;
  category: TemplateCategory;
  name: string;
  icon: string;
  description: string;
  stack: string[];
  contextFiles: string[];
  cliCommand: string;
  fileStructure: string;
}

export const templates: Template[] = [
  // ── TMRW Ventures ──
  {
    type: "microapp",
    category: "ventures",
    name: "Microapp",
    icon: "\u26A1",
    description: "Lightweight single-purpose app with payments. Perfect for quick MVPs and focused tools.",
    stack: ["Next.js", "TailwindCSS", "Prisma", "Stripe", "SES", "ECS Fargate"],
    contextFiles: ["SYSTEM_PROMPT.md", "API_CONTRACTS.md", "RUNBOOK.md"],
    cliCommand: "tmrw create microapp myapp",
    fileStructure: `myapp/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── api/
│   │       ├── health/route.ts
│   │       ├── checkout/route.ts
│   │       └── webhook/route.ts
│   ├── components/
│   ├── lib/
│   │   ├── db.ts
│   │   ├── stripe.ts
│   │   └── email.ts
│   └── styles/
├── prisma/schema.prisma
├── Dockerfile
├── Makefile
├── .github/workflows/deploy.yml
└── context/
    ├── SYSTEM_PROMPT.md
    ├── API_CONTRACTS.md
    └── RUNBOOK.md`,
  },
  {
    type: "marketplace",
    category: "ventures",
    name: "Marketplace",
    icon: "\uD83C\uDFEA",
    description: "Multi-sided platform with buyers, sellers, and transactions. Stripe Connect for payouts.",
    stack: ["Next.js", "TailwindCSS", "Prisma", "Stripe Connect", "Redis", "SES", "ECS Fargate"],
    contextFiles: ["SYSTEM_PROMPT.md", "ARCHITECTURE.md", "API_CONTRACTS.md", "RUNBOOK.md"],
    cliCommand: "tmrw create marketplace mymp",
    fileStructure: `mymp/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── (buyer)/
│   │   ├── (seller)/
│   │   ├── admin/
│   │   └── api/
│   │       ├── health/route.ts
│   │       ├── listings/route.ts
│   │       ├── orders/route.ts
│   │       ├── payouts/route.ts
│   │       └── webhook/route.ts
│   ├── components/
│   ├── lib/
│   │   ├── db.ts
│   │   ├── stripe-connect.ts
│   │   ├── redis.ts
│   │   └── email.ts
│   └── styles/
├── prisma/schema.prisma
├── Dockerfile
├── Makefile
├── .github/workflows/deploy.yml
└── context/
    ├── SYSTEM_PROMPT.md
    ├── ARCHITECTURE.md
    ├── API_CONTRACTS.md
    └── RUNBOOK.md`,
  },
  {
    type: "saas",
    category: "ventures",
    name: "SaaS Product",
    icon: "\uD83D\uDC8E",
    description: "Auth, billing, dashboards, and multi-tenancy. Full subscription SaaS with Stripe Billing.",
    stack: ["Next.js", "TailwindCSS", "Prisma", "NextAuth", "Stripe Billing", "ECS Fargate"],
    contextFiles: ["SYSTEM_PROMPT.md", "ARCHITECTURE.md", "API_CONTRACTS.md", "DESIGN_SYSTEM.md", "RUNBOOK.md"],
    cliCommand: "tmrw create saas mysaas",
    fileStructure: `mysaas/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   └── billing/page.tsx
│   │   ├── admin/
│   │   └── api/
│   │       ├── health/route.ts
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── billing/route.ts
│   │       └── webhook/route.ts
│   ├── components/
│   ├── lib/
│   │   ├── db.ts
│   │   ├── auth.ts
│   │   ├── stripe.ts
│   │   └── email.ts
│   └── styles/
├── prisma/schema.prisma
├── Dockerfile
├── Makefile
├── .github/workflows/deploy.yml
└── context/
    ├── SYSTEM_PROMPT.md
    ├── ARCHITECTURE.md
    ├── API_CONTRACTS.md
    ├── DESIGN_SYSTEM.md
    └── RUNBOOK.md`,
  },
  {
    type: "service",
    category: "ventures",
    name: "Service Company",
    icon: "\uD83E\uDD1D",
    description: "Lead generation site with CRM and automated email flows. Perfect for agencies.",
    stack: ["Next.js", "TailwindCSS", "Prisma", "AWS SES", "ECS Fargate"],
    contextFiles: ["SYSTEM_PROMPT.md", "RUNBOOK.md"],
    cliCommand: "tmrw create service mysvc",
    fileStructure: `mysvc/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── about/page.tsx
│   │   ├── contact/page.tsx
│   │   └── api/
│   │       ├── health/route.ts
│   │       ├── leads/route.ts
│   │       └── contact/route.ts
│   ├── components/
│   ├── lib/
│   │   ├── db.ts
│   │   └── email.ts
│   └── styles/
├── prisma/schema.prisma
├── Dockerfile
├── Makefile
├── .github/workflows/deploy.yml
└── context/
    ├── SYSTEM_PROMPT.md
    └── RUNBOOK.md`,
  },

  // ── General Projects ──
  {
    type: "fullstack",
    category: "projects",
    name: "Full-Stack Web App",
    icon: "\uD83C\uDF10",
    description: "Next.js frontend + FastAPI backend + PostgreSQL. Full-stack with separate API layer.",
    stack: ["Next.js", "React", "TailwindCSS", "FastAPI", "Prisma", "PostgreSQL", "ECS Fargate", "Docker"],
    contextFiles: ["SYSTEM_PROMPT.md", "ARCHITECTURE.md", "API_CONTRACTS.md", "CONVENTIONS.md"],
    cliCommand: "tmrw create fullstack myproj",
    fileStructure: `myproj/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   ├── Dockerfile
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routes/
│   │   ├── models/
│   │   └── services/
│   ├── Dockerfile
│   └── requirements.txt
├── docker-compose.yml
├── Makefile
├── .github/workflows/deploy.yml
└── context/
    ├── SYSTEM_PROMPT.md
    ├── ARCHITECTURE.md
    ├── API_CONTRACTS.md
    └── CONVENTIONS.md`,
  },
  {
    type: "api",
    category: "projects",
    name: "API / Microservice",
    icon: "\uD83D\uDD0C",
    description: "REST/gRPC service with auth, rate limiting, and observability. Production-grade API.",
    stack: ["FastAPI", "Go", "PostgreSQL", "Redis", "Docker", "ECS Fargate", "Prometheus"],
    contextFiles: ["SYSTEM_PROMPT.md", "ARCHITECTURE.md", "API_CONTRACTS.md", "RUNBOOK.md"],
    cliCommand: "tmrw create api myapi",
    fileStructure: `myapi/
├── app/
│   ├── main.py
│   ├── routes/
│   │   ├── health.py
│   │   └── v1/
│   ├── models/
│   ├── services/
│   ├── middleware/
│   │   ├── auth.py
│   │   └── rate_limit.py
│   └── config.py
├── tests/
├── migrations/
├── Dockerfile
├── Makefile
├── prometheus.yml
├── .github/workflows/deploy.yml
└── context/
    ├── SYSTEM_PROMPT.md
    ├── ARCHITECTURE.md
    ├── API_CONTRACTS.md
    └── RUNBOOK.md`,
  },
  {
    type: "mobile",
    category: "projects",
    name: "Mobile App",
    icon: "\uD83D\uDCF1",
    description: "React Native with shared API layer. Cross-platform mobile with Expo and cloud backend.",
    stack: ["React Native", "TypeScript", "Expo", "Firebase/Supabase", "ECS Fargate (API)"],
    contextFiles: ["SYSTEM_PROMPT.md", "DESIGN_SYSTEM.md", "API_CONTRACTS.md"],
    cliCommand: "tmrw create mobile myapp",
    fileStructure: `myapp/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx
│   │   ├── explore.tsx
│   │   └── settings.tsx
│   ├── _layout.tsx
│   └── +not-found.tsx
├── components/
├── hooks/
├── lib/
│   ├── api.ts
│   ├── auth.ts
│   └── storage.ts
├── assets/
├── api/  (optional backend)
│   ├── Dockerfile
│   └── src/
├── app.json
├── package.json
├── Makefile
└── context/
    ├── SYSTEM_PROMPT.md
    ├── DESIGN_SYSTEM.md
    └── API_CONTRACTS.md`,
  },
  {
    type: "pipeline",
    category: "projects",
    name: "Data / ML Pipeline",
    icon: "\uD83D\uDD2C",
    description: "ETL, model training, and serving on ECS. Full ML lifecycle with experiment tracking.",
    stack: ["Python", "Airflow/Prefect", "PyTorch", "DVC", "MLflow", "ECS Fargate", "S3"],
    contextFiles: ["SYSTEM_PROMPT.md", "DATA_DICTIONARY.md", "EXPERIMENT_LOG.md", "ARCHITECTURE.md"],
    cliCommand: "tmrw create pipeline mypipe",
    fileStructure: `mypipe/
├── pipelines/
│   ├── ingest/
│   ├── transform/
│   ├── train/
│   └── serve/
├── models/
│   ├── config/
│   └── checkpoints/
├── data/
│   ├── raw/
│   ├── processed/
│   └── features/
├── notebooks/
├── tests/
├── dvc.yaml
├── mlflow/
├── Dockerfile
├── Makefile
├── .github/workflows/deploy.yml
└── context/
    ├── SYSTEM_PROMPT.md
    ├── DATA_DICTIONARY.md
    ├── EXPERIMENT_LOG.md
    └── ARCHITECTURE.md`,
  },
];

export function getTemplate(type: string): Template | undefined {
  return templates.find((t) => t.type === type);
}

export function getTemplatesByCategory(category: TemplateCategory): Template[] {
  return templates.filter((t) => t.category === category);
}
