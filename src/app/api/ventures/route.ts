import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { ventureSchema } from "@/lib/venture-validation";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const ventures = await prisma.venture.findMany({
    where: { createdBy: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: ventures });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = ventureSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const venture = await prisma.venture.create({
    data: {
      name: parsed.data.name,
      type: parsed.data.type,
      config: (parsed.data.config ?? {}) as Prisma.InputJsonValue,
      createdBy: session.user.id,
    },
  });

  return NextResponse.json({ success: true, data: venture }, { status: 201 });
}
