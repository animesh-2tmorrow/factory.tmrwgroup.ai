"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MessageItem from "./MessageItem";
import type { ChatMessage } from "./types";

interface MessageListProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  onRetryMessage?: (message: ChatMessage) => void;
  onSuggestionPick?: (prompt: string) => void;
}

export default function MessageList({ messages, isGenerating, onRetryMessage, onSuggestionPick }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [stickToBottom, setStickToBottom] = useState(true);

  const hasMessages = useMemo(() => messages.length > 0, [messages.length]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !stickToBottom) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, stickToBottom, isGenerating]);

  return (
    <div
      ref={containerRef}
      className="cc-messages"
      onScroll={(event) => {
        const target = event.currentTarget;
        const distance = target.scrollHeight - target.scrollTop - target.clientHeight;
        setStickToBottom(distance < 80);
      }}
    >
      {hasMessages ? (
        <div className="cc-messages-inner">
          {messages.map((item, idx) => (
            <MessageItem
              key={item.id}
              message={item}
              onRetry={onRetryMessage}
              onSuggestionPick={onSuggestionPick}
              isLast={idx === messages.length - 1 && item.role === "ASSISTANT"}
            />
          ))}
          {isGenerating && (
            <div className="cc-typing" aria-live="polite">
              <span className="cc-typing-dot" />
              <span className="cc-typing-dot" />
              <span className="cc-typing-dot" />
            </div>
          )}
        </div>
      ) : (
        <div className="cc-messages-inner">
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
            No messages in this session yet.
          </p>
        </div>
      )}

      {!stickToBottom && hasMessages && (
        <button
          className="cc-jump-btn"
          onClick={() => {
            const el = containerRef.current;
            if (!el) return;
            el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
            setStickToBottom(true);
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
          Jump to latest
        </button>
      )}
    </div>
  );
}
