export default function ECSArchDiagram() {
  const layers = [
    { label: "Route53", sub: "venture.tmrwgroup.ai", color: "var(--blue)" },
    { label: "ALB", sub: "tmrw-alb (shared)", color: "var(--teal)" },
    { label: "ECS Service", sub: "Fargate, auto-scaling", color: "var(--pink)" },
    { label: "Task Definition", sub: "App container + sidecar", color: "var(--orange)" },
  ];

  const services = [
    { label: "RDS PostgreSQL", color: "var(--blue)" },
    { label: "Secrets Manager", color: "var(--gold)" },
    { label: "SES Email", color: "var(--orange)" },
    { label: "Stripe", color: "var(--pink)" },
  ];

  return (
    <div style={{ padding: "var(--space-4) 0" }}>
      {/* Main flow */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
        {layers.map((layer, i) => (
          <div key={layer.label} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                padding: "var(--space-3) var(--space-6)",
                borderRadius: "var(--vf-radius-md)",
                border: `1.5px solid ${layer.color}`,
                background: `color-mix(in srgb, ${layer.color} 8%, transparent)`,
                textAlign: "center",
                minWidth: 260,
              }}
            >
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: layer.color }}>{layer.label}</div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{layer.sub}</div>
            </div>
            {i < layers.length - 1 && (
              <div style={{ width: 2, height: 24, background: "var(--border-active)" }} />
            )}
          </div>
        ))}
      </div>

      {/* Connected services */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "var(--space-3)",
          marginTop: "var(--space-4)",
          paddingTop: "var(--space-4)",
          borderTop: "1px dashed var(--border-active)",
        }}
      >
        {services.map((svc) => (
          <div
            key={svc.label}
            style={{
              padding: "var(--space-2) var(--space-3)",
              borderRadius: "var(--vf-radius-sm)",
              border: `1px solid ${svc.color}`,
              background: `color-mix(in srgb, ${svc.color} 6%, transparent)`,
              textAlign: "center",
              fontSize: "var(--text-xs)",
              fontWeight: 500,
              color: svc.color,
            }}
          >
            {svc.label}
          </div>
        ))}
      </div>
    </div>
  );
}
