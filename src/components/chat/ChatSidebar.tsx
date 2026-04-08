import { useMemo } from "react";
import type { ChatSessionItem } from "./types";

interface ChatSidebarProps {
  sessions: ChatSessionItem[];
  activeSessionId: string | null;
  onSelect: (sessionId: string) => void;
  onNewChat: () => void;
  onRename: (session: ChatSessionItem) => void;
  onDelete: (session: ChatSessionItem) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export default function ChatSidebar({
  sessions,
  activeSessionId,
  onSelect,
  onNewChat,
  onRename,
  onDelete,
  collapsed,
  onToggleCollapsed,
}: ChatSidebarProps) {
  const sorted = useMemo(
    () => [...sessions].sort((a, b) => +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt)),
    [sessions]
  );

  return (
    <>
      {collapsed && (
        <button
          className="cc-sidebar-toggle"
          onClick={onToggleCollapsed}
          aria-label="Open sidebar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
        </button>
      )}

      <aside className={`cc-sidebar ${collapsed ? "is-collapsed" : ""}`}>
        <div className="cc-sidebar-head">
          <h3>Chats</h3>
          <button
            className="cc-session-action-btn"
            onClick={onToggleCollapsed}
            aria-label="Close sidebar"
            style={{ display: "flex" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </button>
        </div>

        <button className="cc-new-chat-btn" onClick={onNewChat}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New chat
        </button>

        {sorted.length > 0 ? (
          <div className="cc-session-list" role="list" aria-label="Chat sessions">
            {sorted.map((session) => (
              <div
                key={session.id}
                role="listitem"
                className={`cc-session-item ${activeSessionId === session.id ? "is-active" : ""}`}
                onClick={() => onSelect(session.id)}
              >
                <span className="cc-session-title">{session.title}</span>
                <div className="cc-session-actions">
                  <button
                    className="cc-session-action-btn"
                    onClick={(e) => { e.stopPropagation(); onRename(session); }}
                    aria-label="Rename chat"
                    title="Rename"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    className="cc-session-action-btn"
                    onClick={(e) => { e.stopPropagation(); onDelete(session); }}
                    aria-label="Delete chat"
                    title="Delete"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-2 14H7L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="cc-sidebar-empty">
            No conversations yet
          </div>
        )}
      </aside>
    </>
  );
}
