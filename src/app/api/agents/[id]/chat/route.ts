import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { runCloudAgentTurn } from "@/lib/cloud-agent-chat";
import { proxyToRunner, type RunnerChatResult } from "@/lib/runner-proxy";
import { discoverRunnerEndpoint } from "@/lib/agent-provisioning";
import { authenticateRequest } from "@/lib/request-auth";

const MAX_RECENT_HISTORY_MESSAGES = 8;
const MAX_HISTORY_CHARS = 900;
const MAX_SUMMARY_CHARS = 1200;
const MAX_STORED_ANSWER_CHARS = 12_000;
const MAX_MEMORY_SOURCE_MESSAGES = 20;
const MAX_MEMORY_LINE_CHARS = 240;
const MAX_MEMORY_TOTAL_CHARS = 2600;
const MAX_RUNTIME_CONTEXT_SKILLS = 5;
const MAX_RUNTIME_CONTEXT_MEMORIES = 8;
const MAX_RUNTIME_CONTEXT_CHARS = 2400;
const REQUIRE_RUNNER = process.env.CLOUD_CHAT_REQUIRE_RUNNER !== "false";

function isWebsterAgent(name: string): boolean {
  return name.toLowerCase().includes("webster");
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
}

interface RawToolCall {
  name: string;
  input: unknown;
  result: unknown;
}

interface UiToolCall extends RawToolCall {
  summary: string;
  technicalOutput: string;
  status: "success" | "error";
}

function safeStringify(value: unknown, maxChars = 10_000): string {
  let text: string;
  try {
    text = JSON.stringify(value, null, 2);
  } catch {
    text = String(value);
  }
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n... [truncated for readability]`;
}

function formatBytes(value: unknown): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return "n/a";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function parsePossibleJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function unwrapToolPayload(result: unknown): {
  payload: unknown;
  success: boolean;
  errorMessage?: string;
} {
  const parsed = parsePossibleJson(result);
  if (!parsed || typeof parsed !== "object") {
    return { payload: parsed, success: true };
  }

  const row = parsed as Record<string, unknown>;
  const successFlag = typeof row.success === "boolean" ? row.success : true;
  const errorMessage = typeof row.error === "string" ? row.error.trim() : "";
  const payload =
    row.output !== undefined
      ? row.output
      : row.value !== undefined
        ? row.value
        : row.result !== undefined
          ? row.result
          : parsed;

  return {
    payload,
    success: successFlag && !errorMessage,
    errorMessage: errorMessage || undefined,
  };
}

function summarizeToolCall(call: RawToolCall): { summary: string; status: "success" | "error" } {
  const { payload, success, errorMessage } = unwrapToolPayload(call.result);
  const status: "success" | "error" = success ? "success" : "error";

  if (!success) {
    return {
      summary: `\`${call.name}\` returned an error: ${errorMessage ?? "unknown error"}.`,
      status,
    };
  }

  if (call.name === "runtime_info" && payload && typeof payload === "object") {
    const row = payload as Record<string, unknown>;
    const osPlatform = typeof row.osPlatform === "string" ? row.osPlatform : undefined;
    const platform = typeof row.platform === "string" ? row.platform : undefined;
    const nodeVersion = typeof row.nodeVersion === "string" ? row.nodeVersion : undefined;
    const cwd =
      typeof row.cwd === "string"
        ? row.cwd
        : typeof row.workspace === "string"
          ? row.workspace
          : "/workspace";
    const env = typeof row.env === "string" ? row.env : undefined;
    return {
      summary: `Runtime is ${platform ?? osPlatform ?? "Linux"} with Node ${nodeVersion ?? "unknown"}, currently using \`${cwd}\`${env ? ` (${env})` : ""}.`,
      status,
    };
  }

  if (call.name === "list_dir" && payload && typeof payload === "object") {
    const row = payload as Record<string, unknown>;
    const path =
      typeof row.path === "string"
        ? row.path
        : call.input && typeof call.input === "object" && typeof (call.input as Record<string, unknown>).path === "string"
          ? ((call.input as Record<string, unknown>).path as string)
          : "/workspace";
    const entries = Array.isArray(row.entries) ? row.entries.slice(0, 6) : [];
    const totalEntries =
      typeof row.totalEntries === "number" ? row.totalEntries : Array.isArray(row.entries) ? row.entries.length : entries.length;
    const rows = entries
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;
        const e = entry as Record<string, unknown>;
        const name = typeof e.name === "string" ? e.name : "unknown";
        const type = typeof e.type === "string" ? e.type : "item";
        const size = formatBytes(e.size);
        return `| \`${name}\` | ${type} | ${size} |`;
      })
      .filter(Boolean) as string[];

    if (rows.length > 0) {
      return {
        summary:
          `Directory \`${path}\` has ${totalEntries} entries.\n\n` +
          `| Name | Type | Size |\n| --- | --- | --- |\n${rows.join("\n")}`,
        status,
      };
    }

    return {
      summary: `Directory \`${path}\` was checked and appears empty.`,
      status,
    };
  }

  if (call.name === "shell_command" && payload && typeof payload === "string") {
    const firstLine = payload.split("\n").find((line) => line.trim().length > 0)?.trim();
    return {
      summary: firstLine ? `Command completed. Output starts with: ${firstLine}` : "Command completed with no output.",
      status,
    };
  }

  if (call.name === "read_file" && payload && typeof payload === "string") {
    const path =
      call.input && typeof call.input === "object" && typeof (call.input as Record<string, unknown>).path === "string"
        ? ((call.input as Record<string, unknown>).path as string)
        : "file";
    return {
      summary: `Read \`${path}\` (${payload.length} characters).`,
      status,
    };
  }

  if (call.name === "write_file" && payload && typeof payload === "string") {
    return {
      summary: `Saved file update successfully: ${payload}`,
      status,
    };
  }

  if (call.name === "get_time" && payload && typeof payload === "object") {
    const row = payload as Record<string, unknown>;
    const iso = typeof row.iso === "string" ? row.iso : null;
    return {
      summary: iso ? `Current server time is ${iso}.` : "Fetched current server time.",
      status,
    };
  }

  if (call.name === "get_agent_status" && payload && typeof payload === "object") {
    const row = payload as Record<string, unknown>;
    const agent = row.agent && typeof row.agent === "object" ? (row.agent as Record<string, unknown>) : null;
    const agentStatus = agent && typeof agent.status === "string" ? agent.status : "unknown";
    const name = agent && typeof agent.name === "string" ? agent.name : "agent";
    return {
      summary: `${name} status is ${agentStatus}.`,
      status,
    };
  }

  if (call.name === "recent_usage" && payload && typeof payload === "object") {
    const row = payload as Record<string, unknown>;
    const count = typeof row.count === "number" ? row.count : 0;
    return {
      summary: `Fetched ${count} recent usage records for this agent.`,
      status,
    };
  }

  if (call.name === "list_skills" && payload && typeof payload === "object") {
    const row = payload as Record<string, unknown>;
    const count = typeof row.count === "number" ? row.count : 0;
    return {
      summary: `Loaded ${count} skills for this runtime context.`,
      status,
    };
  }

  if (call.name === "search_memory" && payload && typeof payload === "object") {
    const row = payload as Record<string, unknown>;
    const count = typeof row.count === "number" ? row.count : 0;
    return {
      summary: `Found ${count} memory entries matching the query.`,
      status,
    };
  }

  if (call.name === "write_memory" && payload && typeof payload === "object") {
    const row = payload as Record<string, unknown>;
    const successFlag = row.success === true;
    return {
      summary: successFlag ? "Saved memory entry successfully." : "Memory write did not complete.",
      status,
    };
  }

  if (call.name === "list_scheduled_tasks" && payload && typeof payload === "object") {
    const row = payload as Record<string, unknown>;
    const count = typeof row.count === "number" ? row.count : 0;
    return {
      summary: `Loaded ${count} scheduled tasks.`,
      status,
    };
  }

  if (call.name === "web_fetch" && payload && typeof payload === "object") {
    const row = payload as Record<string, unknown>;
    const statusCode = typeof row.status === "number" ? row.status : null;
    const url = typeof row.url === "string" ? row.url : null;
    return {
      summary: `Fetched ${url ?? "target URL"}${statusCode ? ` (HTTP ${statusCode})` : ""}.`,
      status,
    };
  }

  // ═══ MARKETO BROWSER-EXECUTED TOOLS ═══
  // These return { browserExecution: true, status: "dispatched" }
  // The real data comes later via the tool results feedback loop
  const marketoTools = new Set([
    "list_programs", "list_smart_campaigns", "list_emails", "list_forms",
    "list_folders", "list_tokens", "get_instance_info", "list_email_templates",
    "list_lp_templates", "list_channels", "list_workspaces", "list_uploaded_files",
    "create_program", "clone_program", "delete_program",
    "create_smart_campaign", "clone_smart_campaign", "activate_smart_campaign", "deactivate_smart_campaign",
    "create_email", "clone_email", "approve_email", "send_test_email",
    "create_landing_page", "clone_landing_page", "approve_landing_page",
    "clone_form", "approve_form", "create_folder", "rename_folder", "move_asset",
    "create_token", "delete_token",
  ]);

  if (marketoTools.has(call.name)) {
    const row = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
    const note = typeof row.note === "string" ? row.note : "";
    const toolStatus = typeof row.status === "string" ? row.status : "executed";
    if (toolStatus === "dispatched") {
      return {
        summary: `\`${call.name}\` dispatched to browser extension. Results arriving shortly.`,
        status: "success",
      };
    }
    return {
      summary: note || `\`${call.name}\` executed in browser.`,
      status: "success",
    };
  }

  if (typeof payload === "string") {
    const oneLine = payload.replace(/\s+/g, " ").trim();
    return {
      summary: oneLine.length > 140 ? `${oneLine.slice(0, 140)}...` : oneLine || `\`${call.name}\` completed successfully.`,
      status,
    };
  }

  return {
    summary: `\`${call.name}\` completed successfully.`,
    status,
  };
}

function formatToolCallsForUi(toolCalls: RawToolCall[]): UiToolCall[] {
  return toolCalls.map((call) => {
    const { summary, status } = summarizeToolCall(call);
    return {
      ...call,
      summary,
      status,
      technicalOutput: safeStringify(call.result),
    };
  });
}

function buildToolRecap(toolCalls: UiToolCall[]): string {
  const lines = toolCalls.slice(0, 8).map((call) => `- ${call.summary}`);
  if (toolCalls.length > 8) {
    lines.push(`- Plus ${toolCalls.length - 8} additional tool steps (see Technical details).`);
  }
  return `I completed these steps:\n${lines.join("\n")}`;
}

function answerLooksLikeJsonDump(answer: string): boolean {
  const trimmed = answer.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith("```json")) return true;
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    return true;
  }
  return (
    trimmed.length > 280 &&
    (/"success"\s*:/.test(trimmed) || /"output"\s*:/.test(trimmed) || /"entries"\s*:/.test(trimmed))
  );
}

function sanitizeMemoryClaims(answer: string): string {
  let sanitized = answer;
  sanitized = sanitized.replace(
    /my memory is limited to the current conversation thread[^.\n]*\.?/gi,
    "I can use this session history and saved runtime memory when available."
  );
  sanitized = sanitized.replace(
    /i (?:do not|don't|cannot|can't) retain information between (?:separate )?conversation sessions[^.\n]*\.?/gi,
    "I can use prior session context and persisted memory that has been saved for this workspace."
  );
  return sanitized.replace(/\n{3,}/g, "\n\n").trim();
}

function userFacingAnswer(answer: string, toolCalls: UiToolCall[]): string {
  const cleaned = sanitizeMemoryClaims(answer.replace(/```json[\s\S]*?```/gi, "Technical details are available in the tool cards below.").trim());
  if (!toolCalls.length) {
    return cleaned || "Done.";
  }
  if (!cleaned || answerLooksLikeJsonDump(cleaned)) {
    return buildToolRecap(toolCalls);
  }
  return cleaned;
}

function buildSessionTitle(message: string): string {
  return message.trim().replace(/\s+/g, " ").slice(0, 72) || "New chat";
}

function chunkAnswer(answer: string): string[] {
  const tokens = answer.split(/(\s+)/).filter(Boolean);
  const chunks: string[] = [];
  let acc = "";

  for (const token of tokens) {
    acc += token;
    if (acc.length >= 22 || token.includes("\n")) {
      chunks.push(acc);
      acc = "";
    }
  }

  if (acc) chunks.push(acc);
  return chunks;
}

function truncateContent(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value;
  return `${value.slice(0, maxChars)}\n\n[truncated for stability]`;
}

function toModelHistory(
  rows: Array<{ role: "USER" | "ASSISTANT"; content: string }>,
  persistedSummary?: string | null
): Array<{ role: "USER" | "ASSISTANT"; content: string }> {
  const normalized = rows.map((row) => ({
    role: row.role,
    content: truncateContent(row.content, MAX_HISTORY_CHARS),
  }));

  if (persistedSummary && persistedSummary.trim()) {
    return [
      {
        role: "ASSISTANT",
        content: `Session memory summary:\n${truncateContent(persistedSummary.trim(), MAX_SUMMARY_CHARS)}`,
      },
      ...normalized.slice(-MAX_RECENT_HISTORY_MESSAGES),
    ];
  }

  if (normalized.length <= MAX_RECENT_HISTORY_MESSAGES) {
    return normalized;
  }

  // Keep recent turns verbatim and summarize older turns to avoid hitting context limits too early.
  const older = normalized.slice(0, -MAX_RECENT_HISTORY_MESSAGES);
  const recent = normalized.slice(-MAX_RECENT_HISTORY_MESSAGES);
  const summary = truncateContent(
    older
      .map((row) => `${row.role === "USER" ? "User" : "Assistant"}: ${truncateContent(row.content, 220)}`)
      .join("\n"),
    MAX_SUMMARY_CHARS
  );

  return [
    {
      role: "ASSISTANT",
      content: `Conversation summary from earlier turns:\n${summary}`,
    },
    ...recent,
  ];
}

function buildSessionMemorySummary(
  rows: Array<{ role: "USER" | "ASSISTANT"; content: string }>
): string {
  const relevant = rows.slice(-MAX_MEMORY_SOURCE_MESSAGES);
  const lines = relevant.map((row) => {
    const speaker = row.role === "USER" ? "User" : "Assistant";
    return `${speaker}: ${truncateContent(row.content, MAX_MEMORY_LINE_CHARS)}`;
  });

  return truncateContent(lines.join("\n"), MAX_MEMORY_TOTAL_CHARS);
}

async function loadRuntimeContextNote(userId: string, agentId: string, projectId?: string | null): Promise<string | null> {
  const [project, skills, memories] = await Promise.all([
    projectId
      ? prisma.project.findFirst({
          where: { id: projectId, userId },
          select: { name: true, instructions: true },
        })
      : Promise.resolve(null),
    prisma.skill.findMany({
      where: projectId
        ? {
            userId,
            isActive: true,
            OR: [{ scope: "GLOBAL" }, { projectId }],
          }
        : {
            userId,
            isActive: true,
            scope: "GLOBAL",
          },
      orderBy: [{ updatedAt: "desc" }],
      take: MAX_RUNTIME_CONTEXT_SKILLS,
      select: {
        name: true,
        content: true,
      },
    }),
    prisma.memoryEntry.findMany({
      where: projectId
        ? {
            userId,
            OR: [{ agentId }, { projectId }],
          }
        : {
            userId,
            agentId,
          },
      orderBy: [{ updatedAt: "desc" }],
      take: MAX_RUNTIME_CONTEXT_MEMORIES,
      select: {
        kind: true,
        title: true,
        content: true,
      },
    }),
  ]);

  const blocks: string[] = [];

  if (project) {
    blocks.push(`Project: ${project.name}`);
    if (project.instructions?.trim()) {
      blocks.push(`Project instructions: ${truncateContent(project.instructions.trim(), 500)}`);
    }
  }

  if (skills.length > 0) {
    blocks.push(
      "Active skills:\n" +
        skills
          .map((skill) => `- ${skill.name}: ${truncateContent(skill.content, 260).replace(/\n+/g, " ")}`)
          .join("\n")
    );
  }

  if (memories.length > 0) {
    blocks.push(
      "Recent memory recalls:\n" +
        memories
          .map((entry) => {
            const title = entry.title?.trim() ? ` (${entry.title.trim()})` : "";
            return `- [${entry.kind}]${title} ${truncateContent(entry.content, 220).replace(/\n+/g, " ")}`;
          })
          .join("\n")
    );
  }

  if (blocks.length === 0) return null;
  return truncateContent(`Runtime context:\n${blocks.join("\n\n")}`, MAX_RUNTIME_CONTEXT_CHARS);
}

function isNonFatalChatError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }
  const message = error instanceof Error ? error.message : `${error ?? ""}`;
  const lowered = message.toLowerCase();
  return (
    lowered.includes("controller is already closed") ||
    lowered.includes("operation was aborted") ||
    lowered.includes("stream closed") ||
    lowered.includes("invalid state: readablestream is already closed")
  );
}

/** Runner not yet available — transient during ECS provisioning. Don't mark agent FAILED. */
function isTransientRunnerError(error: unknown): boolean {
  return error instanceof ChatRouteError && error.code === "runner_unavailable";
}

class ChatRouteError extends Error {
  status: number;
  code: string;
  retryAfterSec?: number;

  constructor(status: number, code: string, message: string, retryAfterSec?: number) {
    super(message);
    this.status = status;
    this.code = code;
    this.retryAfterSec = retryAfterSec;
  }
}

function parseRetryAfterSeconds(rawMessage: string): number | undefined {
  const message = rawMessage.toLowerCase();

  const secMatch = message.match(/(?:retry|wait)\s+(?:after\s+)?(\d+)\s*(?:s|sec|seconds)\b/);
  if (secMatch) return Math.max(5, Math.min(3600, Number(secMatch[1])));

  const minMatch = message.match(/(?:retry|wait)\s+(?:after\s+)?(\d+)\s*(?:m|min|minutes)\b/);
  if (minMatch) return Math.max(60, Math.min(7200, Number(minMatch[1]) * 60));

  const hourMatch = message.match(/(?:retry|wait)\s+(?:after\s+)?(\d+)\s*(?:h|hr|hours)\b/);
  if (hourMatch) return Math.max(300, Math.min(86_400, Number(hourMatch[1]) * 3600));

  if (message.includes("too many tokens per day")) return 3600;
  if (message.includes("too many requests") || message.includes("throttl")) return 120;
  return undefined;
}

function looksLikeHtmlError(rawMessage: string): boolean {
  const message = rawMessage.toLowerCase();
  return (
    message.includes("<html") ||
    message.includes("<!doctype") ||
    message.includes("</html>") ||
    message.includes("<head>") ||
    message.includes("<body>")
  );
}

function toChatRouteError(error: unknown): ChatRouteError {
  if (error instanceof ChatRouteError) return error;
  const message = error instanceof Error ? error.message : "Cloud chat failed";
  const lowered = message.toLowerCase();

  if (
    lowered.includes("too many requests") ||
    lowered.includes("throttl") ||
    lowered.includes("too many tokens per day")
  ) {
    const retryAfterSec = parseRetryAfterSeconds(message) ?? 120;
    return new ChatRouteError(429, "rate_limited", message, retryAfterSec);
  }

  if (
    lowered.includes("runner timeout") ||
    lowered.includes("runner unavailable") ||
    lowered.includes("runtime not ready") ||
    lowered.includes("runner upstream gateway error") ||
    lowered.includes("runner returned 50") ||
    lowered.includes("bad gateway") ||
    looksLikeHtmlError(message)
  ) {
    return new ChatRouteError(
      503,
      "runner_unavailable",
      "Cloud runtime temporarily unavailable. Please retry in a few seconds.",
      20
    );
  }

  return new ChatRouteError(500, "chat_failed", message);
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const authContext = await authenticateRequest(request);
  if (!authContext?.userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const userId = authContext.userId;

  const { id } = await context.params;
  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    if (request.signal.aborted) {
      return new Response(null, { status: 204 });
    }
    return NextResponse.json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
  }

  const rawMessage = typeof payload.message === "string" ? payload.message.trim() : "";
  const requestedSessionId =
    typeof payload.sessionId === "string" && payload.sessionId.trim().length > 0
      ? payload.sessionId.trim()
      : null;

  // Extract Marketo page context from extension (if provided)
  const websterContext = payload.context && typeof payload.context === "object"
    ? payload.context as Record<string, unknown>
    : null;

  // Enrich message with page context for Webster agents
  let message = rawMessage;
  if (websterContext && Object.keys(websterContext).length > 0) {
    const ctxParts: string[] = [];
    if (websterContext.marketoSection) ctxParts.push(`Current section: ${websterContext.marketoSection}`);
    if (websterContext.marketoAssetId) ctxParts.push(`Active asset: ${websterContext.marketoAssetType ?? ""}${websterContext.marketoAssetId}`);
    if (websterContext.pageUrl) ctxParts.push(`Page: ${websterContext.pageUrl}`);
    if (Array.isArray(websterContext.breadcrumbs) && websterContext.breadcrumbs.length > 0) {
      ctxParts.push(`Navigation: ${(websterContext.breadcrumbs as string[]).join(" > ")}`);
    }
    if (ctxParts.length > 0) {
      message = `${rawMessage}\n\n[Page context: ${ctxParts.join(" | ")}]`;
    }
  }
  // Default to streaming for web clients. Explicit `false` keeps legacy non-stream mode.
  const wantsStream = !(payload.stream === false || payload.stream === "false");

  if (message.length < 1 || message.length > 4000) {
    return NextResponse.json(
      { success: false, error: "Message is required and must be <= 4000 characters" },
      { status: 400 }
    );
  }

  const agent = await prisma.agent.findFirst({
    where: {
      id,
      userId,
    },
    select: {
      id: true,
      userId: true,
      name: true,
      platform: true,
      instructions: true,
      modelName: true,
      mcpEndpoint: true,
      cloudChatEndpoint: true,
      ecsClusterArn: true,
      ecsTaskArn: true,
      status: true,
      projectId: true,
    },
  });

  if (!agent) {
    return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
  }

  if (agent.platform !== "CLOUD") {
    return NextResponse.json(
      { success: false, error: "Chat is only available for CLOUD agents" },
      { status: 400 }
    );
  }

  console.log(`[chat] Session lookup: requestedSessionId=${requestedSessionId ?? "null"} agentId=${agent.id} userId=${userId}`);

  const existingSession = requestedSessionId
    ? await prisma.agentChatSession.findFirst({
        where: {
          id: requestedSessionId,
          agentId: agent.id,
          userId,
        },
      })
    : null;

  console.log(`[chat] existingSession=${existingSession?.id ?? "null"} (${existingSession ? "FOUND" : requestedSessionId ? "NOT FOUND" : "NOT REQUESTED"})`);

  const chatSession =
    existingSession ??
    (await prisma.agentChatSession.create({
      data: {
        agentId: agent.id,
        userId,
        title: buildSessionTitle(message),
        lastMessageAt: new Date(),
      },
    }));

  if (!existingSession) {
    console.log(`[chat] CREATED NEW SESSION: ${chatSession.id} for agent ${agent.id}`);
  }

  const historyRows = await prisma.agentChatMessage.findMany({
    where: {
      agentId: agent.id,
      userId,
      sessionId: chatSession.id,
      role: {
        in: ["USER", "ASSISTANT"],
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    take: 30,
  });

  const memoryRow = await prisma.agentChatMessage.findFirst({
    where: {
      agentId: agent.id,
      userId,
      sessionId: chatSession.id,
      role: "SYSTEM",
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      content: true,
    },
  });

  const userMessage = await prisma.agentChatMessage.create({
    data: {
      agentId: agent.id,
      userId,
      sessionId: chatSession.id,
      role: "USER",
      content: message,
    },
  });

  const runAndPersist = async () => {
    const baseHistory = toModelHistory(
      historyRows.map((row) => ({
        role: row.role,
        content: row.content,
      })) as Array<{ role: "USER" | "ASSISTANT"; content: string }>,
      memoryRow?.content ?? null
    );
    const runtimeContextNote = await loadRuntimeContextNote(userId, agent.id, agent.projectId);
    const history = runtimeContextNote
      ? ([{ role: "ASSISTANT", content: runtimeContextNote }, ...baseHistory] as Array<{
          role: "USER" | "ASSISTANT";
          content: string;
        }>)
      : baseHistory;

    // Resolve runner endpoint and execute chat turn.
    let result: RunnerChatResult;

    // Resolve runner endpoint: if cloudChatEndpoint is an http URL, use it directly.
    // If it's a relative path or absent, try to discover from ECS task.
    let runnerUrl = agent.cloudChatEndpoint;
    if (runnerUrl && !runnerUrl.startsWith("http")) {
      runnerUrl = null; // Relative path (legacy) — needs discovery
    }

    // Lazy discovery: if no runner URL but agent has ECS task, discover it
    if (!runnerUrl && agent.ecsClusterArn && agent.ecsTaskArn) {
      try {
        const discovery = await discoverRunnerEndpoint(agent);
        if (discovery.endpoint) {
          runnerUrl = discovery.endpoint;
          // Cache the discovered endpoint in the DB for future requests
          await prisma.agent.update({
            where: { id: agent.id },
            data: { cloudChatEndpoint: discovery.endpoint, status: "RUNNING" },
          });
          console.log(`[chat] Discovered runner at ${runnerUrl} for agent ${agent.id}`);
        }
      } catch (discErr: any) {
        console.warn(`[chat] Runner discovery failed: ${discErr.message}`);
      }
    }

    if (!runnerUrl && REQUIRE_RUNNER) {
      throw new ChatRouteError(
        503,
        "runner_unavailable",
        "Cloud runtime not ready yet. Wait a few seconds and retry.",
        20
      );
    }

    // Webster agents always use control-plane for Marketo tools support
    if (isWebsterAgent(agent.name)) {
      console.log(`[chat] Using control-plane for webster agent ${agent.id} (Marketo tools enabled)`);
      result = await runCloudAgentTurn({ agent, userId, message, history });
    } else if (runnerUrl) {
      try {
        result = await proxyToRunner(runnerUrl, {
          message,
          history,
          instructions: agent.instructions ?? undefined,
        });
        console.log(`[chat] Used runner at ${runnerUrl} for agent ${agent.id}`);
      } catch (runnerErr: any) {
        if (REQUIRE_RUNNER) {
          const retryAfterSec = parseRetryAfterSeconds(runnerErr?.message ?? "") ?? 20;
          throw new ChatRouteError(
            503,
            "runner_unavailable",
            `Cloud runtime unavailable: ${runnerErr?.message ?? "runner proxy failed"}`,
            retryAfterSec
          );
        }
        console.warn(`[chat] Runner proxy failed, falling back to control-plane: ${runnerErr.message}`);
        result = await runCloudAgentTurn({ agent, userId, message, history });
      }
    } else {
      result = await runCloudAgentTurn({ agent, userId, message, history });
    }

    const toolCallsForUi = formatToolCallsForUi(result.toolCalls as RawToolCall[]);
    const answerForUi = truncateContent(userFacingAnswer(result.answer, toolCallsForUi), MAX_STORED_ANSWER_CHARS);

    const sessionSummaryText = buildSessionMemorySummary([
      ...historyRows.map((row) => ({
        role: row.role === "ASSISTANT" ? ("ASSISTANT" as const) : ("USER" as const),
        content: row.content,
      })),
      {
        role: "USER" as const,
        content: message,
      },
      {
        role: "ASSISTANT" as const,
        content: answerForUi,
      },
    ]);

    const [assistantMessage] = await prisma.$transaction([
      prisma.agentChatMessage.create({
        data: {
          agentId: agent.id,
          userId,
          sessionId: chatSession.id,
          role: "ASSISTANT",
          content: answerForUi,
          metadata: toJsonValue({
            model: result.model,
            toolCalls: toolCallsForUi,
          }),
        },
      }),
      prisma.agentChatMessage.deleteMany({
        where: {
          agentId: agent.id,
          userId,
          sessionId: chatSession.id,
          role: "SYSTEM",
        },
      }),
      prisma.agentChatMessage.create({
        data: {
          agentId: agent.id,
          userId,
          sessionId: chatSession.id,
          role: "SYSTEM",
          content: sessionSummaryText,
          metadata: toJsonValue({
            kind: "SESSION_SUMMARY",
            source: "auto",
            updatedAt: new Date().toISOString(),
          }),
        },
      }),
      prisma.agentUsageEvent.create({
        data: {
          agentId: agent.id,
          userId,
          model: result.model,
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          totalTokens: result.usage.totalTokens,
          latencyMs: result.usage.latencyMs,
          toolCalls: toJsonValue(toolCallsForUi),
          metadata: toJsonValue({
            source: "cloud-chat",
            sessionId: chatSession.id,
          }),
        },
      }),
      prisma.memoryEntry.create({
        data: {
          userId,
          projectId: agent.projectId ?? null,
          agentId: agent.id,
          kind: "SUMMARY",
          title: `Session ${chatSession.id}`,
          content: truncateContent(answerForUi, 2_000),
          metadata: toJsonValue({
            source: "chat-turn",
            sessionId: chatSession.id,
            model: result.model,
          }),
        },
      }),
      prisma.agent.update({
        where: { id: agent.id },
        data: {
          status: "RUNNING",
          modelName: result.model,
          lastError: null,
        },
      }),
      prisma.agentChatSession.update({
        where: { id: chatSession.id },
        data: {
          lastMessageAt: new Date(),
          title:
            existingSession && existingSession.title !== "New chat"
              ? undefined
              : buildSessionTitle(message),
        },
      }),
    ]);

    return { result, assistantMessage, answerForUi, toolCallsForUi };
  };

  if (!wantsStream) {
    try {
      const { result, assistantMessage, answerForUi, toolCallsForUi } = await runAndPersist();
      return NextResponse.json({
        success: true,
        data: {
          sessionId: chatSession.id,
          userMessage,
          assistantMessage,
          answer: answerForUi,
          usage: result.usage,
          model: result.model,
          toolCalls: toolCallsForUi,
        },
      });
    } catch (error) {
      const routeError = toChatRouteError(error);
      if (!isNonFatalChatError(error) && !isTransientRunnerError(error)) {
        await prisma.agent.update({
          where: { id: agent.id },
          data: {
            status: routeError.status >= 500 ? "FAILED" : "RUNNING",
            lastError: routeError.message,
          },
        });
      }
      const response = NextResponse.json(
        {
          success: false,
          error: routeError.message,
          code: routeError.code,
          retryAfterSec: routeError.retryAfterSec,
        },
        { status: routeError.status }
      );
      if (routeError.retryAfterSec) {
        response.headers.set("Retry-After", String(routeError.retryAfterSec));
      }
      return response;
    }
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let streamClosed = false;

      const safeClose = () => {
        if (streamClosed) return;
        streamClosed = true;
        try {
          controller.close();
        } catch {
          // no-op
        }
      };

      request.signal.addEventListener(
        "abort",
        () => {
          streamClosed = true;
        },
        { once: true }
      );

      const send = (event: string, data: unknown) => {
        if (streamClosed) {
          return false;
        }
        try {
          controller.enqueue(encoder.encode(`event: ${event}\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          return true;
        } catch {
          streamClosed = true;
          return false;
        }
      };

      if (!send("session", { sessionId: chatSession.id })) {
        safeClose();
        return;
      }
      if (!send("ack", { userMessage })) {
        safeClose();
        return;
      }

      try {
        const { result, assistantMessage, answerForUi, toolCallsForUi } = await runAndPersist();

        // Emit individual tool_use events so the frontend can render ToolExecutionCards
        if (toolCallsForUi.length > 0) {
          for (const tc of toolCallsForUi) {
            if (
              !send("tool_use", {
                tool: tc.name,
                input: tc.input ?? {},
                output: tc.summary,
                technicalOutput: tc.technicalOutput,
                status: tc.status,
              })
            ) {
              throw new Error("STREAM_CLOSED");
            }
          }
        }

        for (const chunk of chunkAnswer(answerForUi)) {
          if (!send("delta", { text: chunk })) {
            throw new Error("STREAM_CLOSED");
          }
        }

        send("done", {
          assistantMessage,
          usage: result.usage,
          model: result.model,
          toolCalls: toolCallsForUi,
        });
      } catch (error) {
        const routeError = toChatRouteError(error);
        if (!isNonFatalChatError(error) && !isTransientRunnerError(error) && !request.signal.aborted) {
          await prisma.agent.update({
            where: { id: agent.id },
            data: {
              status: routeError.status >= 500 ? "FAILED" : "RUNNING",
              lastError: routeError.message,
            },
          });

          send("error", {
            message: routeError.message,
            code: routeError.code,
            retryAfterSec: routeError.retryAfterSec,
            status: routeError.status,
          });
        }
      } finally {
        safeClose();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
