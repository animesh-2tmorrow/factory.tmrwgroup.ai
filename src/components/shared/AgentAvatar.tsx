interface AgentAvatarProps {
  size?: number;
  color?: string;
  className?: string;
}

export default function AgentAvatar({
  size = 28,
  color = "var(--teal)",
  className = "",
}: AgentAvatarProps) {
  return (
    <div
      className={`vf-agent-avatar ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Abstract circuit/agent icon */}
        <rect x="5" y="5" width="14" height="14" rx="3" />
        <circle cx="9" cy="12" r="1.5" fill={color} stroke="none" />
        <circle cx="15" cy="12" r="1.5" fill={color} stroke="none" />
        <path d="M9 16c0 0 1.5 1.5 3 1.5s3-1.5 3-1.5" />
        <line x1="12" y1="2" x2="12" y2="5" />
        <line x1="2" y1="12" x2="5" y2="12" />
        <line x1="19" y1="12" x2="22" y2="12" />
      </svg>
    </div>
  );
}
