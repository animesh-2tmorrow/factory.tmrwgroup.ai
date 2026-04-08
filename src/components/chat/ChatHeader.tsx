import Link from "next/link";
import AgentStatusBadge from "./AgentStatusBadge";
import type { UsageTotals } from "./types";
import { PUBLIC_RUNTIME_LABEL } from "@/lib/runtime-brand";

interface ChatHeaderProps {
  agentName: string;
  modelName: string | null;
  status: "QUEUED" | "PROVISIONING" | "RUNNING" | "FAILED" | "STOPPED";
  usage: UsageTotals;
  onRefresh: () => void;
  onNewChat: () => void;
}

export default function ChatHeader({
  agentName,
  modelName: _modelName,
  status,
  usage,
  onRefresh,
  onNewChat,
}: ChatHeaderProps) {
  return (
    <div className="vf-chat-thread-header">
      <div>
        <div className="vf-row" style={{ gap: "var(--space-2)", alignItems: "center", flexWrap: "wrap" }}>
          <h2 className="vf-chat-thread-title">{agentName}</h2>
          <AgentStatusBadge status={status} />
          <span className="vf-chat-chip">{PUBLIC_RUNTIME_LABEL}</span>
        </div>
        <p className="vf-chat-thread-subtitle">Cloud runtime chat with persistent sessions, usage tracking, and tool support.</p>
      </div>

      <div className="vf-chat-header-actions">
        <button className="vf-button-secondary" onClick={onNewChat} aria-label="Start new chat">
          New Chat
        </button>
        <button className="vf-button-secondary" onClick={onRefresh} aria-label="Refresh agent status">
          Refresh
        </button>
        <Link href="/agents" className="vf-button-secondary">
          Agent Details
        </Link>
      </div>

      <div className="vf-chat-usage-strip">
        <span className="vf-code-inline">Input: {usage.inputTokens}</span>
        <span className="vf-code-inline">Output: {usage.outputTokens}</span>
        <span className="vf-code-inline">Total: {usage.totalTokens}</span>
      </div>
    </div>
  );
}
