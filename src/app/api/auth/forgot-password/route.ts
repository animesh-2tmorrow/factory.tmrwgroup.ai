import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getAppUrl, issuePasswordResetToken, notifyAuthLink } from "@/lib/auth-links";

const forgotPasswordSchema = z.object({
  email: z.string().email().max(320),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(payload);
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
      passwordHash: true,
    },
  });

  if (user?.id && user.email && user.passwordHash) {
    const token = await issuePasswordResetToken(user.id);
    const resetUrl = `${getAppUrl()}/reset-password?token=${encodeURIComponent(token)}`;
    notifyAuthLink("reset", user.email, resetUrl).catch((error) => {
      console.warn(
        `[auth/forgot-password] Failed to publish reset link for ${user.email}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    });
  }

  return NextResponse.json({ sent: true });
}
