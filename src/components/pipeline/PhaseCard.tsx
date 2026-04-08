interface Phase {
  number: number;
  name: string;
  color: string;
  steps: string[];
}

interface PhaseCardProps {
  phase: Phase;
}

export default function PhaseCard({ phase }: PhaseCardProps) {
  return (
    <div
      className="vf-card vf-card-pad"
      style={{
        borderTop: `3px solid ${phase.color}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: `color-mix(in srgb, ${phase.color} 15%, transparent)`,
            color: phase.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "var(--text-sm)",
            fontWeight: 700,
          }}
        >
          {phase.number}
        </span>
        <h3 style={{ fontSize: "var(--text-md)", fontWeight: 600, color: phase.color }}>
          {phase.name}
        </h3>
      </div>
      <ol className="vf-bullet-list">
        {phase.steps.map((step, i) => (
          <li key={i}>
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}
