import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import StructureViewer from "@/components/templates/StructureViewer";
import StackBadges from "@/components/templates/StackBadges";
import ContextFileList from "@/components/templates/ContextFileList";
import CopyButton from "@/components/shared/CopyButton";
import { getTemplate, templates } from "@/lib/templates";

interface Props {
  params: Promise<{ type: string }>;
}

export function generateStaticParams() {
  return templates.map((t) => ({ type: t.type }));
}

export default async function TemplateDetailPage({ params }: Props) {
  const { type } = await params;
  const template = getTemplate(type);

  if (!template) {
    notFound();
  }

  return (
    <>
      <Header
        title={`${template.icon} ${template.name}`}
        description={template.description}
      />
      <div className="page-container">
        <div style={{ marginBottom: "var(--space-4)" }}>
          <Link
            href="/templates"
            style={{ fontSize: "var(--text-sm)", color: "var(--teal)" }}
          >
            &larr; All Templates
          </Link>
        </div>

        <div className="vf-grid-2" style={{ gap: "var(--space-5)" }}>
          {/* Left: File structure */}
          <div>
            <StructureViewer structure={template.fileStructure} />
          </div>

          {/* Right: Details */}
          <div className="vf-section-stack">
            {/* Stack */}
            <div>
              <h3 style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-muted)", marginBottom: "var(--space-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Tech Stack
              </h3>
              <StackBadges stack={template.stack} />
            </div>

            {/* CLI command */}
            <div>
              <h3 style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-muted)", marginBottom: "var(--space-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                CLI Command
              </h3>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "var(--space-3) var(--space-4)",
                  borderRadius: "var(--vf-radius-md)",
                  border: "1px solid var(--border)",
                  background: "var(--bg-base)",
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: "var(--text-sm)",
                  color: "var(--teal)",
                  gap: "var(--space-3)",
                }}
              >
                <code>{template.cliCommand}</code>
                <CopyButton text={template.cliCommand} />
              </div>
            </div>

            {/* Context files */}
            <div>
              <h3 style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-muted)", marginBottom: "var(--space-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Context Files
              </h3>
              <ContextFileList files={template.contextFiles} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
