import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { consumeAuthToken } from "@/lib/auth-links";

const verifySchema = z.object({
  token: z.string().min(16).max(1024),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = verifySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid request body" },
      { status: 400 }
    );
  }

  const tokenResult = await consumeAuthToken(parsed.data.token, "verify");
  if (!tokenResult.ok) {
    return NextResponse.json(
      {
        success: false,
        error: tokenResult.reason === "expired" ? "Verification token expired" : "Invalid verification token",
      },
      { status: 400 }
    );
  }

  const updated = await prisma.user.updateMany({
    where: { id: tokenResult.userId },
    data: {
      emailVerified: new Date(),
      lastSeenAt: new Date(),
    },
  });

  if (updated.count === 0) {
    return NextResponse.json({ success: false, error: "Invalid verification token" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
