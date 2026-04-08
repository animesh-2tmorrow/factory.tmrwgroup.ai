import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { invokeMcpTool, listMcpTools } from "@/lib/mcp-tools";

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

function unauthorized(id: JsonRpcRequest["id"]) {
  return NextResponse.json({
    jsonrpc: "2.0",
    id: id ?? null,
    error: { code: -32001, message: "Unauthorized" },
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as JsonRpcRequest | null;

  if (!body || body.jsonrpc !== "2.0" || !body.method) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: body?.id ?? null,
        error: { code: -32600, message: "Invalid JSON-RPC request" },
      },
      { status: 400 }
    );
  }

  const apiKey = request.headers.get("x-mcp-key");
  const expectedKey = process.env.MCP_SHARED_KEY;

  const session = await auth();
  const sessionUserId = session?.user?.id ?? null;

  const keyAuthorized = expectedKey ? apiKey === expectedKey : false;

  if (!sessionUserId && !keyAuthorized) {
    return unauthorized(body.id);
  }

  if (body.method === "tools/list") {
    return NextResponse.json({
      jsonrpc: "2.0",
      id: body.id ?? null,
      result: {
        tools: listMcpTools(),
      },
    });
  }

  if (body.method === "tools/call") {
    const toolName = typeof body.params?.name === "string" ? body.params.name : "";
    const args =
      body.params && typeof body.params.arguments === "object" && body.params.arguments !== null
        ? (body.params.arguments as Record<string, unknown>)
        : {};

    const context =
      body.params && typeof body.params.context === "object" && body.params.context !== null
        ? (body.params.context as Record<string, unknown>)
        : {};

    const userIdFromContext = typeof context.userId === "string" ? context.userId : null;
    const agentIdFromContext = typeof context.agentId === "string" ? context.agentId : null;

    if (!toolName || !agentIdFromContext) {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id: body.id ?? null,
          error: { code: -32602, message: "name and context.agentId are required" },
        },
        { status: 400 }
      );
    }

    if (!sessionUserId && !keyAuthorized) {
      return unauthorized(body.id);
    }

    const agent = await prisma.agent.findFirst({
      where: { id: agentIdFromContext },
      select: { id: true, userId: true },
    });
    if (!agent) {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id: body.id ?? null,
          error: { code: -32602, message: "Unknown agent context" },
        },
        { status: 400 }
      );
    }

    // Harden MCP key-auth path: never trust userId passed by client context.
    // For session-auth, require the current user to own the agent.
    if (sessionUserId && agent.userId !== sessionUserId) {
      return unauthorized(body.id);
    }

    if (!sessionUserId && userIdFromContext && userIdFromContext !== agent.userId) {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id: body.id ?? null,
          error: { code: -32602, message: "Context user mismatch for agent" },
        },
        { status: 400 }
      );
    }

    const effectiveUserId = sessionUserId ?? agent.userId;

    try {
      const result = await invokeMcpTool(toolName, args, {
        agentId: agentIdFromContext,
        userId: effectiveUserId,
      });

      return NextResponse.json({
        jsonrpc: "2.0",
        id: body.id ?? null,
        result,
      });
    } catch (error) {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id: body.id ?? null,
          error: {
            code: -32000,
            message: error instanceof Error ? error.message : "Tool call failed",
          },
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    {
      jsonrpc: "2.0",
      id: body.id ?? null,
      error: { code: -32601, message: `Method not found: ${body.method}` },
    },
    { status: 404 }
  );
}
