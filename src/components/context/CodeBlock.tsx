"use client";

import CopyButton from "@/components/shared/CopyButton";

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

export default function CodeBlock({ code, language, title }: CodeBlockProps) {
  return (
    <div className="vf-code-block">
      {title && (
        <div className="vf-row" style={{ padding: "var(--space-2) var(--space-4)", borderBottom: "1px solid var(--border)", justifyContent: "space-between" }}>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
            {title}
            {language && (
              <span style={{ marginLeft: "var(--space-2)", color: "var(--teal)", opacity: 0.7 }}>
                {language}
              </span>
            )}
          </span>
          <CopyButton text={code} />
        </div>
      )}
      {!title && (
        <div className="copy-trigger">
          <CopyButton text={code} />
        </div>
      )}
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}
