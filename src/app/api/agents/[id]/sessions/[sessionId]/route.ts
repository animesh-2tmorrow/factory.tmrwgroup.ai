import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; sessionId: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id: agentId, sessionId } = await context.params;
  const payload = await request.json().catch(() => ({} as Record<string, unknown>));
  const title = typeof payload.title === "string" ? payload.title.trim().slice(0, 80) : "";

  if (!title) {
    return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
  }

  const existing = await prisma.agentChatSession.findFirst({
    where: {
      id: sessionId,
      agentId,
      userId: session.user.id,
    },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
  }

  const updated = await prisma.agentChatSession.update({
    where: { id: sessionId },
    data: { title },
  });

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(
  _: Request,
  context: { params: Promise<{ id: string; sessionId: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id: agentId, sessionId } = await context.params;

  const existing = await prisma.agentChatSession.findFirst({
    where: {
      id: sessionId,
      agentId,
      userId: session.user.id,
    },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.agentChatMessage.deleteMany({
      where: {
        sessionId,
        userId: session.user.id,
      },
    }),
    prisma.agentChatSession.delete({
      where: { id: sessionId },
    }),
  ]);

  return NextResponse.json({ success: true, data: { id: sessionId } });
}
