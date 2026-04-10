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

  const agent = await prisma.agent.findFirst({
    where: {
      id: agentId,
      userId,
    },
    select: { id: true },
  });

  if (!agent) {
    return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
  }

  const sessions = await prisma.agentChatSession.findMany({
    where: {
      agentId,
      userId,
    },
    orderBy: {
      lastMessageAt: "desc",
    },
    include: {
      _count: {
        select: {
          messages: {
            where: {
              role: {
                in: ["USER", "ASSISTANT"],
              },
            },
          },
        },
      },
    },
    take: 100,
  });

  return NextResponse.json({
    success: true,
    data: sessions.map((item) => ({
      id: item.id,
      title: item.title,
      lastMessageAt: item.lastMessageAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      messageCount: item._count.messages,
    })),
  });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const authContext = await authenticateRequest(request);
  if (!authContext?.userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const userId = authContext.userId;

  const { id: agentId } = await context.params;
  const payload = await request.json().catch(() => ({} as Record<string, unknown>));
  const rawTitle = typeof payload.title === "string" ? payload.title.trim() : "";
  const title = rawTitle.slice(0, 80) || "New chat";

  const agent = await prisma.agent.findFirst({
    where: {
      id: agentId,
      userId,
    },
    select: { id: true },
  });

  if (!agent) {
    return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
  }

  const chatSession = await prisma.agentChatSession.create({
    data: {
      agentId,
      userId,
      title,
      lastMessageAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, data: chatSession }, { status: 201 });
}
