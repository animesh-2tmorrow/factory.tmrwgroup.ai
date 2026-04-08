/**
 * Proxy chat turns to the per-agent runner service running in an ECS container.
 *
 * The runner exposes:
 *   POST /chat   — run a chat turn with workspace tools
 *   GET  /health — container health check
 *
 * Auth is via x-runner-key header using RUNNER_SHARED_KEY.
 */

// Keep runner timeout below edge proxy limits while still allowing longer tool-heavy turns.
const RUNNER_TIMEOUT_MS = 90_000;
const RUNNER_SHARED_KEY = process.env.RUNNER_SHARED_KEY ?? process.env.MCP_SHARED_KEY ?? "";

function looksLikeHtml(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  return (
    trimmed.startsWith("<!doctype") ||
    trimmed.startsWith("<html") ||
    trimmed.includes("<head>") ||
    trimmed.includes("<body>") ||
    trimmed.includes("</html>")
  );
}

function sanitizeRunnerError(status: number, raw: unknown): string {
  const message = typeof raw === "string" ? raw.trim() : "";

  if (message && looksLikeHtml(message)) {
    return `Runner upstream gateway error (${status})`;
  }

  if (message) {
    return message.slice(0, 500);
  }

  return `Runner returned ${status}`;
}

export interface RunnerChatInput {
  message: string;
  history: Array<{ role: string; content: string }>;
  instructions?: string;
}

export interface RunnerChatResult {
  answer: string;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    latencyMs: number;
  };
  toolCalls: Array<{
    name: string;
    input: unknown;
    result: unknown;
  }>;
}

/**
 * Proxy a chat turn to the runner service.
 * Throws if the runner is unreachable or returns an error.
 */
export async function proxyToRunner(
  runnerEndpoint: string,
  input: RunnerChatInput
): Promise<RunnerChatResult> {
  const chatUrl = runnerEndpoint.replace(/\/$/, "") + "/chat";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RUNNER_TIMEOUT_MS);

  try {
    const response = await fetch(chatUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(RUNNER_SHARED_KEY ? { "x-runner-key": RUNNER_SHARED_KEY } : {}),
      },
      body: JSON.stringify(input),
      signal: controller.signal,
    });

    const raw = await response.text().catch(() => "");
    let body: any = null;
    if (raw) {
      try {
        body = JSON.parse(raw);
      } catch {
        body = { error: sanitizeRunnerError(response.status, raw) };
      }
    }

    if (!response.ok) {
      const errMsg = sanitizeRunnerError(response.status, body?.error);
      throw new Error(errMsg);
    }

    if (!body?.success) {
      throw new Error(body?.error ?? "Runner returned unsuccessful response");
    }

    return {
      answer: body.answer ?? "",
      model: body.model ?? "unknown",
      usage: {
        inputTokens: body.usage?.inputTokens ?? 0,
        outputTokens: body.usage?.outputTokens ?? 0,
        totalTokens: body.usage?.totalTokens ?? 0,
        latencyMs: body.usage?.latencyMs ?? 0,
      },
      toolCalls: Array.isArray(body.toolCalls) ? body.toolCalls : [],
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`Runner timeout after ${RUNNER_TIMEOUT_MS / 1000}s`);
    }
    throw error instanceof Error ? error : new Error("Runner proxy failed");
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Check if a runner endpoint is healthy.
 */
export async function checkRunnerHealth(
  runnerEndpoint: string
): Promise<{ ok: boolean; agentId?: string; uptime?: number }> {
  const healthUrl = runnerEndpoint.replace(/\/$/, "") + "/health";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);

  try {
    const response = await fetch(healthUrl, {
      signal: controller.signal,
    });

    if (!response.ok) {
      return { ok: false };
    }

    const body = await response.json().catch(() => null);
    return {
      ok: body?.ok === true,
      agentId: body?.agentId,
      uptime: body?.uptime,
    };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(timeout);
  }
}
