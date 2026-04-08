interface AgentStatusBadgeProps {
  status: "QUEUED" | "PROVISIONING" | "RUNNING" | "FAILED" | "STOPPED";
}

const STATUS_LABELS: Record<AgentStatusBadgeProps["status"], string> = {
  QUEUED: "Queued",
  PROVISIONING: "Starting",
  RUNNING: "Ready",
  FAILED: "Error",
  STOPPED: "Offline",
};

const STATUS_CLASS: Record<AgentStatusBadgeProps["status"], string> = {
  QUEUED: "is-queued",
  PROVISIONING: "is-provisioning",
  RUNNING: "is-running",
  FAILED: "is-failed",
  STOPPED: "is-stopped",
};

export default function AgentStatusBadge({ status }: AgentStatusBadgeProps) {
  return <span className={`vf-chat-status ${STATUS_CLASS[status]}`}>{STATUS_LABELS[status]}</span>;
}
