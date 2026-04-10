import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { consumeAuthToken, getAppUrl } from "@/lib/auth-links";

function verifyErrorResponse(reason: string): NextResponse {
  return NextResponse.redirect(new URL(`/auth/verify-error?reason=${encodeURIComponent(reason)}`, getAppUrl()));
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const tokenResult = await consumeAuthToken(token, "verify");

  if (!tokenResult.ok) {
    return verifyErrorResponse(tokenResult.reason);
  }

  const updated = await prisma.user.updateMany({
    where: { id: tokenResult.userId },
    data: {
      emailVerified: new Date(),
      lastSeenAt: new Date(),
    },
  });

  if (updated.count === 0) {
    return verifyErrorResponse("invalid");
  }

  return NextResponse.redirect(new URL("/dashboard?verified=1", getAppUrl()));
}
