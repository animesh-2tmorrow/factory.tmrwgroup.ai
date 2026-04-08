import Header from "@/components/layout/Header";
import PipelineFlow from "@/components/pipeline/PipelineFlow";
import PhaseCard from "@/components/pipeline/PhaseCard";
import CodeBlock from "@/components/context/CodeBlock";

const PHASES = [
  {
    number: 1,
    name: "Ideate",
    color: "var(--gold)",
    steps: [
      "Define the venture concept and target audience",
      "Write the SYSTEM_PROMPT.md with domain context",
      "Identify the template type (microapp, marketplace, SaaS, etc.)",
      "Review with Edward for strategic alignment",
    ],
  },
  {
    number: 2,
    name: "Scaffold",
    color: "var(--teal)",
    steps: [
      "Run tmrw create <type> <name> to generate the project",
      "Review generated file structure and context files",
      "Configure environment variables and secrets",
      "Set up database schema with Prisma",
    ],
  },
  {
    number: 3,
    name: "Build",
    color: "var(--pink)",
    steps: [
      "Implement core features using the template as foundation",
      "Follow API contracts for consistent endpoints",
      "Write tests for critical business logic",
      "Deploy to staging and verify",
    ],
  },
  {
    number: 4,
    name: "Launch",
    color: "var(--blue)",
    steps: [
      "Run make deploy-prod to push to ECS",
      "Verify health checks and ALB routing",
      "Monitor CloudWatch metrics for first 24h",
      "Update RUNBOOK.md with any launch-day findings",
    ],
  },
];

const CLI_COMMANDS = `# Create a new venture
tmrw create microapp my-tool

# Create a marketplace
tmrw create marketplace my-market

# Create a SaaS product
tmrw create saas my-platform

# Deploy to staging
make deploy-staging

# Deploy to production
make deploy-prod

# Check ECS status
make ecs-status

# View logs
make logs

# Rollback
make rollback`;

export default function PipelinePage() {
  return (
    <>
      <Header title="Launch Pipeline" description="4-phase process for launching TMRW ventures" />
      <div className="page-container">
        <PipelineFlow />

        <div className="vf-grid-2" style={{ marginBottom: "var(--space-6)" }}>
          {PHASES.map((phase) => (
            <PhaseCard key={phase.number} phase={phase} />
          ))}
        </div>

        <h2 className="vf-title" style={{ marginBottom: "var(--space-4)" }}>
          CLI Commands
        </h2>
        <CodeBlock code={CLI_COMMANDS} title="tmrw CLI" language="bash" />
      </div>
    </>
  );
}
