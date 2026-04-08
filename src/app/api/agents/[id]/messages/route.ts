import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

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
      userId: session.user.id,
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
      userId: session.user.id,
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
