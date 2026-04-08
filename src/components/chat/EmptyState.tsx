interface EmptyStateProps {
  onPromptPick: (prompt: string) => void;
}

const SUGGESTIONS = [
  { icon: "📊", label: "List Programs", prompt: "List all my Marketo programs" },
  { icon: "⚡", label: "Smart Campaigns", prompt: "Show me all active smart campaigns" },
  { icon: "✉️", label: "Email Audit", prompt: "Audit my email templates for issues" },
  { icon: "🔍", label: "Instance Info", prompt: "Get my Marketo instance details" },
  { icon: "📋", label: "Health Check", prompt: "Run a health audit on my Marketo instance" },
  { icon: "🔧", label: "Create Program", prompt: "Help me create a new program" },
];

const GENERAL_SUGGESTIONS = [
  { icon: "💻", label: "Code", prompt: "Help me write, debug, or review code." },
  { icon: "🏗️", label: "Architecture", prompt: "Design a system architecture for a new service." },
  { icon: "🔬", label: "Research", prompt: "Research a technical topic and summarize findings." },
  { icon: "📝", label: "Write", prompt: "Draft documentation, runbooks, or technical specs." },
];

export default function EmptyState({ onPromptPick }: EmptyStateProps) {
  return (
    <div className="cc-empty">
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h2 className="cc-greeting" style={{ fontSize: "1.4rem", marginBottom: 6 }}>
          What can I help you with?
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
          Ask about your Marketo instance, or pick a suggestion below
        </p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 8, paddingLeft: 2 }}>
          Marketo
        </div>
        <div className="cc-pills" style={{ gap: 8 }}>
          {SUGGESTIONS.map((s) => (
            <button
              key={s.label}
              className="cc-pill"
              onClick={() => onPromptPick(s.prompt)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", fontSize: "0.82rem" }}
            >
              <span>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: 8, paddingLeft: 2 }}>
          General
        </div>
        <div className="cc-pills" style={{ gap: 8 }}>
          {GENERAL_SUGGESTIONS.map((s) => (
            <button
              key={s.label}
              className="cc-pill"
              onClick={() => onPromptPick(s.prompt)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", fontSize: "0.82rem" }}
            >
              <span>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
