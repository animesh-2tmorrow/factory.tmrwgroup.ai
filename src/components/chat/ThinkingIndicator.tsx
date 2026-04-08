import AgentAvatar from "@/components/shared/AgentAvatar";

export default function ThinkingIndicator() {
  return (
    <div className="cc-thinking">
      <AgentAvatar size={24} />
      <div className="cc-thinking-dots">
        <div className="cc-thinking-dot" />
        <div className="cc-thinking-dot" />
        <div className="cc-thinking-dot" />
      </div>
      <span className="cc-thinking-label">Thinking...</span>
    </div>
  );
}
