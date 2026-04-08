import prisma from "@/lib/db";
import { execFile } from "node:child_process";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { executeMarketoRestTool, type MarketoCredentials } from "@/lib/marketo-api";

/**
 * Try to load Marketo REST API credentials from the agent's inputConfig.
 * Returns null if not configured.
 */
async function getMarketoCredentials(agentId: string): Promise<MarketoCredentials | null> {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: { inputConfig: true },
    });
    const config = agent?.inputConfig as Record<string, unknown> | null;
    if (!config) return null;
    const mkto = config.marketo as Record<string, unknown> | undefined;
    if (!mkto?.instanceUrl || !mkto?.clientId || !mkto?.clientSecret) return null;
    return {
      instanceUrl: String(mkto.instanceUrl),
      clientId: String(mkto.clientId),
      clientSecret: String(mkto.clientSecret),
    };
  } catch {
    return null;
  }
}

/** Marketo tool names that support REST API fallback */
const MARKETO_REST_TOOLS = new Set([
  "list_programs", "list_smart_campaigns", "list_emails", "list_forms",
  "list_folders", "list_landing_pages", "list_smart_lists", "get_instance_info",
  "get_program", "get_leads", "create_program",
]);

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface McpContext {
  agentId: string;
  userId: string;
}

const TOOL_DEFINITIONS: McpToolDefinition[] = [
  {
    name: "shell_command",
    description:
      "Executes a shell command with container permissions. Use for diagnostics, build/test, and system tasks.",
    inputSchema: {
      type: "object",
      properties: {
        command: { type: "string", description: "Shell command to execute" },
        working_dir: {
          type: "string",
          description: "Optional working directory. Defaults to AGENT_WORKSPACE_ROOT or /workspace.",
        },
      },
      required: ["command"],
      additionalProperties: false,
    },
  },
  {
    name: "read_file",
    description: "Reads a file from the runtime filesystem.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Absolute path or path relative to workspace root" },
      },
      required: ["path"],
      additionalProperties: false,
    },
  },
  {
    name: "write_file",
    description: "Writes text content to a file on the runtime filesystem.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Absolute path or path relative to workspace root" },
        content: { type: "string", description: "Text content to write" },
      },
      required: ["path", "content"],
      additionalProperties: false,
    },
  },
  {
    name: "list_dir",
    description: "Lists directory contents.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Absolute path or path relative to workspace root" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_time",
    description: "Returns current server time in ISO and UTC formats.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "get_agent_status",
    description: "Fetches status, platform, and latest runtime metadata for the current agent.",
    inputSchema: {
      type: "object",
      properties: {
        agentId: { type: "string", description: "Optional agent ID. Defaults to current agent." },
      },
      additionalProperties: false,
    },
  },
  {
    name: "recent_usage",
    description: "Returns the most recent token usage events for the current agent.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", minimum: 1, maximum: 20, description: "Number of rows to return" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "runtime_info",
    description: "Returns runtime environment details for this Cloud Agent execution context.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "web_fetch",
    description: "Fetches a public HTTPS URL from allowed domains.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "HTTPS URL to fetch" },
      },
      required: ["url"],
      additionalProperties: false,
    },
  },
  {
    name: "list_skills",
    description: "Lists active skills for this agent/project scope.",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string", description: "Optional project scope override" },
        includeInactive: { type: "boolean", description: "Include disabled skills" },
        limit: { type: "number", minimum: 1, maximum: 20 },
      },
      additionalProperties: false,
    },
  },
  {
    name: "search_memory",
    description: "Searches memory entries by text, kind, project, or agent scope.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Optional text query" },
        kind: { type: "string", enum: ["NOTE", "FACT", "DECISION", "SUMMARY", "KNOWLEDGE"] },
        limit: { type: "number", minimum: 1, maximum: 30 },
      },
      additionalProperties: false,
    },
  },
  {
    name: "write_memory",
    description: "Creates a persistent memory entry for this user/agent context.",
    inputSchema: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["NOTE", "FACT", "DECISION", "SUMMARY", "KNOWLEDGE"] },
        title: { type: "string" },
        content: { type: "string" },
        projectId: { type: "string" },
      },
      required: ["content"],
      additionalProperties: false,
    },
  },
  {
    name: "list_scheduled_tasks",
    description: "Returns scheduler tasks for this operator with optional status filter.",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["ACTIVE", "PAUSED", "FAILED"] },
        limit: { type: "number", minimum: 1, maximum: 30 },
      },
      additionalProperties: false,
    },
  },
];

const WORKSPACE_ROOT = process.env.AGENT_WORKSPACE_ROOT ?? "/workspace";
const MAX_OUTPUT_CHARS = 25_000;
const MAX_FILE_SIZE = 5_000_000;
const MAX_DIR_ENTRIES = 250;
const COMMAND_TIMEOUT_MS = 120_000;

function truncate(value: string, max = MAX_OUTPUT_CHARS): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}\n... [truncated at ${max} chars]`;
}

function redactSensitiveOutput(value: string): string {
  let redacted = value;

  // Redact PEM/OpenSSH private key blocks.
  redacted = redacted.replace(
    /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z0-9 ]*PRIVATE KEY-----/g,
    "[REDACTED_PRIVATE_KEY]"
  );

  // Redact common access key id formats.
  redacted = redacted.replace(/\b(AKIA|ASIA)[0-9A-Z]{16}\b/g, "[REDACTED_AWS_ACCESS_KEY_ID]");

  // Redact generic token-like env assignments.
  redacted = redacted.replace(
    /\b([A-Z0-9_]*(SECRET|TOKEN|KEY|PASSWORD)[A-Z0-9_]*)\s*=\s*([^\s'"]+)/gi,
    "$1=[REDACTED]"
  );

  return redacted;
}

function resolvePath(path: string): string {
  return path.startsWith("/") ? path : resolve(WORKSPACE_ROOT, path);
}

async function executeShellCommand(command: string, workingDir?: string): Promise<Record<string, unknown>> {
  const cwd = workingDir ? resolvePath(workingDir) : WORKSPACE_ROOT;
  await mkdir(cwd, { recursive: true });

  return new Promise((resolvePromise) => {
    execFile(
      "/bin/bash",
      ["-c", command],
      {
        cwd,
        timeout: COMMAND_TIMEOUT_MS,
        maxBuffer: MAX_OUTPUT_CHARS * 2,
        env: {
          ...process.env,
          HOME: "/root",
          TERM: "xterm-256color",
          PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
        },
      },
      (error, stdout, stderr) => {
        const combined = truncate(
          redactSensitiveOutput(`${stdout ?? ""}${stderr ? `\n[stderr]\n${stderr}` : ""}`)
        );
        if (error) {
          resolvePromise({
            success: false,
            error: error.killed ? `Command timed out after ${COMMAND_TIMEOUT_MS / 1000}s` : `Exit code ${error.code ?? 1}`,
            output: combined || error.message,
          });
          return;
        }
        resolvePromise({
          success: true,
          output: combined || "(no output)",
        });
      }
    );
  });
}

async function executeReadFile(path: string): Promise<Record<string, unknown>> {
  const resolved = resolvePath(path);
  const info = await stat(resolved);
  if (!info.isFile()) {
    return { success: false, error: `Not a file: ${path}` };
  }
  if (info.size > MAX_FILE_SIZE) {
    return { success: false, error: `File too large: ${info.size} bytes` };
  }
  const content = await readFile(resolved, "utf-8");
  return { success: true, output: truncate(redactSensitiveOutput(content)) };
}

async function executeWriteFile(path: string, content: string): Promise<Record<string, unknown>> {
  const resolved = resolvePath(path);
  await mkdir(dirname(resolved), { recursive: true });
  await writeFile(resolved, content, "utf-8");
  return { success: true, output: `Wrote ${content.length} bytes to ${resolved}` };
}

async function executeListDir(path?: string): Promise<Record<string, unknown>> {
  const resolved = path ? resolvePath(path) : WORKSPACE_ROOT;
  const info = await stat(resolved);
  if (!info.isDirectory()) {
    return { success: false, error: `Not a directory: ${path ?? WORKSPACE_ROOT}` };
  }

  const entries = await readdir(resolved, { withFileTypes: true });
  const sliced = entries.slice(0, MAX_DIR_ENTRIES);
  const detailed = await Promise.all(
    sliced.map(async (entry) => {
      const entryPath = resolve(resolved, entry.name);
      const entryStat = await stat(entryPath).catch(() => null);
      return {
        name: entry.name,
        type: entry.isDirectory() ? "directory" : entry.isFile() ? "file" : "other",
        size: entryStat?.isFile() ? entryStat.size : undefined,
      };
    })
  );

  return {
    success: true,
    output: {
      path: resolved,
      totalEntries: entries.length,
      truncated: entries.length > MAX_DIR_ENTRIES,
      entries: detailed,
    },
  };
}

function allowedDomains(): string[] {
  return (process.env.MCP_FETCH_ALLOWLIST ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function isAllowedUrl(raw: string): boolean {
  let parsed: URL;

  try {
    parsed = new URL(raw);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:") {
    return false;
  }

  const host = parsed.hostname.toLowerCase();
  if (["localhost", "127.0.0.1", "::1"].includes(host)) {
    return false;
  }

  const allowlist = allowedDomains();
  if (allowlist.length === 0) {
    return false;
  }

  return allowlist.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

export function listMcpTools(): McpToolDefinition[] {
  return TOOL_DEFINITIONS;
}

export async function invokeMcpTool(
  name: string,
  args: Record<string, unknown> | undefined,
  context: McpContext
): Promise<Record<string, unknown>> {
  switch (name) {
    case "shell_command": {
      const command = typeof args?.command === "string" ? args.command : "";
      const workingDir = typeof args?.working_dir === "string" ? args.working_dir : undefined;
      if (!command) {
        return { success: false, error: "command is required" };
      }
      return executeShellCommand(command, workingDir);
    }

    case "read_file": {
      const path = typeof args?.path === "string" ? args.path : "";
      if (!path) {
        return { success: false, error: "path is required" };
      }
      return executeReadFile(path).catch((error: unknown) => ({
        success: false,
        error: error instanceof Error ? error.message : "read_file failed",
      }));
    }

    case "write_file": {
      const path = typeof args?.path === "string" ? args.path : "";
      const content = typeof args?.content === "string" ? args.content : "";
      if (!path) {
        return { success: false, error: "path is required" };
      }
      return executeWriteFile(path, content).catch((error: unknown) => ({
        success: false,
        error: error instanceof Error ? error.message : "write_file failed",
      }));
    }

    case "list_dir": {
      const path = typeof args?.path === "string" ? args.path : undefined;
      return executeListDir(path).catch((error: unknown) => ({
        success: false,
        error: error instanceof Error ? error.message : "list_dir failed",
      }));
    }

    case "get_time": {
      const now = new Date();
      return {
        iso: now.toISOString(),
        utc: now.toUTCString(),
        epochMs: now.getTime(),
      };
    }

    case "get_agent_status": {
      const requested = typeof args?.agentId === "string" ? args.agentId : context.agentId;
      const agent = await prisma.agent.findFirst({
        where: {
          id: requested,
          userId: context.userId,
        },
        select: {
          id: true,
          name: true,
          platform: true,
          status: true,
          ecsClusterArn: true,
          ecsServiceArn: true,
          ecsTaskArn: true,
          updatedAt: true,
          lastError: true,
        },
      });

      if (!agent) {
        return { error: "Agent not found" };
      }

      return {
        agent,
      };
    }

    case "recent_usage": {
      const maybeLimit = typeof args?.limit === "number" ? Math.floor(args.limit) : 5;
      const limit = Math.max(1, Math.min(20, maybeLimit));

      const events = await prisma.agentUsageEvent.findMany({
        where: {
          agentId: context.agentId,
          userId: context.userId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        select: {
          model: true,
          inputTokens: true,
          outputTokens: true,
          totalTokens: true,
          latencyMs: true,
          createdAt: true,
        },
      });

      return {
        count: events.length,
        events,
      };
    }

    case "runtime_info": {
      return {
        cwd: process.cwd(),
        nodeVersion: process.version,
        platform: process.platform,
        appUrl: process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://factory.tmrwgroup.ai",
        env: process.env.APP_ENV ?? process.env.NODE_ENV ?? "unknown",
        timestamp: new Date().toISOString(),
      };
    }

    case "web_fetch": {
      const url = typeof args?.url === "string" ? args.url : "";

      if (!url || !isAllowedUrl(url)) {
        return {
          error:
            "URL is not allowed. Set MCP_FETCH_ALLOWLIST (comma separated domains) and use HTTPS public hosts.",
        };
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "user-agent": "tmrw-mcp-fetch/1.0",
        },
      });

      const bodyText = await response.text();
      const preview = bodyText.slice(0, 2500);

      return {
        status: response.status,
        contentType: response.headers.get("content-type"),
        bodyPreview: preview,
      };
    }

    case "list_skills": {
      const includeInactive = args?.includeInactive === true;
      const maybeLimit = typeof args?.limit === "number" ? Math.floor(args.limit) : 8;
      const limit = Math.max(1, Math.min(20, maybeLimit));
      const requestedProjectId = typeof args?.projectId === "string" ? args.projectId : null;
      const agent = await prisma.agent.findFirst({
        where: { id: context.agentId, userId: context.userId },
        select: { projectId: true },
      });
      const projectId = requestedProjectId ?? agent?.projectId ?? null;

      const skills = await prisma.skill.findMany({
        where: projectId
          ? {
              userId: context.userId,
              ...(includeInactive ? {} : { isActive: true }),
              OR: [{ scope: "GLOBAL" }, { projectId }],
            }
          : {
              userId: context.userId,
              ...(includeInactive ? {} : { isActive: true }),
              scope: "GLOBAL",
            },
        orderBy: [{ updatedAt: "desc" }],
        take: limit,
        select: {
          id: true,
          name: true,
          scope: true,
          projectId: true,
          isActive: true,
          updatedAt: true,
        },
      });
      return {
        count: skills.length,
        projectId,
        skills,
      };
    }

    case "search_memory": {
      const query = typeof args?.query === "string" ? args.query.trim() : "";
      const kind =
        typeof args?.kind === "string" &&
        ["NOTE", "FACT", "DECISION", "SUMMARY", "KNOWLEDGE"].includes(args.kind)
          ? (args.kind as "NOTE" | "FACT" | "DECISION" | "SUMMARY" | "KNOWLEDGE")
          : undefined;
      const maybeLimit = typeof args?.limit === "number" ? Math.floor(args.limit) : 10;
      const limit = Math.max(1, Math.min(30, maybeLimit));

      const rows = await prisma.memoryEntry.findMany({
        where: {
          userId: context.userId,
          ...(kind ? { kind } : {}),
          ...(query
            ? {
                OR: [
                  { title: { contains: query, mode: "insensitive" } },
                  { content: { contains: query, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: [{ updatedAt: "desc" }],
        take: limit,
        select: {
          id: true,
          kind: true,
          title: true,
          content: true,
          agentId: true,
          projectId: true,
          updatedAt: true,
        },
      });

      return {
        count: rows.length,
        entries: rows.map((row) => ({
          ...row,
          contentPreview: truncate(row.content, 400),
        })),
      };
    }

    case "write_memory": {
      const content = typeof args?.content === "string" ? args.content.trim() : "";
      if (!content) {
        return { success: false, error: "content is required" };
      }
      const title = typeof args?.title === "string" ? args.title.trim() : null;
      const kind =
        typeof args?.kind === "string" &&
        ["NOTE", "FACT", "DECISION", "SUMMARY", "KNOWLEDGE"].includes(args.kind)
          ? (args.kind as "NOTE" | "FACT" | "DECISION" | "SUMMARY" | "KNOWLEDGE")
          : "NOTE";
      const requestedProjectId = typeof args?.projectId === "string" ? args.projectId : null;
      const agent = await prisma.agent.findFirst({
        where: { id: context.agentId, userId: context.userId },
        select: { projectId: true },
      });

      const created = await prisma.memoryEntry.create({
        data: {
          userId: context.userId,
          agentId: context.agentId,
          projectId: requestedProjectId ?? agent?.projectId ?? null,
          kind,
          title,
          content: truncate(content, 10_000),
          metadata: {
            source: "mcp.write_memory",
            createdAt: new Date().toISOString(),
          },
        },
        select: {
          id: true,
          kind: true,
          title: true,
          projectId: true,
          agentId: true,
          createdAt: true,
        },
      });

      return {
        success: true,
        entry: created,
      };
    }

    case "list_scheduled_tasks": {
      const maybeLimit = typeof args?.limit === "number" ? Math.floor(args.limit) : 10;
      const limit = Math.max(1, Math.min(30, maybeLimit));
      const status =
        typeof args?.status === "string" &&
        ["ACTIVE", "PAUSED", "FAILED"].includes(args.status)
          ? (args.status as "ACTIVE" | "PAUSED" | "FAILED")
          : undefined;

      const tasks = await prisma.scheduledTask.findMany({
        where: {
          userId: context.userId,
          ...(status ? { status } : {}),
        },
        orderBy: [{ createdAt: "desc" }],
        take: limit,
        select: {
          id: true,
          title: true,
          status: true,
          enabled: true,
          cronExpr: true,
          timezone: true,
          nextRunAt: true,
          agentId: true,
          projectId: true,
        },
      });

      return {
        count: tasks.length,
        tasks,
      };
    }

    // ═══ MARKETO TOOLS ═══
    // Strategy: Try REST API first (if credentials configured) for instant server-side data.
    // Fall back to browser execution via Webster extension if no REST credentials.
    // Browser-executed tool results arrive via the feedback loop in the next user message.

    case "list_programs":
    case "list_smart_campaigns":
    case "list_emails":
    case "list_forms":
    case "list_folders":
    case "list_landing_pages":
    case "list_smart_lists":
    case "get_instance_info":
    case "get_program":
    case "get_leads":
    case "list_email_templates":
    case "list_lp_templates":
    case "list_channels":
    case "list_workspaces":
    case "list_uploaded_files": {
      // Try REST API if credentials are configured
      if (MARKETO_REST_TOOLS.has(name)) {
        const creds = await getMarketoCredentials(context.agentId);
        if (creds) {
          try {
            console.log(`[mcp] Executing ${name} via Marketo REST API`);
            const result = await executeMarketoRestTool(creds, name, (args ?? {}) as Record<string, unknown>);
            return result as Record<string, unknown>; // Real data returned directly
          } catch (err: any) {
            console.warn(`[mcp] REST API fallback failed for ${name}: ${err.message}`);
            // Fall through to browser execution
          }
        }
      }
      // No REST credentials or REST failed — dispatch to browser extension
      return {
        browserExecution: true,
        tool: name,
        status: "dispatched",
        note: "Real data will arrive in the next message. Say one short sentence and STOP. Do NOT make up data.",
      };
    }

    // ═══ CREDENTIAL MANAGEMENT ═══
    case "check_marketo_credentials": {
      const creds = await getMarketoCredentials(context.agentId);
      if (creds) {
        return {
          configured: true,
          instanceUrl: creds.instanceUrl,
          clientId: `${creds.clientId.slice(0, 8)}...`,
          message: `Marketo credentials are configured for ${creds.instanceUrl}. REST API is ready.`,
        };
      }
      return {
        configured: false,
        message: "No Marketo REST API credentials configured. Ask the user for their Instance URL, Client ID, and Client Secret.",
      };
    }

    case "store_marketo_credentials": {
      const { instanceUrl, clientId, clientSecret } = (args ?? {}) as Record<string, string>;
      if (!instanceUrl || !clientId || !clientSecret) {
        return { success: false, error: "Required: instanceUrl, clientId, clientSecret" };
      }

      // Normalize URL
      let normalizedUrl = instanceUrl.trim();
      if (!normalizedUrl.startsWith("http")) normalizedUrl = `https://${normalizedUrl}`;
      normalizedUrl = normalizedUrl.replace(/\/+$/, "");

      const testCreds: MarketoCredentials = {
        instanceUrl: normalizedUrl,
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
      };

      // Test connection first
      const { testConnection } = await import("@/lib/marketo-api");
      const testResult = await testConnection(testCreds);
      if (!testResult.success) {
        return {
          success: false,
          error: `Connection failed: ${testResult.message}. Please check your credentials and try again.`,
        };
      }

      // Store credentials
      try {
        const agent = await prisma.agent.findUnique({
          where: { id: context.agentId },
          select: { inputConfig: true },
        });
        const existingConfig = (agent?.inputConfig as Record<string, unknown>) ?? {};
        await prisma.agent.update({
          where: { id: context.agentId },
          data: {
            inputConfig: {
              ...existingConfig,
              marketo: {
                instanceUrl: normalizedUrl,
                clientId: clientId.trim(),
                clientSecret: clientSecret.trim(),
                configuredAt: new Date().toISOString(),
              },
            },
          },
        });

        return {
          success: true,
          message: `Connected to Marketo (${normalizedUrl}). Credentials saved. You can now use all Marketo tools with real-time data from the REST API.`,
          instanceUrl: normalizedUrl,
        };
      } catch (err: any) {
        return { success: false, error: `Failed to save credentials: ${err.message}` };
      }
    }

    // READ tools (with parameters, browser-only)
    case "list_tokens": {
      const programId = args?.programId;
      if (!programId) {
        return { success: false, error: "programId is required" };
      }
      return { browserExecution: true, tool: name, status: "dispatched", note: `Fetching tokens for program ${programId}. Real data arriving shortly.` };
    }

    // PROGRAM MANAGEMENT
    case "create_program": {
      const { name: progName, folderId, channelId, description } = (args ?? {}) as Record<string, unknown>;
      if (!progName || !folderId || !channelId) return { success: false, error: "Required: name, folderId, channelId" };
      return { browserExecution: true, tool: name, status: "executed", result: `Creating program "${progName}". Action dispatched to browser.` };
    }
    case "clone_program": {
      const { programId, newName } = (args ?? {}) as Record<string, unknown>;
      if (!programId || !newName) return { success: false, error: "Required: programId, newName" };
      return { browserExecution: true, tool: name, status: "executed", result: `Cloning program ${programId} as "${newName}". Action dispatched.` };
    }
    case "delete_program": {
      const programId = args?.programId;
      if (!programId) return { success: false, error: "programId is required" };
      return { browserExecution: true, tool: name, status: "executed", result: `Deleting program ${programId}. Action dispatched.` };
    }

    // SMART CAMPAIGN MANAGEMENT
    case "create_smart_campaign": {
      const { name: campName, folderId } = (args ?? {}) as Record<string, unknown>;
      if (!campName || !folderId) return { success: false, error: "Required: name, folderId" };
      return { browserExecution: true, tool: name, status: "executed", result: `Creating smart campaign "${campName}". Action dispatched.` };
    }
    case "clone_smart_campaign": {
      const { campaignId, newName } = (args ?? {}) as Record<string, unknown>;
      if (!campaignId || !newName) return { success: false, error: "Required: campaignId, newName" };
      return { browserExecution: true, tool: name, status: "executed", result: `Cloning smart campaign ${campaignId} as "${newName}". Action dispatched.` };
    }
    case "activate_smart_campaign":
    case "deactivate_smart_campaign": {
      const campaignId = args?.campaignId;
      if (!campaignId) return { success: false, error: "campaignId is required" };
      return { browserExecution: true, tool: name, status: "executed", result: `${name === "activate_smart_campaign" ? "Activating" : "Deactivating"} campaign ${campaignId}. Action dispatched.` };
    }

    // EMAIL MANAGEMENT
    case "create_email": {
      const { name: emailName, templateId, folderId } = (args ?? {}) as Record<string, unknown>;
      if (!emailName || !templateId || !folderId) return { success: false, error: "Required: name, templateId, folderId" };
      return { browserExecution: true, tool: name, status: "executed", result: `Creating email "${emailName}". Action dispatched.` };
    }
    case "clone_email": {
      const { emailId, newName } = (args ?? {}) as Record<string, unknown>;
      if (!emailId || !newName) return { success: false, error: "Required: emailId, newName" };
      return { browserExecution: true, tool: name, status: "executed", result: `Cloning email ${emailId} as "${newName}". Action dispatched.` };
    }
    case "approve_email": {
      const emailId = args?.emailId;
      if (!emailId) return { success: false, error: "emailId is required" };
      return { browserExecution: true, tool: name, status: "executed", result: `Approving email ${emailId}. Action dispatched.` };
    }
    case "send_test_email": {
      const { emailId, toAddress } = (args ?? {}) as Record<string, unknown>;
      if (!emailId || !toAddress) return { success: false, error: "Required: emailId, toAddress" };
      return { browserExecution: true, tool: name, status: "executed", result: `Sending test email ${emailId} to ${toAddress}. Action dispatched.` };
    }

    // LANDING PAGE MANAGEMENT
    case "create_landing_page": {
      const { name: lpName, templateId, folderId } = (args ?? {}) as Record<string, unknown>;
      if (!lpName || !templateId || !folderId) return { success: false, error: "Required: name, templateId, folderId" };
      return { browserExecution: true, tool: name, status: "executed", result: `Creating landing page "${lpName}". Action dispatched.` };
    }
    case "clone_landing_page": {
      const { landingPageId, newName } = (args ?? {}) as Record<string, unknown>;
      if (!landingPageId || !newName) return { success: false, error: "Required: landingPageId, newName" };
      return { browserExecution: true, tool: name, status: "executed", result: `Cloning landing page ${landingPageId} as "${newName}". Action dispatched.` };
    }
    case "approve_landing_page": {
      const landingPageId = args?.landingPageId;
      if (!landingPageId) return { success: false, error: "landingPageId is required" };
      return { browserExecution: true, tool: name, status: "executed", result: `Approving landing page ${landingPageId}. Action dispatched.` };
    }

    // FORM MANAGEMENT
    case "clone_form": {
      const { formId, newName } = (args ?? {}) as Record<string, unknown>;
      if (!formId || !newName) return { success: false, error: "Required: formId, newName" };
      return { browserExecution: true, tool: name, status: "executed", result: `Cloning form ${formId} as "${newName}". Action dispatched.` };
    }
    case "approve_form": {
      const formId = args?.formId;
      if (!formId) return { success: false, error: "formId is required" };
      return { browserExecution: true, tool: name, status: "executed", result: `Approving form ${formId}. Action dispatched.` };
    }

    // FOLDER MANAGEMENT
    case "create_folder": {
      const { name: folderName, parentFolderId } = (args ?? {}) as Record<string, unknown>;
      if (!folderName || !parentFolderId) return { success: false, error: "Required: name, parentFolderId" };
      return { browserExecution: true, tool: name, status: "executed", result: `Creating folder "${folderName}". Action dispatched.` };
    }
    case "rename_folder": {
      const { folderId, newName } = (args ?? {}) as Record<string, unknown>;
      if (!folderId || !newName) return { success: false, error: "Required: folderId, newName" };
      return { browserExecution: true, tool: name, status: "executed", result: `Renaming folder ${folderId} to "${newName}". Action dispatched.` };
    }
    case "move_asset": {
      const { assetId, destinationFolderId } = (args ?? {}) as Record<string, unknown>;
      if (!assetId || !destinationFolderId) return { success: false, error: "Required: assetId, destinationFolderId" };
      return { browserExecution: true, tool: name, status: "executed", result: `Moving asset ${assetId} to folder ${destinationFolderId}. Action dispatched.` };
    }

    // TOKEN MANAGEMENT
    case "create_token": {
      const { programId, tokenName, tokenValue } = (args ?? {}) as Record<string, unknown>;
      if (!programId || !tokenName || tokenValue === undefined) return { success: false, error: "Required: programId, tokenName, tokenValue" };
      return { browserExecution: true, tool: name, status: "executed", result: `Creating token "{{my.${tokenName}}}". Action dispatched.` };
    }
    case "delete_token": {
      const { programId, tokenName } = (args ?? {}) as Record<string, unknown>;
      if (!programId || !tokenName) return { success: false, error: "Required: programId, tokenName" };
      return { browserExecution: true, tool: name, status: "executed", result: `Deleting token "{{my.${tokenName}}}". Action dispatched.` };
    }

    // ═══ HUBSPOT TOOLS ═══
    // All HubSpot tools execute in user's browser via Webster extension

    // Instance info
    case "get_hubspot_instance_info":
      return {
        browserExecution: true,
        tool: name,
        message: "Getting HubSpot instance info via Webster extension.",
        params: args ?? {},
      };

    // Contacts
    case "list_contacts":
    case "search_contacts":
    case "get_contact":
    case "create_contact":
    case "update_contact":
      return {
        browserExecution: true,
        tool: name,
        message: `Executing ${name} via Webster extension.`,
        params: args ?? {},
      };

    // Companies
    case "list_companies":
    case "get_company":
    case "create_company":
      return {
        browserExecution: true,
        tool: name,
        message: `Executing ${name} via Webster extension.`,
        params: args ?? {},
      };

    // Deals
    case "list_deals":
    case "get_deal":
    case "create_deal":
    case "update_deal":
    case "list_pipelines":
      return {
        browserExecution: true,
        tool: name,
        message: `Executing ${name} via Webster extension.`,
        params: args ?? {},
      };

    // Emails
    case "list_hubspot_emails":
    case "get_hubspot_email":
    case "clone_hubspot_email":
      return {
        browserExecution: true,
        tool: name,
        message: `Executing ${name} via Webster extension.`,
        params: args ?? {},
      };

    // Forms
    case "list_hubspot_forms":
    case "get_hubspot_form":
    case "clone_hubspot_form":
      return {
        browserExecution: true,
        tool: name,
        message: `Executing ${name} via Webster extension.`,
        params: args ?? {},
      };

    // Lists
    case "list_hubspot_lists":
    case "get_hubspot_list":
    case "create_hubspot_list":
    case "add_contacts_to_list":
      return {
        browserExecution: true,
        tool: name,
        message: `Executing ${name} via Webster extension.`,
        params: args ?? {},
      };

    // Workflows
    case "list_workflows":
    case "get_workflow":
    case "enable_workflow":
    case "disable_workflow":
    case "enroll_contact_in_workflow":
      return {
        browserExecution: true,
        tool: name,
        message: `Executing ${name} via Webster extension.`,
        params: args ?? {},
      };

    // Landing pages
    case "list_landing_pages":
    case "clone_landing_page":
      return {
        browserExecution: true,
        tool: name,
        message: `Executing ${name} via Webster extension.`,
        params: args ?? {},
      };

    // ═══ SEGMENT TOOLS ═══
    // All Segment tools execute in user's browser via Webster extension

    case "get_segment_workspace_info":
    case "list_segment_sources":
    case "get_segment_source":
    case "create_segment_source":
    case "enable_segment_source":
    case "disable_segment_source":
    case "list_segment_destinations":
    case "get_segment_destination":
    case "enable_segment_destination":
    case "disable_segment_destination":
    case "list_tracking_plans":
    case "get_tracking_plan":
    case "list_tracking_plan_events":
    case "get_recent_events":
    case "list_source_catalog":
    case "list_destination_catalog":
      return {
        browserExecution: true,
        tool: name,
        message: `Executing ${name} via Webster extension.`,
        params: args ?? {},
      };

    // ═══ SALESFORCE TOOLS ═══
    // All Salesforce tools execute in user's browser via Webster extension

    case "get_salesforce_instance_info":
    case "list_sf_accounts":
    case "get_sf_account":
    case "create_sf_account":
    case "update_sf_account":
    case "list_sf_contacts":
    case "get_sf_contact":
    case "create_sf_contact":
    case "update_sf_contact":
    case "list_sf_leads":
    case "get_sf_lead":
    case "create_sf_lead":
    case "update_sf_lead":
    case "convert_sf_lead":
    case "list_sf_opportunities":
    case "get_sf_opportunity":
    case "create_sf_opportunity":
    case "update_sf_opportunity":
    case "list_sf_campaigns":
    case "get_sf_campaign":
    case "list_sf_flows":
    case "get_sf_flow":
    case "list_sf_reports":
    case "run_sf_report":
    case "run_sf_query":
    case "describe_sf_object":
    case "list_sf_objects":
      return {
        browserExecution: true,
        tool: name,
        message: `Executing ${name} via Webster extension.`,
        params: args ?? {},
      };

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
