import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { issueTokenPair, verifyPassword } from "@/lib/jwt-auth";

const loginSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(128),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid request body" },
      { status: 400 }
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      emailVerified: true,
      planId: true,
      planStatus: true,
    },
  });

  if (!user?.passwordHash) {
    return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
  }

  const validPassword = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!validPassword) {
    return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
  }

  const requireVerifiedEmail = process.env.AUTH_REQUIRE_EMAIL_VERIFIED !== "false";
  if (requireVerifiedEmail && !user.emailVerified) {
    return NextResponse.json(
      { success: false, error: "Please verify your email before signing in" },
      { status: 403 }
    );
  }

  const tokens = await issueTokenPair(user, request.headers.get("user-agent"));

  await prisma.user.update({
    where: { id: user.id },
    data: { lastSeenAt: new Date() },
  });

  return NextResponse.json({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: tokens.expiresAt,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      planId: user.planId,
      planStatus: user.planStatus,
    },
  });
}
