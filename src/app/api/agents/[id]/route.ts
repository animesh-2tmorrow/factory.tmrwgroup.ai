import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { stopAgentOnEcs } from "@/lib/agent-provisioning";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const agent = await prisma.agent.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    select: {
      id: true,
      userId: true,
      name: true,
      platform: true,
      status: true,
      modelName: true,
      projectId: true,
      parentAgentId: true,
      lastError: true,
      createdAt: true,
      updatedAt: true,
      project: {
        select: { id: true, name: true, slug: true },
      },
      parentAgent: {
        select: { id: true, name: true, status: true },
      },
    },
  });

  if (!agent) {
    return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
  }

  const usageSummary = await prisma.agentUsageEvent.aggregate({
    where: { agentId: agent.id },
    _sum: {
      inputTokens: true,
      outputTokens: true,
      totalTokens: true,
    },
  });

  const usageTotals = {
    inputTokens: usageSummary._sum.inputTokens ?? 0,
    outputTokens: usageSummary._sum.outputTokens ?? 0,
    totalTokens: usageSummary._sum.totalTokens ?? 0,
  };

  return NextResponse.json({
    success: true,
    data: {
      ...agent,
      usageTotals,
    },
  });
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const payload = await req.json();

  const agent = await prisma.agent.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
  });

  if (!agent) {
    return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
  }

  // Allow updating instructions
  const updateData: { instructions?: string; name?: string } = {};

  if (typeof payload.instructions === "string") {
    updateData.instructions = payload.instructions;
  }

  if (typeof payload.name === "string") {
    updateData.name = payload.name;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 });
  }

  const updated = await prisma.agent.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({
    success: true,
    data: updated,
  });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const agent = await prisma.agent.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    select: {
      id: true,
      ecsClusterArn: true,
      ecsTaskArn: true,
      ecsServiceArn: true,
      efsAccessPointId: true,
    },
  });

  if (!agent) {
    return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
  }

  const stopResult = await stopAgentOnEcs(agent);

  if (!stopResult.stopped && agent.ecsTaskArn) {
    console.error(
      `[agent-delete] Failed to stop ECS task for agent ${agent.id}: ${stopResult.reason}. ` +
        `cluster=${agent.ecsClusterArn} task=${agent.ecsTaskArn}`
    );
  }

  await prisma.agent.delete({
    where: { id: agent.id },
  });

  return NextResponse.json({
    success: true,
    data: { id: agent.id },
    meta: {
      ecsStopAttempted: Boolean(agent.ecsTaskArn),
      ecsStopped: stopResult.stopped,
      ecsNote: stopResult.reason ?? null,
    },
  });
}
