import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { isCronExpressionValid, scheduledTaskUpdateSchema } from "@/lib/agent-zero-validation";
import { toPrismaJson } from "@/lib/prisma-json";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await prisma.scheduledTask.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ success: false, error: "Scheduled task not found" }, { status: 404 });
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = scheduledTaskUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  if (parsed.data.cronExpr && !isCronExpressionValid(parsed.data.cronExpr)) {
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

  const updated = await prisma.scheduledTask.update({
    where: { id },
    data: {
      title: parsed.data.title,
      instruction: parsed.data.instruction,
      cronExpr: parsed.data.cronExpr,
      timezone: parsed.data.timezone,
      status: parsed.data.status,
      enabled: parsed.data.enabled,
      projectId: parsed.data.projectId,
      agentId: parsed.data.agentId,
      metadata: parsed.data.metadata === undefined ? undefined : toPrismaJson(parsed.data.metadata),
      nextRunAt: parsed.data.nextRunAt,
      lastRunAt: parsed.data.lastRunAt,
      lastError: parsed.data.lastError === null ? null : parsed.data.lastError,
    },
    include: {
      agent: { select: { id: true, name: true, status: true } },
      project: { select: { id: true, name: true, slug: true } },
    },
  });

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await prisma.scheduledTask.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ success: false, error: "Scheduled task not found" }, { status: 404 });
  }

  await prisma.scheduledTask.delete({ where: { id } });
  return NextResponse.json({ success: true, data: { id } });
}
