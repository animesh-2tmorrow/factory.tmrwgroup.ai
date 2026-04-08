"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import ECSArchDiagram from "@/components/infra/ECSArchDiagram";
import CodeBlock from "@/components/context/CodeBlock";
import { infraFiles } from "@/lib/infra-files";

const TABS = [
  { id: "architecture", label: "Architecture" },
  { id: "terraform", label: "Terraform" },
  { id: "dockerfile", label: "Dockerfile" },
  { id: "github-actions", label: "GitHub Actions" },
  { id: "makefile", label: "Makefile" },
];

const INFRA_TABLE = [
  { key: "AWS Account", value: "coaip" },
  { key: "Region", value: "us-east-1" },
  { key: "ECS Cluster", value: "tmrw-ventures (Fargate)" },
  { key: "ALB", value: "tmrw-alb (shared, host-based routing)" },
  { key: "ECR", value: "Per-venture repositories" },
  { key: "RDS", value: "PostgreSQL (shared cluster, per-venture schema)" },
  { key: "DNS", value: "Route53 *.tmrwgroup.ai" },
  { key: "SSL", value: "ACM wildcard certificate (auto-renewed)" },
  { key: "Email", value: "SES (verified tmrwgroup.ai domain)" },
  { key: "Secrets", value: "AWS Secrets Manager (per-venture)" },
];

export default function InfraPage() {
  const [tab, setTab] = useState("architecture");

  return (
    <>
      <Header title="Infrastructure" description="ECS architecture, Terraform, and deployment tooling" />
      <div className="page-container">
        {/* Sub-tabs */}
        <div className="vf-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`vf-button-ghost vf-tab-button ${tab === t.id ? "active" : ""}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "architecture" && (
          <>
            <h2 className="vf-title" style={{ marginBottom: "var(--space-4)" }}>
              ECS Service Architecture
            </h2>
            <div className="vf-card vf-card-pad" style={{ marginBottom: "var(--space-6)" }}>
              <ECSArchDiagram />
            </div>

            <h2 className="vf-title" style={{ marginBottom: "var(--space-4)" }}>
              Shared Infrastructure
            </h2>
            <div className="vf-table-wrap">
              <table className="vf-table">
                <tbody>
                  {INFRA_TABLE.map((row, i) => (
                    <tr key={row.key} style={{ borderBottom: i < INFRA_TABLE.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <td className="label" style={{ width: "30%" }}>
                        {row.key}
                      </td>
                      <td className="value">
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === "terraform" && (
          <CodeBlock code={infraFiles.terraform} title="modules/ecs-venture/main.tf" language="hcl" />
        )}

        {tab === "dockerfile" && (
          <CodeBlock code={infraFiles.dockerfile} title="Dockerfile" language="dockerfile" />
        )}

        {tab === "github-actions" && (
          <CodeBlock code={infraFiles.githubActions} title=".github/workflows/deploy.yml" language="yaml" />
        )}

        {tab === "makefile" && (
          <CodeBlock code={infraFiles.makefile} title="Makefile" language="makefile" />
        )}
      </div>
    </>
  );
}
