import type { Agent } from "@prisma/client";
import prisma from "@/lib/db";
import { provisionAgentOnEcs } from "@/lib/agent-provisioning";

function slugifyName(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

function defaultAgentModel(): string {
  return process.env.CLOUD_AGENT_MODEL ?? process.env.ANTHROPIC_MODEL ?? "global.anthropic.claude-haiku-4-5-20251001-v1:0";
}

function defaultMcpBaseUrl(): string {
  return (
    process.env.MCP_BASE_URL ??
    process.env.NEXT_PUBLIC_MCP_BASE_URL ??
    `${process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "https://factory.tmrwgroup.ai"}/api/mcp`
  );
}

function parseProvisionMeta(reason: string | undefined): Record<string, unknown> {
  if (!reason) return {};
  try {
    return JSON.parse(reason) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function updateAgentFromProvision(
  agentId: string,
  options: {
    started: boolean;
    reason?: string | null;
    clusterArn?: string;
    taskArn?: string;
    efsAccessPointId?: string;
  }
) {
  const cloudMeta = parseProvisionMeta(options.reason ?? undefined);

  await prisma.agent.update({
    where: { id: agentId },
    data: options.started
      ? {
          status: "PROVISIONING",
          ecsClusterArn: options.clusterArn ?? null,
          ecsTaskArn: options.taskArn ?? null,
          ecsServiceArn: null,
          efsAccessPointId: options.efsAccessPointId ?? null,
          cloudChatEndpoint: `/agents/${agentId}/chat`,
          mcpEndpoint: (cloudMeta.mcpBaseUrl as string | undefined) ?? defaultMcpBaseUrl(),
          modelName: (cloudMeta.modelName as string | undefined) ?? defaultAgentModel(),
          lastError: null,
        }
      : {
          status: "QUEUED",
          lastError: options.reason ?? "Waiting for ECS provisioning config",
        },
  });
}

export async function ensureWebsterAgentForUser(userId: string): Promise<Pick<Agent, "id" | "modelName">> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      bedrockAgentId: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.bedrockAgentId) {
    const linked = await prisma.agent.findFirst({
      where: {
        id: user.bedrockAgentId,
        userId,
      },
      select: {
        id: true,
        modelName: true,
      },
    });
    if (linked) return linked;
  }

  const existing = await prisma.agent.findFirst({
    where: {
      userId,
      platform: "CLOUD",
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      modelName: true,
      name: true,
      instructions: true,
      platform: true,
      inputConfig: true,
      userId: true,
    },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: userId },
      data: { bedrockAgentId: existing.id },
    });
    return existing;
  }

  const nameSeed = user.name ?? user.email ?? `user-${user.id.slice(0, 8)}`;
  const created = await prisma.agent.create({
    data: {
      userId,
      name: `webster-${slugifyName(nameSeed) || user.id.slice(0, 8)}`,
      platform: "CLOUD",
      status: "QUEUED",
      instructions: "Webster assistant",
    },
    select: {
      id: true,
      modelName: true,
      name: true,
      instructions: true,
      platform: true,
      inputConfig: true,
      userId: true,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      bedrockAgentId: created.id,
    },
  });

  const provisionResult = await provisionAgentOnEcs(created);
  await updateAgentFromProvision(created.id, {
    started: provisionResult.started,
    reason: provisionResult.reason,
    clusterArn: provisionResult.clusterArn,
    taskArn: provisionResult.taskArn,
    efsAccessPointId: provisionResult.efsAccessPointId,
  });

  const refreshed = await prisma.agent.findUnique({
    where: { id: created.id },
    select: {
      id: true,
      modelName: true,
    },
  });

  return {
    id: refreshed?.id ?? created.id,
    modelName: refreshed?.modelName ?? defaultAgentModel(),
  };
}
