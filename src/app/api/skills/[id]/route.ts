import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { skillUpdateSchema } from "@/lib/agent-zero-validation";
import { ensureUniqueSlug } from "@/lib/slug";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { id } = await context.params;
  const existing = await prisma.skill.findFirst({
    where: { id, userId },
    select: { id: true, slug: true, projectId: true },
  });
  if (!existing) {
    return NextResponse.json({ success: false, error: "Skill not found" }, { status: 404 });
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = skillUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  if (parsed.data.projectId) {
    const project = await prisma.project.findFirst({
      where: { id: parsed.data.projectId, userId },
      select: { id: true },
    });
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }
  }

  const nextName = parsed.data.name ?? null;
  const nextSlugInput = parsed.data.slug ?? nextName;
  let nextSlug = existing.slug;
  if (nextSlugInput) {
    nextSlug = await ensureUniqueSlug(nextSlugInput, async (candidate) => {
      const conflict = await prisma.skill.findFirst({
        where: {
          userId,
          slug: candidate,
          id: { not: id },
        },
        select: { id: true },
      });
      return Boolean(conflict);
    });
  }

  const updated = await prisma.skill.update({
    where: { id },
    data: {
      name: parsed.data.name,
      slug: nextSlug,
      description: parsed.data.description,
      content: parsed.data.content,
      scope:
        parsed.data.projectId === null
          ? parsed.data.scope ?? "GLOBAL"
          : parsed.data.projectId
            ? "PROJECT"
            : parsed.data.scope,
      projectId: parsed.data.projectId,
      tags: parsed.data.tags,
      isActive: parsed.data.isActive,
    },
    include: {
      project: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { id } = await context.params;
  const existing = await prisma.skill.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ success: false, error: "Skill not found" }, { status: 404 });
  }

  await prisma.skill.delete({ where: { id } });
  return NextResponse.json({ success: true, data: { id } });
}
