import Badge from "@/components/shared/Badge";

interface StackBadgesProps {
  stack: string[];
}

export default function StackBadges({ stack }: StackBadgesProps) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1)" }}>
      {stack.map((s) => (
        <Badge key={s} label={s} />
      ))}
    </div>
  );
}
