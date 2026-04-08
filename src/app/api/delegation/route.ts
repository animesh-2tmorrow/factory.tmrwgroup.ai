import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { delegationSchema } from "@/lib/agent-zero-validation";

async function ensureUserAgent(userId: string, agentId: string) {
  return prisma.agent.findFirst({
    where: { id: agentId, userId },
    select: { id: true, parentAgentId: true, name: true },
  });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const relationships = await prisma.agent.findMany({
    where: {
      userId: session.user.id,
      parentAgentId: { not: null },
    },
    select: {
      id: true,
      name: true,
      parentAgentId: true,
      parentAgent: {
        select: { id: true, name: true },
      },
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: relationships });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = delegationSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  const { parentAgentId, childAgentId } = parsed.data;
  if (parentAgentId === childAgentId) {
    return NextResponse.json({ success: false, error: "Parent and child agent must be different" }, { status: 400 });
  }

  const [parent, child] = await Promise.all([
    ensureUserAgent(session.user.id, parentAgentId),
    ensureUserAgent(session.user.id, childAgentId),
  ]);
  if (!parent || !child) {
    return NextResponse.json({ success: false, error: "One or more agents not found" }, { status: 404 });
  }
  if (parent.parentAgentId === childAgentId) {
    return NextResponse.json({ success: false, error: "Circular delegation is not allowed" }, { status: 400 });
  }

  const updated = await prisma.agent.update({
    where: { id: childAgentId },
    data: { parentAgentId },
    select: {
      id: true,
      name: true,
      parentAgentId: true,
      parentAgent: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({} as Record<string, unknown>));
  const childAgentId = typeof payload.childAgentId === "string" ? payload.childAgentId : "";
  if (!childAgentId) {
    return NextResponse.json({ success: false, error: "childAgentId is required" }, { status: 400 });
  }

  const child = await ensureUserAgent(session.user.id, childAgentId);
  if (!child) {
    return NextResponse.json({ success: false, error: "Child agent not found" }, { status: 404 });
  }

  const updated = await prisma.agent.update({
    where: { id: childAgentId },
    data: { parentAgentId: null },
    select: { id: true, name: true, parentAgentId: true },
  });

  return NextResponse.json({ success: true, data: updated });
}
