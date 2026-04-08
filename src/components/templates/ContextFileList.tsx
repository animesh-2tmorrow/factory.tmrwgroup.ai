import CopyButton from "@/components/shared/CopyButton";
import { contextFiles } from "@/lib/context-files";

interface ContextFileListProps {
  files: string[];
}

export default function ContextFileList({ files }: ContextFileListProps) {
  return (
    <div className="vf-section-stack" style={{ gap: "var(--space-2)" }}>
      {files.map((f) => (
        <div
          key={f}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "var(--space-2) var(--space-3)",
            borderRadius: "var(--vf-radius-sm)",
            border: "1px solid var(--border)",
            background: "var(--bg-base)",
          }}
        >
          <span style={{ fontSize: "var(--text-sm)", fontFamily: "var(--font-mono), monospace", color: "var(--text-secondary)" }}>
            {f}
          </span>
          {contextFiles[f] && <CopyButton text={contextFiles[f]} label="Copy content" />}
        </div>
      ))}
    </div>
  );
}
