import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { voiceProfileUpsertSchema } from "@/lib/agent-zero-validation";
import { toPrismaJson } from "@/lib/prisma-json";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const profile = await prisma.voiceProfile.findFirst({
    where: {
      userId: session.user.id,
      projectId: projectId ?? null,
    },
    include: {
      project: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ success: true, data: profile });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = voiceProfileUpsertSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  const projectId = parsed.data.projectId ?? null;
  if (projectId) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
      select: { id: true },
    });
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }
  }

  const existing = await prisma.voiceProfile.findFirst({
    where: {
      userId: session.user.id,
      projectId,
    },
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });

  const data = {
    provider: parsed.data.provider ?? "BROWSER",
    voiceName: parsed.data.voiceName === null ? null : parsed.data.voiceName ?? null,
    sttEnabled: parsed.data.sttEnabled ?? true,
    ttsEnabled: parsed.data.ttsEnabled ?? true,
    metadata: toPrismaJson(parsed.data.metadata ?? {}),
  };

  const saved = existing
    ? await prisma.voiceProfile.update({
        where: { id: existing.id },
        data,
        include: { project: { select: { id: true, name: true, slug: true } } },
      })
    : await prisma.voiceProfile.create({
        data: {
          userId: session.user.id,
          projectId,
          ...data,
        },
        include: { project: { select: { id: true, name: true, slug: true } } },
      });

  return NextResponse.json({ success: true, data: saved });
}
