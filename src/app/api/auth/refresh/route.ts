import { NextResponse } from "next/server";
import { z } from "zod";
import { rotateRefreshToken } from "@/lib/jwt-auth";

const refreshSchema = z.object({
  refreshToken: z.string().min(16).max(1024),
});

function errorForReason(reason: "invalid" | "expired" | "replayed"): string {
  switch (reason) {
    case "expired":
      return "Refresh token expired";
    case "replayed":
      return "Refresh token replay detected. Please login again.";
    default:
      return "Invalid refresh token";
  }
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = refreshSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid request body" },
      { status: 400 }
    );
  }

  const rotated = await rotateRefreshToken(parsed.data.refreshToken, request.headers.get("user-agent"));
  if (!rotated.ok) {
    return NextResponse.json({ success: false, error: errorForReason(rotated.reason) }, { status: 401 });
  }

  return NextResponse.json({
    accessToken: rotated.accessToken,
    refreshToken: rotated.refreshToken,
    expiresAt: rotated.expiresAt,
  });
}
