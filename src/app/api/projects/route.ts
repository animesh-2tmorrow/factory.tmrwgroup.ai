import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { projectCreateSchema } from "@/lib/agent-zero-validation";
import { ensureUniqueSlug } from "@/lib/slug";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: [{ isArchived: "asc" }, { createdAt: "desc" }],
    include: {
      _count: {
        select: {
          agents: true,
          skills: true,
          memories: true,
          scheduledTasks: true,
        },
      },
    },
  });

  return NextResponse.json({ success: true, data: projects });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const payload = await request.json().catch(() => ({}));
  const parsed = projectCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  const slug = await ensureUniqueSlug(parsed.data.slug ?? parsed.data.name, async (candidate) => {
    const existing = await prisma.project.findFirst({
        where: {
          userId,
          slug: candidate,
        },
      select: { id: true },
    });
    return Boolean(existing);
  });

  const created = await prisma.project.create({
    data: {
      userId,
      name: parsed.data.name,
      slug,
      description: parsed.data.description ?? null,
      instructions: parsed.data.instructions ?? null,
      workspaceRoot: parsed.data.workspaceRoot ?? null,
      memoryIsolation: parsed.data.memoryIsolation ?? true,
    },
  });

  return NextResponse.json({ success: true, data: created }, { status: 201 });
}
