import Header from "@/components/layout/Header";
import Accordion from "@/components/context/Accordion";
import CodeBlock from "@/components/context/CodeBlock";
import { contextFiles } from "@/lib/context-files";

const CONTEXT_DOCS = [
  {
    title: "SYSTEM_PROMPT.md",
    description:
      "Core context file loaded by Claude Code. Defines domain, stack conventions, infrastructure, and coding rules.",
    key: "SYSTEM_PROMPT.md",
  },
  {
    title: "ARCHITECTURE.md",
    description: "Shared infrastructure layout, ECS service architecture, deployment flow, and scaling rules.",
    key: "ARCHITECTURE.md",
  },
  {
    title: "API_CONTRACTS.md",
    description: "Standard response envelopes, health checks, lead capture, validation, auth, and error codes.",
    key: "API_CONTRACTS.md",
  },
  {
    title: "RUNBOOK.md",
    description: "Operational runbook for deploy, rollback, scaling, logs, database, and incident response.",
    key: "RUNBOOK.md",
  },
  {
    title: "DESIGN_SYSTEM.md",
    description: "Brand colors, typography, components, spacing, and radius tokens.",
    key: "DESIGN_SYSTEM.md",
  },
  {
    title: "CONVENTIONS.md",
    description: "TypeScript, API routes, database, git, and testing conventions.",
    key: "CONVENTIONS.md",
  },
  {
    title: "DATA_DICTIONARY.md",
    description: "Data sources, schemas, transformations, and quality rules for ML pipelines.",
    key: "DATA_DICTIONARY.md",
  },
  {
    title: "EXPERIMENT_LOG.md",
    description: "Experiment tracking template for ML/data pipelines.",
    key: "EXPERIMENT_LOG.md",
  },
];

export default function ContextPage() {
  return (
    <>
      <Header title="Context Engineering" description="Prompt files and conventions for Claude Code" />
      <div className="page-container">
        <div
          className="vf-card vf-card-pad"
          style={{
            marginBottom: "var(--space-6)",
            borderLeft: "3px solid var(--orange)",
          }}
        >
          <h3
            style={{
              fontSize: "var(--text-md)",
              fontWeight: 600,
              color: "var(--orange)",
              marginBottom: "var(--space-2)",
            }}
          >
            How Context Engineering Works
          </h3>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Each venture includes a <code>context/</code> directory with markdown files that Claude Code reads as
            project context. These files define the domain, conventions, architecture, and operational runbooks -
            ensuring the AI agent understands your project from day one.
          </p>
        </div>

        <div className="vf-section-stack" style={{ gap: "var(--space-3)" }}>
          {CONTEXT_DOCS.map((doc) => (
            <Accordion key={doc.key} title={doc.title}>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--text-muted)",
                  marginBottom: "var(--space-3)",
                  marginTop: "var(--space-3)",
                }}
              >
                {doc.description}
              </p>
              {contextFiles[doc.key] && <CodeBlock code={contextFiles[doc.key]} title={doc.key} language="markdown" />}
            </Accordion>
          ))}
        </div>
      </div>
    </>
  );
}
