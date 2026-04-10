import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { findRefreshTokenRecord } from "@/lib/jwt-auth";
import { authenticateRequest } from "@/lib/request-auth";

const logoutSchema = z.object({
  refreshToken: z.string().min(16).max(1024),
});

export async function POST(request: Request) {
  const authContext = await authenticateRequest(request);
  if (!authContext?.userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = logoutSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid request body" },
      { status: 400 }
    );
  }

  const tokenRecord = await findRefreshTokenRecord(parsed.data.refreshToken, true);
  if (tokenRecord && tokenRecord.userId === authContext.userId && !tokenRecord.revokedAt) {
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: {
        revokedAt: new Date(),
        lastUsedAt: new Date(),
      },
    });
  }

  return NextResponse.json({ success: true });
}
