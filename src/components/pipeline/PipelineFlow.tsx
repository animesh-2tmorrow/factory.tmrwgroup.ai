const PHASES = [
  { label: "Ideate", color: "var(--gold)" },
  { label: "Scaffold", color: "var(--teal)" },
  { label: "Build", color: "var(--pink)" },
  { label: "Launch", color: "var(--blue)" },
];

export default function PipelineFlow() {
  return (
    <div className="vf-row" style={{ justifyContent: "center", gap: 0, padding: "var(--space-6) 0", marginBottom: "var(--space-6)", flexWrap: "wrap" }}>
      {PHASES.map((phase, i) => (
        <div key={phase.label} style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              border: `2px solid ${phase.color}`,
              background: `color-mix(in srgb, ${phase.color} 10%, transparent)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{i + 1}</span>
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: phase.color }}>{phase.label}</span>
          </div>
          {i < PHASES.length - 1 && (
            <div
              style={{
                width: 60,
                height: 2,
                background: `linear-gradient(90deg, ${phase.color}, ${PHASES[i + 1].color})`,
                opacity: 0.4,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
