import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { memoryCreateSchema } from "@/lib/agent-zero-validation";
import { toPrismaJson } from "@/lib/prisma-json";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const agentId = searchParams.get("agentId");
  const kind = searchParams.get("kind");
  const take = Math.max(1, Math.min(200, Number(searchParams.get("take") ?? "100")));

  const entries = await prisma.memoryEntry.findMany({
    where: {
      userId: session.user.id,
      ...(projectId ? { projectId } : {}),
      ...(agentId ? { agentId } : {}),
      ...(kind ? { kind: kind as "NOTE" | "FACT" | "DECISION" | "SUMMARY" | "KNOWLEDGE" } : {}),
    },
    orderBy: [{ createdAt: "desc" }],
    take,
    include: {
      project: { select: { id: true, name: true, slug: true } },
      agent: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ success: true, data: entries });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = memoryCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
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

  const created = await prisma.memoryEntry.create({
    data: {
      userId: session.user.id,
      projectId: parsed.data.projectId ?? null,
      agentId: parsed.data.agentId ?? null,
      kind: parsed.data.kind ?? "NOTE",
      title: parsed.data.title ?? null,
      content: parsed.data.content,
      metadata: toPrismaJson(parsed.data.metadata ?? {}),
    },
    include: {
      project: { select: { id: true, name: true, slug: true } },
      agent: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ success: true, data: created }, { status: 201 });
}
