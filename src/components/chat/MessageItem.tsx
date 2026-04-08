"use client";

import MessageRenderer from "./MessageRenderer";
import AgentAvatar from "@/components/shared/AgentAvatar";
import ToolExecutionCard from "./ToolExecutionCard";
import type { ChatMessage } from "./types";
import { Copy, RotateCcw } from "lucide-react";

/** Generate contextual follow-up suggestions based on the message content */
function getSuggestions(content: string): string[] {
  const lower = content.toLowerCase();
  if (lower.includes("program") && (lower.includes("list") || lower.includes("found") || lower.includes("have"))) {
    return ["Show inactive programs", "Count programs by channel", "List smart campaigns"];
  }
  if (lower.includes("campaign") && (lower.includes("list") || lower.includes("found"))) {
    return ["Show active campaigns only", "Deactivate inactive campaigns", "List programs"];
  }
  if (lower.includes("email") && (lower.includes("list") || lower.includes("found"))) {
    return ["Show unapproved emails", "List email templates", "Audit email performance"];
  }
  if (lower.includes("instance") || lower.includes("munchkin")) {
    return ["List programs", "Run health audit", "List workspaces"];
  }
  if (lower.includes("credential") || lower.includes("connected")) {
    return ["List my programs", "Get instance info", "Run health check"];
  }
  if (lower.includes("health") || lower.includes("audit")) {
    return ["Show details", "Export as CSV", "List programs"];
  }
  return [];
}

interface MessageItemProps {
  message: ChatMessage;
  onRetry?: (message: ChatMessage) => void;
  onSuggestionPick?: (prompt: string) => void;
  isLast?: boolean;
}

export default function MessageItem({ message, onRetry, onSuggestionPick, isLast }: MessageItemProps) {
  const isUser = message.role === "USER";
  const canRetry = message.role === "ASSISTANT" && onRetry;
  // toolUses from SSE streaming (attached directly), or from persisted metadata.toolCalls
  const rawToolUses = (message as any).toolUses as Array<{
    tool: string;
    input?: Record<string, unknown>;
    output?: string;
    technicalOutput?: string;
    status?: "success" | "error";
    duration_ms?: number;
  }> | undefined;

  const metadataToolCalls = message.metadata?.toolCalls as Array<{
    name: string;
    input?: unknown;
    result?: unknown;
    summary?: unknown;
    technicalOutput?: unknown;
    status?: unknown;
  }> | undefined;

  const toolUses = rawToolUses ??
    (metadataToolCalls && metadataToolCalls.length > 0
      ? metadataToolCalls.map((tc) => ({
          tool: tc.name,
          input: (tc.input && typeof tc.input === "object" ? tc.input : undefined) as Record<string, unknown> | undefined,
          output:
            typeof tc.summary === "string" && tc.summary.trim().length > 0
              ? tc.summary
              : tc.result != null
                ? (typeof tc.result === "string" ? tc.result : "Tool completed. Open technical details for raw output.")
                : undefined,
          technicalOutput:
            typeof tc.technicalOutput === "string" && tc.technicalOutput.trim().length > 0
              ? tc.technicalOutput
              : tc.result != null
                ? (typeof tc.result === "string" ? tc.result : JSON.stringify(tc.result, null, 2))
                : undefined,
          status: tc.status === "error" ? "error" : "success",
        }))
      : undefined);

  return (
    <div
      className={`cc-msg ${isUser ? "is-user" : "is-assistant"}`}
      aria-label={`${isUser ? "You" : "Agent"} message`}
    >
      {!isUser && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <AgentAvatar size={26} />
          <div style={{ flex: 1, minWidth: 0 }}>
            {toolUses && toolUses.length > 0 && (
              <div>
                {toolUses.map((tu, i) => (
                  <ToolExecutionCard key={i} execution={tu} />
                ))}
              </div>
            )}
            <div className="cc-msg-body">
              <MessageRenderer content={message.content} />
            </div>
            {/* Suggestion chips — only on last assistant message with content */}
            {isLast && message.content && onSuggestionPick && (() => {
              const suggestions = getSuggestions(message.content);
              if (suggestions.length === 0) return null;
              return (
                <div className="cc-suggestions">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      className="cc-suggestion-chip"
                      onClick={() => onSuggestionPick(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {isUser && (
        <div className="cc-msg-body">
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{message.content}</p>
        </div>
      )}

      <div className="cc-msg-actions">
        <button
          className="cc-msg-action-btn"
          onClick={() => navigator.clipboard.writeText(message.content)}
          aria-label="Copy message"
          title="Copy"
        >
          <Copy size={14} />
        </button>
        {canRetry && (
          <button
            className="cc-msg-action-btn"
            onClick={() => onRetry?.(message)}
            aria-label="Retry response"
            title="Retry"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
