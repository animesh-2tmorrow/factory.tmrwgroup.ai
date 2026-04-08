import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { agentSchema } from "@/lib/agent-validation";
import { getAgentLimitForPlan, isPaidPlanActive } from "@/lib/billing";
import { provisionAgentOnEcs } from "@/lib/agent-provisioning";
import {
  normalizeRuntimeProfile,
  runtimeProfileBootstrap,
  type RuntimeProfileId,
} from "@/lib/runtime-profiles";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const agents = await prisma.agent.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: agents });
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    select: { plan: true, status: true },
  });

  if (!isPaidPlanActive(subscription)) {
    return NextResponse.json(
      { success: false, error: "Active paid plan required before creating an agent" },
      { status: 402 }
    );
  }

  const plan = subscription?.plan ?? "FREE";
  const maxAgents = getAgentLimitForPlan(plan);
  const existingAgents = await prisma.agent.count({
    where: { userId: session.user.id },
  });

  if (existingAgents >= maxAgents) {
    return NextResponse.json(
      {
        success: false,
        error: `Agent limit reached for ${plan} plan (${existingAgents}/${maxAgents}). Delete an agent or upgrade plan.`,
      },
      { status: 409 }
    );
  }

  const payload = await req.json();
  const parsed = agentSchema.safeParse(payload);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "Validation failed";
    return NextResponse.json(
      { success: false, error: firstIssue, details: parsed.error.issues },
      { status: 400 }
    );
  }

  if (parsed.data.projectId) {
    const project = await prisma.project.findFirst({
      where: {
        id: parsed.data.projectId,
        userId: session.user.id,
      },
      select: { id: true },
    });
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }
  }

  if (parsed.data.parentAgentId) {
    const parent = await prisma.agent.findFirst({
      where: {
        id: parsed.data.parentAgentId,
        userId: session.user.id,
      },
      select: { id: true },
    });
    if (!parent) {
      return NextResponse.json({ success: false, error: "Parent agent not found" }, { status: 404 });
    }
  }

  const runtimeProfile: RuntimeProfileId = normalizeRuntimeProfile(parsed.data.runtimeProfile);
  const bootstrap = runtimeProfileBootstrap(runtimeProfile);

  const inputConfig: Prisma.InputJsonObject = {
    runtimeProfile,
    workspaceId: parsed.data.workspaceId ?? null,
    channelId: parsed.data.channelId ?? null,
    webhookUrl: parsed.data.webhookUrl ?? null,
    bootstrap: bootstrap ? ({ ...bootstrap } as Prisma.InputJsonObject) : null,
  };

  const created = await prisma.agent.create({
    data: {
      userId: session.user.id,
      projectId: parsed.data.projectId ?? null,
      parentAgentId: parsed.data.parentAgentId ?? null,
      name: parsed.data.name,
      platform: parsed.data.platform,
      instructions: parsed.data.instructions,
      inputConfig,
      status: "QUEUED",
      cloudChatEndpoint: null,
    },
  });

  const provisionResult = await provisionAgentOnEcs(created);
  const cloudMeta =
    parsed.data.platform === "CLOUD"
      ? (() => {
          try {
            return provisionResult.reason ? JSON.parse(provisionResult.reason) : {};
          } catch {
            return {} as Record<string, unknown>;
          }
        })()
      : {};

  const updated = await prisma.agent.update({
    where: { id: created.id },
    data: provisionResult.started
      ? parsed.data.platform === "CLOUD"
        ? {
            status: "PROVISIONING",
            ecsClusterArn: provisionResult.clusterArn,
            ecsTaskArn: provisionResult.taskArn ?? null,
            ecsServiceArn: null,
            efsAccessPointId: provisionResult.efsAccessPointId ?? null,
            cloudChatEndpoint: `/agents/${created.id}/chat`,
            mcpEndpoint:
              (cloudMeta.mcpBaseUrl as string | undefined) ??
              process.env.MCP_BASE_URL ??
              process.env.NEXT_PUBLIC_MCP_BASE_URL ??
              `${process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "https://factory.tmrwgroup.ai"}/api/mcp`,
            modelName:
              (cloudMeta.modelName as string | undefined) ??
              process.env.CLOUD_AGENT_MODEL ??
              process.env.ANTHROPIC_MODEL ??
              "global.anthropic.claude-haiku-4-5-20251001-v1:0",
            lastError: null,
          }
        : {
            status: "PROVISIONING",
            ecsClusterArn: provisionResult.clusterArn,
            ecsTaskArn: provisionResult.taskArn,
            efsAccessPointId: provisionResult.efsAccessPointId ?? null,
            lastError: null,
          }
      : {
          status: "QUEUED",
          lastError: provisionResult.reason ?? "Waiting for ECS provisioning config",
        },
  });

  return NextResponse.json(
    {
      success: true,
      data: updated,
      meta: {
        provisioningStarted: provisionResult.started,
        reason: provisionResult.reason ?? null,
      },
    },
    { status: 201 }
  );
}
