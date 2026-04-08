import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { memoryUpdateSchema } from "@/lib/agent-zero-validation";
import { toPrismaJson } from "@/lib/prisma-json";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await prisma.memoryEntry.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ success: false, error: "Memory entry not found" }, { status: 404 });
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = memoryUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  const updated = await prisma.memoryEntry.update({
    where: { id },
    data: {
      kind: parsed.data.kind,
      title: parsed.data.title === null ? null : parsed.data.title,
      content: parsed.data.content,
      metadata: parsed.data.metadata === undefined ? undefined : toPrismaJson(parsed.data.metadata),
    },
    include: {
      project: { select: { id: true, name: true, slug: true } },
      agent: { select: { id: true, name: true } },
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
  const existing = await prisma.memoryEntry.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ success: false, error: "Memory entry not found" }, { status: 404 });
  }

  await prisma.memoryEntry.delete({ where: { id } });
  return NextResponse.json({ success: true, data: { id } });
}
