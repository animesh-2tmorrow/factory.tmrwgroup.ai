import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { isCronExpressionValid, scheduledTaskCreateSchema } from "@/lib/agent-zero-validation";
import { toPrismaJson } from "@/lib/prisma-json";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const tasks = await prisma.scheduledTask.findMany({
    where: {
      userId: session.user.id,
      ...(status && ["ACTIVE", "PAUSED", "FAILED"].includes(status) ? { status: status as "ACTIVE" | "PAUSED" | "FAILED" } : {}),
    },
    orderBy: [{ createdAt: "desc" }],
    include: {
      agent: { select: { id: true, name: true, status: true } },
      project: { select: { id: true, name: true, slug: true } },
    },
  });

  return NextResponse.json({ success: true, data: tasks });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = scheduledTaskCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  if (!isCronExpressionValid(parsed.data.cronExpr)) {
    return NextResponse.json({ success: false, error: "Invalid cron expression" }, { status: 400 });
  }

  if (parsed.data.projectId) {
    const project = await prisma.project.findFirst({
      where: { id: parsed.data.projectId, userId: session.user.id },
      select: { id: true },
    });
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }
  }

  if (parsed.data.agentId) {
    const agent = await prisma.agent.findFirst({
      where: { id: parsed.data.agentId, userId: session.user.id },
      select: { id: true },
    });
    if (!agent) {
      return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
    }
  }

  const created = await prisma.scheduledTask.create({
    data: {
      userId: session.user.id,
      projectId: parsed.data.projectId ?? null,
      agentId: parsed.data.agentId ?? null,
      title: parsed.data.title,
      instruction: parsed.data.instruction,
      cronExpr: parsed.data.cronExpr,
      timezone: parsed.data.timezone ?? "UTC",
      status: parsed.data.status ?? "ACTIVE",
      enabled: parsed.data.enabled ?? true,
      metadata: toPrismaJson(parsed.data.metadata ?? {}),
    },
    include: {
      agent: { select: { id: true, name: true, status: true } },
      project: { select: { id: true, name: true, slug: true } },
    },
  });

  return NextResponse.json({ success: true, data: created }, { status: 201 });
}
