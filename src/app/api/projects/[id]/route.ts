import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { projectUpdateSchema } from "@/lib/agent-zero-validation";
import { ensureUniqueSlug } from "@/lib/slug";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { id } = await context.params;
  const current = await prisma.project.findFirst({
    where: { id, userId },
    select: { id: true, slug: true },
  });
  if (!current) {
    return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = projectUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  let slug = current.slug;
  if (parsed.data.slug || parsed.data.name) {
    slug = await ensureUniqueSlug(parsed.data.slug ?? parsed.data.name ?? current.slug, async (candidate) => {
      const existing = await prisma.project.findFirst({
        where: {
          userId,
          slug: candidate,
          id: { not: id },
        },
        select: { id: true },
      });
      return Boolean(existing);
    });
  }

  const updated = await prisma.project.update({
    where: { id },
    data: {
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
      instructions: parsed.data.instructions,
      workspaceRoot: parsed.data.workspaceRoot,
      memoryIsolation: parsed.data.memoryIsolation,
      isArchived: parsed.data.isArchived,
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
  const existing = await prisma.project.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
  }

  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ success: true, data: { id } });
}
