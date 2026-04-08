import Link from "next/link";
import Badge from "@/components/shared/Badge";
import type { Template } from "@/lib/templates";

interface TemplateCardProps {
  template: Template;
}

export default function TemplateCard({ template }: TemplateCardProps) {
  return (
    <Link href={`/templates/${template.type}`}>
      <div className="vf-card vf-card--teal vf-card-pad" style={{ cursor: "pointer", height: "100%" }}>
        <div style={{ fontSize: "1.75rem", marginBottom: "var(--space-2)" }}>{template.icon}</div>
        <div style={{ fontSize: "var(--text-md)", fontWeight: 600, marginBottom: "var(--space-1)" }}>
          {template.name}
        </div>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", marginBottom: "var(--space-3)", lineHeight: 1.5 }}>
          {template.description}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1)" }}>
          {template.stack.slice(0, 4).map((s) => (
            <Badge key={s} label={s} />
          ))}
          {template.stack.length > 4 && (
            <span className="vf-badge vf-badge--blue">+{template.stack.length - 4}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
