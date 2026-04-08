import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { a2aConnectionUpdateSchema } from "@/lib/agent-zero-validation";
import { toPrismaJson } from "@/lib/prisma-json";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await prisma.a2AConnection.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ success: false, error: "Connection not found" }, { status: 404 });
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = a2aConnectionUpdateSchema.safeParse(payload);
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

  const updated = await prisma.a2AConnection.update({
    where: { id },
    data: {
      name: parsed.data.name,
      endpointUrl: parsed.data.endpointUrl,
      sharedSecret: parsed.data.sharedSecret === null ? null : parsed.data.sharedSecret,
      enabled: parsed.data.enabled,
      projectId: parsed.data.projectId,
      metadata: parsed.data.metadata === undefined ? undefined : toPrismaJson(parsed.data.metadata),
    },
    include: {
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
  const existing = await prisma.a2AConnection.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ success: false, error: "Connection not found" }, { status: 404 });
  }

  await prisma.a2AConnection.delete({ where: { id } });
  return NextResponse.json({ success: true, data: { id } });
}
