import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { consumeAuthToken } from "@/lib/auth-links";
import { hashPassword } from "@/lib/jwt-auth";

const resetPasswordSchema = z.object({
  token: z.string().min(16).max(1024),
  newPassword: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid request body" },
      { status: 400 }
    );
  }

  const tokenResult = await consumeAuthToken(parsed.data.token, "reset");
  if (!tokenResult.ok) {
    return NextResponse.json(
      {
        success: false,
        error: tokenResult.reason === "expired" ? "Reset token expired" : "Invalid reset token",
      },
      { status: 400 }
    );
  }

  const userExists = await prisma.user.findUnique({
    where: { id: tokenResult.userId },
    select: { id: true },
  });
  if (!userExists) {
    return NextResponse.json({ success: false, error: "Invalid reset token" }, { status: 400 });
  }

  const newPasswordHash = await hashPassword(parsed.data.newPassword);
  const now = new Date();

  await prisma.$transaction([
    prisma.user.update({
      where: { id: tokenResult.userId },
      data: {
        passwordHash: newPasswordHash,
        lastSeenAt: now,
      },
    }),
    prisma.refreshToken.updateMany({
      where: {
        userId: tokenResult.userId,
        revokedAt: null,
      },
      data: {
        revokedAt: now,
        lastUsedAt: now,
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
