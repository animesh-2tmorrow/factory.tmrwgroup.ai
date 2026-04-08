type Status = "RUNNING" | "PROVISIONING" | "QUEUED" | "FAILED" | "STOPPED";

const STATUS_CONFIG: Record<Status, { color: string; label: string; pulse: boolean }> = {
  RUNNING: { color: "var(--teal)", label: "Running", pulse: true },
  PROVISIONING: { color: "var(--blue)", label: "Provisioning", pulse: true },
  QUEUED: { color: "var(--gold)", label: "Queued", pulse: false },
  FAILED: { color: "var(--error)", label: "Failed", pulse: false },
  STOPPED: { color: "var(--text-muted)", label: "Stopped", pulse: false },
};

interface StatusPillProps {
  status: Status;
  className?: string;
}

export default function StatusPill({ status, className = "" }: StatusPillProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.STOPPED;

  return (
    <span
      className={`vf-status-pill ${className}`}
      style={{
        color: config.color,
        background: `color-mix(in srgb, ${config.color} 12%, transparent)`,
        borderColor: `color-mix(in srgb, ${config.color} 30%, var(--border))`,
      }}
    >
      <span
        className={`vf-status-pill-dot ${config.pulse ? "is-pulsing" : ""}`}
        style={{ background: config.color }}
      />
      {config.label}
    </span>
  );
}
