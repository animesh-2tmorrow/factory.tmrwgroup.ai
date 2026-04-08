"use client";

import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";

interface CopyButtonProps {
  text: string;
  label?: string;
}

export default function CopyButton({ text, label }: CopyButtonProps) {
  const { copied, copy } = useCopyToClipboard();

  return (
    <button
      onClick={() => copy(text)}
      className="vf-button-ghost"
      style={{
        padding: "0.3rem 0.6rem",
        fontSize: "var(--text-xs)",
        borderRadius: "var(--vf-radius-xs)",
        color: copied ? "var(--teal)" : "var(--text-muted)",
        border: `1px solid ${copied ? "var(--teal)" : "var(--border)"}`,
        background: copied ? "var(--teal-dim)" : "transparent",
        transition: "all 0.2s ease",
        whiteSpace: "nowrap",
      }}
      aria-live="polite"
    >
      {copied ? "\u2713 Copied" : label ?? "Copy"}
    </button>
  );
}
