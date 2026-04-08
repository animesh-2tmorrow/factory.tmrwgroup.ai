import express from "express";
import { mkdir } from "node:fs/promises";
import { bootstrapWorkspace, type BootstrapSummary } from "./bootstrap.js";
import { runChatTurn, type ChatTurnInput } from "./chat-loop.js";
import { WORKSPACE_TOOL_SPECS } from "./workspace-tools.js";

const PORT = parseInt(process.env.RUNNER_PORT ?? "8787", 10);
const SHARED_KEY = process.env.RUNNER_SHARED_KEY ?? process.env.MCP_SHARED_KEY ?? "";
const WORKSPACE_ROOT = process.env.AGENT_WORKSPACE_ROOT ?? "/workspace";

const app = express();
app.use(express.json({ limit: "1mb" }));

let bootstrapStatus: BootstrapSummary = {
  enabled: false,
  state: "disabled",
  profile: process.env.AGENT_RUNTIME_PROFILE ?? "GENERAL",
  projectDir: WORKSPACE_ROOT,
  steps: [],
  startedAt: new Date().toISOString(),
};

function authenticate(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  if (!SHARED_KEY) {
    next();
    return;
  }

  const provided =
    (req.headers["x-runner-key"] as string | undefined) ??
    req.headers["authorization"]?.replace(/^Bearer\s+/i, "");

  if (provided !== SHARED_KEY) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    agentId: process.env.AGENT_ID ?? "unknown",
    agentName: process.env.AGENT_NAME ?? "unknown",
    platform: process.env.AGENT_PLATFORM ?? "CLOUD",
    runtimeProfile: process.env.AGENT_RUNTIME_PROFILE ?? "GENERAL",
    workspace: WORKSPACE_ROOT,
    projectDir: process.env.AGENT_PROJECT_DIR ?? WORKSPACE_ROOT,
    bootstrap: bootstrapStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/tools", authenticate, (_req, res) => {
  res.json({
    tools: WORKSPACE_TOOL_SPECS.map((tool) => ({
      name: tool.toolSpec.name,
      description: tool.toolSpec.description,
    })),
  });
});

app.post("/chat", authenticate, async (req, res) => {
  const { message, history, instructions } = req.body as Partial<ChatTurnInput>;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  const input: ChatTurnInput = {
    message: message.trim(),
    history: Array.isArray(history) ? history : [],
    instructions: typeof instructions === "string" ? instructions : undefined,
  };

  try {
    const result = await runChatTurn(input);

    console.log(
      `[runner] Chat turn complete: model=${result.model} ` +
        `tokens=${result.usage.totalTokens} tools=${result.toolCalls.length} ` +
        `latency=${result.usage.latencyMs}ms`
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Chat turn failed";
    console.error("[runner] Chat turn failed:", message);
    res.status(500).json({ success: false, error: message });
  }
});

async function start() {
  await mkdir(WORKSPACE_ROOT, { recursive: true });
  console.log(`[runner] Workspace root: ${WORKSPACE_ROOT}`);

  bootstrapStatus = await bootstrapWorkspace(WORKSPACE_ROOT);
  console.log(
    `[runner] Bootstrap state=${bootstrapStatus.state} profile=${bootstrapStatus.profile} project=${bootstrapStatus.projectDir}`
  );
  if (bootstrapStatus.error) {
    console.error(`[runner] Bootstrap error: ${bootstrapStatus.error}`);
  }

  console.log(
    `[runner] Agent: ${process.env.AGENT_ID ?? "unknown"} (${process.env.AGENT_NAME ?? "unnamed"})`
  );
  console.log(
    `[runner] Model: ${process.env.ANTHROPIC_MODEL ?? process.env.CLOUD_AGENT_MODEL ?? "default"}`
  );

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[runner] Listening on 0.0.0.0:${PORT}`);
  });
}

start().catch((error) => {
  console.error("[runner] Fatal startup error:", error);
  process.exit(1);
});
