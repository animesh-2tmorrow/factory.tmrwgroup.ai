"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import ChatSidebar from "@/components/chat/ChatSidebar";
import MessageList from "@/components/chat/MessageList";
import Composer from "@/components/chat/Composer";
import EmptyState from "@/components/chat/EmptyState";
import type { ChatMessage, ChatSessionItem } from "@/components/chat/types";

interface AgentDetail {
  id: string;
  name: string;
  platform: "CLOUD";
  status: "QUEUED" | "PROVISIONING" | "RUNNING" | "FAILED" | "STOPPED";
  modelName: string | null;
  usageTotals: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
  code?: string;
  retryAfterSec?: number;
}

const STORAGE_ACTIVE_SESSION_PREFIX = "vf.chat.activeSession";
const STORAGE_MESSAGE_CACHE_PREFIX = "vf.chat.messageCache";
const MAX_CACHED_MESSAGES = 120;

function buildQuickTitle(prompt: string): string {
  return prompt.trim().replace(/\s+/g, " ").slice(0, 72) || "New chat";
}

async function parseJsonSafely<T>(response: Response): Promise<T | null> {
  const raw = await response.text();
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    // Some transient proxy failures return non-JSON payloads; surface a useful message instead
    // of throwing a low-level JSON parser error.
    if (!response.ok) {
      const trimmed = raw.trim();
      const lowered = trimmed.toLowerCase();
      if (
        lowered.includes("<html") ||
        lowered.includes("<!doctype") ||
        lowered.includes("</html>") ||
        lowered.includes("<head>") ||
        lowered.includes("<body>")
      ) {
        return { error: `Gateway error (${response.status}). Please retry in a few seconds.` } as T;
      }
      return { error: trimmed || `HTTP ${response.status}` } as T;
    }
    throw new Error(`Invalid JSON response (${response.status})`);
  }
}

function sanitizeUiErrorMessage(message: string): string {
  const trimmed = message.trim();
  const lowered = trimmed.toLowerCase();
  if (
    lowered.includes("<html") ||
    lowered.includes("<!doctype") ||
    lowered.includes("</html>") ||
    lowered.includes("<head>") ||
    lowered.includes("<body>") ||
    lowered.includes("502 bad gateway") ||
    lowered.includes("504 gateway timeout")
  ) {
    return "Cloud runtime temporarily unavailable. Please retry in a few seconds.";
  }
  return trimmed;
}

function getErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object") {
    const error = (body as { error?: unknown }).error;
    if (typeof error === "string" && error.trim().length > 0) {
      return error;
    }
  }
  return fallback;
}

function activeSessionStorageKey(agentId: string): string {
  return `${STORAGE_ACTIVE_SESSION_PREFIX}:${agentId}`;
}

function messageCacheStorageKey(agentId: string, sessionId: string): string {
  return `${STORAGE_MESSAGE_CACHE_PREFIX}:${agentId}:${sessionId}`;
}

function parseRetryAfterHeader(value: string | null): number | null {
  if (!value) return null;
  const asInt = Number(value);
  if (Number.isFinite(asInt) && asInt > 0) return Math.max(1, Math.min(86_400, Math.floor(asInt)));
  const dateValue = Date.parse(value);
  if (Number.isFinite(dateValue)) {
    const sec = Math.floor((dateValue - Date.now()) / 1000);
    if (sec > 0) return Math.min(86_400, sec);
  }
  return null;
}

function formatDuration(seconds: number): string {
  const clamped = Math.max(0, seconds);
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = clamped % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function loadStoredActiveSessionId(agentId: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(activeSessionStorageKey(agentId));
}

function saveStoredActiveSessionId(agentId: string, sessionId: string | null) {
  if (typeof window === "undefined") return;
  const key = activeSessionStorageKey(agentId);
  if (!sessionId) {
    window.localStorage.removeItem(key);
    return;
  }
  window.localStorage.setItem(key, sessionId);
}

function loadCachedSessionMessages(agentId: string, sessionId: string): ChatMessage[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(messageCacheStorageKey(agentId, sessionId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ChatMessage[];
  } catch {
    return [];
  }
}

function saveCachedSessionMessages(agentId: string, sessionId: string, messages: ChatMessage[]) {
  if (typeof window === "undefined") return;
  const next = messages.slice(-MAX_CACHED_MESSAGES);
  window.localStorage.setItem(messageCacheStorageKey(agentId, sessionId), JSON.stringify(next));
}

export default function AgentChatPage() {
  const params = useParams<{ id: string }>();
  const agentId = params?.id;

  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [composerValue, setComposerValue] = useState("");
  const [sending, setSending] = useState(false);
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const activeSessionIdRef = useRef<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Debug: track activeSessionId changes
  useEffect(() => {
    console.log(`[chat-debug] activeSessionId changed to: ${activeSessionId}`);
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);
  const [rateLimitUntil, setRateLimitUntil] = useState<number | null>(null);
  const [rateLimitRemaining, setRateLimitRemaining] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  function clearAgentLoadError() {
    setError((prev) => {
      if (!prev) return prev;
      return prev.toLowerCase().startsWith("failed to load agent") ? null : prev;
    });
  }

  function clearSessionLoadError() {
    setError((prev) => {
      if (!prev) return prev;
      return prev.toLowerCase().startsWith("failed to load sessions") ? null : prev;
    });
  }

  const loadAgent = useCallback(async () => {
    if (!agentId) return;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await fetch(`/api/agents/${agentId}`, { cache: "no-store" });
        const body = await parseJsonSafely<ApiResponse<AgentDetail>>(response);

        if (!response.ok || !body?.success || !body.data) {
          throw new Error(getErrorMessage(body, `Failed to load agent (${response.status})`));
        }

        setAgent(body.data);
        clearAgentLoadError();
        return;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error("Failed to load agent");
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
        }
      }
    }

    throw lastError ?? new Error("Failed to load agent");
  }, [agentId]);

  const loadSessions = useCallback(async () => {
    if (!agentId) return [] as ChatSessionItem[];

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await fetch(`/api/agents/${agentId}/sessions`, { cache: "no-store" });
        const body = await parseJsonSafely<ApiResponse<ChatSessionItem[]>>(response);

        if (!response.ok || !body?.success || !Array.isArray(body.data)) {
          throw new Error(getErrorMessage(body, `Failed to load sessions (${response.status})`));
        }

        const nextSessions = body.data;
        setSessions(nextSessions);
        clearSessionLoadError();
        return nextSessions;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error("Failed to load sessions");
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
        }
      }
    }

    // Offline/transient fallback: recover the last active session from local cache so users can
    // continue reading existing history after refresh instead of facing a hard failure screen.
    const storedSessionId = loadStoredActiveSessionId(agentId);
    if (storedSessionId) {
      const cachedMessages = loadCachedSessionMessages(agentId, storedSessionId);
      if (cachedMessages.length > 0) {
        const now = new Date().toISOString();
        const fallbackSession: ChatSessionItem = {
          id: storedSessionId,
          title: "Recent chat (cached)",
          createdAt: now,
          updatedAt: now,
          lastMessageAt: now,
          messageCount: cachedMessages.length,
        };
        setSessions([fallbackSession]);
        return [fallbackSession];
      }
    }

    throw lastError ?? new Error("Failed to load sessions");
  }, [agentId]);

  const loadMessages = useCallback(
    async (sessionId: string) => {
      if (!agentId) return;
      setLoadingMessages(true);

      try {
        const response = await fetch(`/api/agents/${agentId}/messages?sessionId=${encodeURIComponent(sessionId)}`, {
          cache: "no-store",
        });
        const body = await parseJsonSafely<ApiResponse<ChatMessage[]>>(response);

        if (!response.ok || !body?.success || !Array.isArray(body.data)) {
          throw new Error(getErrorMessage(body, `Failed to load messages (${response.status})`));
        }

        setMessages(body.data);
        saveCachedSessionMessages(agentId, sessionId, body.data);
      } catch (err) {
        const cached = loadCachedSessionMessages(agentId, sessionId);
        if (cached.length > 0) {
          setMessages(cached);
          setError((prev) => prev ?? "Showing cached messages while reconnecting...");
          return;
        }
        throw err;
      } finally {
        setLoadingMessages(false);
      }
    },
    [agentId]
  );

  const bootstrap = useCallback(async () => {
    if (!agentId) return;

    console.log(`[chat-debug] bootstrap() called for agentId=${agentId}`);
    setLoading(true);
    setError(null);

    try {
      await loadAgent();
      const initialSessions = await loadSessions();
      console.log(`[chat-debug] bootstrap: loaded ${initialSessions.length} sessions`);
      if (initialSessions.length > 0) {
        const storedSessionId = loadStoredActiveSessionId(agentId);
        console.log(`[chat-debug] bootstrap: storedSessionId=${storedSessionId}`);
        const preferred =
          (storedSessionId
            ? initialSessions.find((session) => session.id === storedSessionId)
            : null) ?? initialSessions[0];

        console.log(`[chat-debug] bootstrap: setting activeSessionId=${preferred.id}`);
        setActiveSessionId(preferred.id);

        // Fast-path hydration: render cached thread immediately, then refresh from API.
        const cached = loadCachedSessionMessages(agentId, preferred.id);
        if (cached.length > 0) {
          setMessages(cached);
        }

        await loadMessages(preferred.id);
      } else {
        console.log(`[chat-debug] bootstrap: no sessions, setting activeSessionId=null`);
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error(`[chat-debug] bootstrap error:`, err);
      setError(err instanceof Error ? err.message : "Failed to initialize chat");
    } finally {
      setLoading(false);
    }
  }, [agentId, loadAgent, loadMessages, loadSessions]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (!agentId) return;
    const interval = setInterval(() => {
      void loadAgent().catch(() => {
        // keep silent for polling failure
      });
    }, 15000);
    return () => clearInterval(interval);
  }, [agentId, loadAgent]);

  useEffect(() => {
    if (!agentId) return;
    saveStoredActiveSessionId(agentId, activeSessionId);
  }, [agentId, activeSessionId]);

  useEffect(() => {
    if (!agentId || !activeSessionId || messages.length === 0) return;
    saveCachedSessionMessages(agentId, activeSessionId, messages);
  }, [agentId, activeSessionId, messages]);

  useEffect(() => {
    if (!rateLimitUntil) {
      setRateLimitRemaining(0);
      return;
    }
    const tick = () => {
      const next = Math.max(0, Math.floor((rateLimitUntil - Date.now()) / 1000));
      setRateLimitRemaining(next);
      if (next <= 0) {
        setRateLimitUntil(null);
      }
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [rateLimitUntil]);

  async function createSession(title?: string): Promise<string> {
    if (!agentId) {
      throw new Error("Agent not found");
    }

    const response = await fetch(`/api/agents/${agentId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const body = await parseJsonSafely<ApiResponse<ChatSessionItem>>(response);
    if (!response.ok || !body?.success || !body.data) {
      throw new Error(getErrorMessage(body, `Failed to create session (${response.status})`));
    }

    const created = body.data;
    setSessions((prev) => [created, ...prev.filter((item) => item.id !== created.id)]);
    setActiveSessionId(created.id);
    setMessages([]);
    return created.id;
  }

  async function handleNewChat() {
    try {
      setError(null);
      await createSession("New chat");
      setComposerValue("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create chat session");
    }
  }

  async function renameSession(session: ChatSessionItem) {
    const nextTitle = window.prompt("Rename chat", session.title);
    if (!nextTitle || nextTitle.trim() === session.title) return;

    const response = await fetch(`/api/agents/${agentId}/sessions/${session.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: nextTitle.trim() }),
    });
    const body = await parseJsonSafely<ApiResponse<ChatSessionItem>>(response);
    if (!response.ok || !body?.success) {
      throw new Error(getErrorMessage(body, `Failed to rename session (${response.status})`));
    }

    setSessions((prev) =>
      prev.map((item) => (item.id === session.id ? { ...item, title: nextTitle.trim() } : item))
    );
  }

  async function deleteSession(session: ChatSessionItem) {
    const confirmed = window.confirm(`Delete chat "${session.title}"?`);
    if (!confirmed) return;

    const response = await fetch(`/api/agents/${agentId}/sessions/${session.id}`, {
      method: "DELETE",
    });
    const body = await parseJsonSafely<ApiResponse<{ id: string }>>(response);
    if (!response.ok || !body?.success) {
      throw new Error(getErrorMessage(body, `Failed to delete session (${response.status})`));
    }

    const next = sessions.filter((item) => item.id !== session.id);
    setSessions(next);
    if (activeSessionId === session.id) {
      if (next.length > 0) {
        setActiveSessionId(next[0].id);
        await loadMessages(next[0].id);
      } else {
        setActiveSessionId(null);
        setMessages([]);
      }
    }
  }

  function parseSseChunk(chunk: string): Array<{ event: string; data: unknown }> {
    const events: Array<{ event: string; data: unknown }> = [];
    const blocks = chunk.split("\n\n").filter(Boolean);

    for (const block of blocks) {
      const lines = block.split("\n");
      const eventLine = lines.find((line) => line.startsWith("event:"));
      const dataLine = lines.find((line) => line.startsWith("data:"));
      if (!eventLine || !dataLine) continue;
      const event = eventLine.slice("event:".length).trim();
      const rawData = dataLine.slice("data:".length).trim();
      try {
        events.push({ event, data: JSON.parse(rawData) });
      } catch {
        events.push({ event, data: rawData });
      }
    }

    return events;
  }

  async function sendMessage(rawPrompt?: string) {
    const prompt = (rawPrompt ?? composerValue).trim();
    if (!agentId || !prompt || sending || rateLimitRemaining > 0) return;

    console.log(`[chat-debug] sendMessage called, activeSessionId=${activeSessionId}, type=${typeof activeSessionId}, sessions.length=${sessions.length}`);

    setError(null);
    setSending(true);
    setComposerValue("");

    // Debug: log what the nullish coalescing will do
    const willCreateSession = activeSessionId === null || activeSessionId === undefined;
    console.log(`[chat-debug] willCreateSession=${willCreateSession}, activeSessionId===null: ${activeSessionId === null}, activeSessionId===undefined: ${activeSessionId === undefined}`);

    const targetSessionId = activeSessionId ?? (await createSession(buildQuickTitle(prompt)));
    console.log(`[chat-debug] targetSessionId=${targetSessionId}, type=${typeof targetSessionId}`);
    setActiveSessionId(targetSessionId);

    const now = new Date().toISOString();
    const optimisticUser: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      role: "USER",
      content: prompt,
      createdAt: now,
    };
    const optimisticAssistant: ChatMessage = {
      id: `temp-assistant-${Date.now()}`,
      role: "ASSISTANT",
      content: "",
      createdAt: now,
    };

    const collectedToolUses: Array<{
      tool: string;
      input?: Record<string, unknown>;
      output?: string;
      technicalOutput?: string;
      status?: "success" | "error";
      duration_ms?: number;
    }> = [];

    setMessages((prev) => [...prev, optimisticUser, optimisticAssistant]);

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const response = await fetch(`/api/agents/${agentId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          sessionId: targetSessionId,
          stream: true,
        }),
        signal: abortController.signal,
      });

      if (!response.ok || !response.body) {
        const body = await parseJsonSafely<ApiResponse<unknown>>(response);
        const retryAfterHeader = parseRetryAfterHeader(response.headers.get("Retry-After"));
        const retryAfterBody =
          body && typeof body === "object" && typeof (body as { retryAfterSec?: unknown }).retryAfterSec === "number"
            ? Math.floor((body as { retryAfterSec: number }).retryAfterSec)
            : null;
        const retryAfterSec = retryAfterHeader ?? retryAfterBody;

        if (response.status === 429 && retryAfterSec && retryAfterSec > 0) {
          setRateLimitUntil(Date.now() + retryAfterSec * 1000);
          throw new Error(`Rate limit reached. Try again in ${formatDuration(retryAfterSec)}.`);
        }

        throw new Error(getErrorMessage(body, `Failed to send message (${response.status})`));
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assembled = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const event of chunks.flatMap((chunk) => parseSseChunk(`${chunk}\n\n`))) {
          if (event.event === "tool_use" && event.data && typeof event.data === "object") {
            const payload = event.data as Record<string, unknown>;
            const toolStatus: "success" | "error" = payload.status === "error" ? "error" : "success";
            const toolUse = {
              tool: typeof payload.tool === "string" ? payload.tool : "unknown",
              input: payload.input as Record<string, unknown> | undefined,
              output: typeof payload.output === "string" ? payload.output : undefined,
              technicalOutput:
                typeof payload.technicalOutput === "string" ? payload.technicalOutput : undefined,
              status: toolStatus,
              duration_ms: typeof payload.duration_ms === "number" ? payload.duration_ms : undefined,
            };
            collectedToolUses.push(toolUse);
            setMessages((prev) =>
              prev.map((item) =>
                item.id === optimisticAssistant.id
                  ? { ...item, toolUses: [...collectedToolUses] }
                  : item
              )
            );
          }

          if (event.event === "delta" && event.data && typeof event.data === "object") {
            const text = (event.data as Record<string, unknown>).text;
            if (typeof text === "string") {
              assembled += text;
              setMessages((prev) =>
                prev.map((item) =>
                  item.id === optimisticAssistant.id ? { ...item, content: assembled } : item
                )
              );
            }
          }

          if (event.event === "session" && event.data && typeof event.data === "object") {
            const id = (event.data as Record<string, unknown>).sessionId;
            if (typeof id === "string") {
              console.log(`[chat-debug] Received session event, setting activeSessionId=${id}`);
              setActiveSessionId(id);
            }
          }

          if (event.event === "done" && event.data && typeof event.data === "object") {
            const payload = event.data as Record<string, unknown>;
            const assistantMessage = payload.assistantMessage as ChatMessage | undefined;
            if (assistantMessage?.id) {
              // Preserve collected toolUses on the final message
              const finalMsg: any = {
                ...assistantMessage,
                role: "ASSISTANT",
              };
              if (collectedToolUses.length > 0) {
                finalMsg.toolUses = collectedToolUses;
              }
              setMessages((prev) =>
                prev.map((item) =>
                  item.id === optimisticAssistant.id ? finalMsg : item
                )
              );
            }
          }

          if (event.event === "error") {
            const payload = event.data as Record<string, unknown>;
            const errMessage = typeof payload?.message === "string" ? payload.message : "Chat failed";
            const safeErrorMessage = sanitizeUiErrorMessage(errMessage);
            const retryAfterSec =
              typeof payload?.retryAfterSec === "number" ? Math.floor(payload.retryAfterSec) : 0;
            const statusCode = typeof payload?.status === "number" ? payload.status : 0;
            const code = typeof payload?.code === "string" ? payload.code : "";
            if ((statusCode === 429 || code === "rate_limited") && retryAfterSec > 0) {
              setRateLimitUntil(Date.now() + retryAfterSec * 1000);
              setError(`Rate limit reached. Try again in ${formatDuration(retryAfterSec)}.`);
            } else {
              setError(safeErrorMessage);
            }
          }
        }
      }

      // Non-blocking refresh: if the post-send sessions refresh fails transiently,
      // keep the successful chat turn visible and continue.
      void loadSessions().catch(() => {
        // intentionally silent
      });

      // Non-blocking refresh: a transient agent metadata fetch failure should not
      // mask an otherwise successful chat turn.
      void loadAgent().catch(() => {
        // intentionally silent
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Generation stopped");
      } else {
        const errorMessage = sanitizeUiErrorMessage(
          err instanceof Error ? err.message : "Failed to send message"
        );
        const looksNetworkLike =
          /network|fetch|timed out|invalid json/i.test(errorMessage);

        if (looksNetworkLike) {
          setError("Temporary network issue. Reconnecting chat state...");
          void loadAgent().catch(() => undefined);
          void loadSessions().catch(() => undefined);
        } else {
          setError(errorMessage);
        }
      }
    }

    abortRef.current = null;
    setSending(false);
  }

  async function handleRetry(message: ChatMessage) {
    const index = messages.findIndex((item) => item.id === message.id);
    if (index < 1) return;

    for (let i = index - 1; i >= 0; i -= 1) {
      if (messages[i].role === "USER") {
        await sendMessage(messages[i].content);
        return;
      }
    }
  }

  async function handleSelectSession(sessionId: string) {
    if (sessionId === activeSessionId) return;
    setActiveSessionId(sessionId);
    await loadMessages(sessionId);
  }

  if (loading) {
    return <div className="cc-loading">Loading cloud agent...</div>;
  }

  if (!agent) {
    return <div className="cc-loading" style={{ color: "var(--error)" }}>{error ?? "Agent not found"}</div>;
  }

  const statusClass =
    agent.status === "RUNNING"
      ? "is-running"
      : agent.status === "FAILED"
        ? "is-failed"
        : agent.status === "PROVISIONING"
          ? "is-provisioning"
          : agent.status === "QUEUED"
            ? "is-queued"
            : "";

  return (
    <div className="cc-layout">
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((prev) => !prev)}
        onSelect={(sessionId) => void handleSelectSession(sessionId)}
        onNewChat={() => void handleNewChat()}
        onRename={(session) =>
          void renameSession(session).catch((err) =>
            setError(err instanceof Error ? err.message : "Failed to rename session")
          )
        }
        onDelete={(session) =>
          void deleteSession(session).catch((err) =>
            setError(err instanceof Error ? err.message : "Failed to delete session")
          )
        }
      />

      <div className="cc-center">
        <div className="cc-topbar">
          <div className="cc-topbar-left">
            <span className={`cc-status-dot ${statusClass}`} />
            <span className="cc-agent-name">{agent.name}</span>
          </div>
        </div>

        {error && (
          <div className="cc-error">
            {error}
            {rateLimitRemaining > 0 && (
              <span className="cc-error-meta">Next send window: {formatDuration(rateLimitRemaining)}</span>
            )}
          </div>
        )}

        {activeSessionId ? (
          <MessageList
            messages={messages}
            isGenerating={sending || loadingMessages}
            onRetryMessage={(message) => void handleRetry(message)}
            onSuggestionPick={(prompt) => void sendMessage(prompt)}
          />
        ) : (
          <EmptyState
            onPromptPick={(prompt) => {
              setComposerValue(prompt);
            }}
          />
        )}

        <Composer
          value={composerValue}
          onChange={setComposerValue}
          onSubmit={() => void sendMessage()}
          onStop={() => abortRef.current?.abort()}
          disabled={loading || rateLimitRemaining > 0}
          generating={sending}
          modelLabel={agent.modelName}
        />
      </div>
    </div>
  );
}
