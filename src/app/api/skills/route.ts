import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { skillCreateSchema } from "@/lib/agent-zero-validation";
import { ensureUniqueSlug } from "@/lib/slug";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const scope = searchParams.get("scope");
  const includeInactive = searchParams.get("includeInactive") === "true";

  const skills = await prisma.skill.findMany({
    where: {
      userId,
      ...(projectId ? { projectId } : {}),
      ...(scope === "GLOBAL" || scope === "PROJECT" ? { scope } : {}),
      ...(includeInactive ? {} : { isActive: true }),
    },
    orderBy: [{ updatedAt: "desc" }],
    include: {
      project: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  return NextResponse.json({ success: true, data: skills });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const payload = await request.json().catch(() => ({}));
  const parsed = skillCreateSchema.safeParse(payload);
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

  const slug = await ensureUniqueSlug(parsed.data.slug ?? parsed.data.name, async (candidate) => {
    const existing = await prisma.skill.findFirst({
      where: {
        userId,
        slug: candidate,
      },
      select: { id: true },
    });
    return Boolean(existing);
  });

  const created = await prisma.skill.create({
    data: {
      userId,
      projectId: parsed.data.projectId ?? null,
      scope: parsed.data.projectId ? "PROJECT" : parsed.data.scope ?? "GLOBAL",
      name: parsed.data.name,
      slug,
      description: parsed.data.description ?? null,
      content: parsed.data.content,
      tags: parsed.data.tags ?? [],
      isActive: parsed.data.isActive ?? true,
    },
    include: {
      project: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  return NextResponse.json({ success: true, data: created }, { status: 201 });
}
