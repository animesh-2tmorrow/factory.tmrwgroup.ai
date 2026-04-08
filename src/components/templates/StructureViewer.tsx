import CopyButton from "@/components/shared/CopyButton";

interface StructureViewerProps {
  structure: string;
}

export default function StructureViewer({ structure }: StructureViewerProps) {
  return (
    <div className="vf-code-block">
      <div className="vf-row" style={{ padding: "var(--space-2) var(--space-4)", borderBottom: "1px solid var(--border)", justifyContent: "space-between" }}>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>File Structure</span>
        <CopyButton text={structure} />
      </div>
      <pre style={{ margin: 0, padding: "var(--space-4)", fontSize: "var(--text-sm)", lineHeight: 1.5, color: "var(--text-secondary)" }}>
        <code>{structure}</code>
      </pre>
    </div>
  );
}
