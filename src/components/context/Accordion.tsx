"use client";

import { useState } from "react";

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export default function Accordion({ title, children, defaultOpen = false }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="vf-card" style={{ borderRadius: "var(--vf-radius-md)" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          padding: "var(--space-4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--text-primary)",
          fontFamily: "var(--font-display), system-ui, sans-serif",
          fontSize: "var(--text-md)",
          fontWeight: 600,
          textAlign: "left",
        }}
      >
        {title}
        <span
          style={{
            transition: "transform 0.2s ease",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            color: "var(--text-muted)",
          }}
        >
          &#x25BC;
        </span>
      </button>
      {open && (
        <div style={{ padding: "0 var(--space-4) var(--space-4)", borderTop: "1px solid var(--border)" }}>
          {children}
        </div>
      )}
    </div>
  );
}
