import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { authenticateRequest } from "@/lib/request-auth";
import { ensureWebsterAgentForUser } from "@/lib/webster-agent";

const registerExtensionSchema = z.object({
  extensionVersion: z.string().trim().min(1).max(64),
  browser: z.string().trim().min(1).max(120),
  os: z.string().trim().min(1).max(120),
  installReason: z.string().trim().min(1).max(64),
});

function extensionConfig() {
  return {
    featureFlags: {
      hubspotEnabled: process.env.WEBSTER_FLAG_HUBSPOT_ENABLED === "true",
      writeModeEnabled: process.env.WEBSTER_FLAG_WRITE_MODE_ENABLED !== "false",
      maxToolCallsPerTurn: Number.parseInt(process.env.WEBSTER_MAX_TOOL_CALLS_PER_TURN ?? "5", 10) || 5,
    },
    announcement: null,
    quotaWarningThreshold: Number.parseFloat(process.env.WEBSTER_QUOTA_WARNING_THRESHOLD ?? "0.9") || 0.9,
  };
}

export async function POST(request: Request) {
  const authContext = await authenticateRequest(request);
  if (!authContext?.userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  if (authContext.source !== "bearer") {
    return NextResponse.json(
      { success: false, error: "Bearer token required for extension registration" },
      { status: 401 }
    );
  }

  const payload = await request.json().catch(() => null);
  const parsed = registerExtensionSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid request body" },
      { status: 400 }
    );
  }

  const [user, agent] = await Promise.all([
    prisma.user.findUnique({
      where: { id: authContext.userId },
      select: {
        id: true,
        planId: true,
        planStatus: true,
      },
    }),
    ensureWebsterAgentForUser(authContext.userId),
  ]);

  if (!user) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: authContext.userId },
    data: { lastSeenAt: new Date() },
  });

  // Best-effort telemetry for extension lifecycle.
  prisma.memoryEntry
    .create({
      data: {
        userId: authContext.userId,
        agentId: agent.id,
        kind: "NOTE",
        title: "Webster extension registration",
        content: `Registered Webster extension v${parsed.data.extensionVersion}`,
        metadata: {
          source: "extension-register",
          browser: parsed.data.browser,
          os: parsed.data.os,
          installReason: parsed.data.installReason,
          registeredAt: new Date().toISOString(),
        },
      },
    })
    .catch(() => {});

  return NextResponse.json({
    agentId: agent.id,
    plan: user.planId,
    planStatus: user.planStatus,
    config: extensionConfig(),
  });
}
