import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { a2aConnectionCreateSchema } from "@/lib/agent-zero-validation";
import { toPrismaJson } from "@/lib/prisma-json";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const connections = await prisma.a2AConnection.findMany({
    where: { userId: session.user.id },
    orderBy: [{ createdAt: "desc" }],
    include: {
      project: { select: { id: true, name: true, slug: true } },
    },
  });

  return NextResponse.json({ success: true, data: connections });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = a2aConnectionCreateSchema.safeParse(payload);
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

  const created = await prisma.a2AConnection.create({
    data: {
      userId: session.user.id,
      projectId: parsed.data.projectId ?? null,
      name: parsed.data.name,
      endpointUrl: parsed.data.endpointUrl,
      sharedSecret: parsed.data.sharedSecret ?? null,
      enabled: parsed.data.enabled ?? true,
      metadata: toPrismaJson(parsed.data.metadata ?? {}),
    },
    include: {
      project: { select: { id: true, name: true, slug: true } },
    },
  });

  return NextResponse.json({ success: true, data: created }, { status: 201 });
}
