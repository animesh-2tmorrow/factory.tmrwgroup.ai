import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/request-auth";
import { ensureWebsterAgentForUser } from "@/lib/webster-agent";

export async function GET(request: Request) {
  const authContext = await authenticateRequest(request);
  if (!authContext?.userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  if (authContext.source !== "bearer") {
    return NextResponse.json(
      { success: false, error: "Bearer token required for extension agent lookup" },
      { status: 401 }
    );
  }

  try {
    const agent = await ensureWebsterAgentForUser(authContext.userId);
    return NextResponse.json({
      agentId: agent.id,
      model:
        agent.modelName ??
        process.env.CLOUD_AGENT_MODEL ??
        process.env.ANTHROPIC_MODEL ??
        "global.anthropic.claude-haiku-4-5-20251001-v1:0",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to resolve Webster agent",
      },
      { status: 500 }
    );
  }
}
