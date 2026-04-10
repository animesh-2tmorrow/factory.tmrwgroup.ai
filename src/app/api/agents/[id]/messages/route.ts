import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { authenticateRequest } from "@/lib/request-auth";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const authContext = await authenticateRequest(request);
  if (!authContext?.userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const userId = authContext.userId;

  const { id: agentId } = await context.params;
  const searchParams = new URL(request.url).searchParams;
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ success: false, error: "sessionId is required" }, { status: 400 });
  }

  const sessionExists = await prisma.agentChatSession.findFirst({
    where: {
      id: sessionId,
      agentId,
      userId,
    },
    select: { id: true },
  });

  if (!sessionExists) {
    return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
  }

  const messages = await prisma.agentChatMessage.findMany({
    where: {
      sessionId,
      agentId,
      userId,
      role: {
        in: ["USER", "ASSISTANT"],
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    take: 500,
  });

  return NextResponse.json({ success: true, data: messages });
}
