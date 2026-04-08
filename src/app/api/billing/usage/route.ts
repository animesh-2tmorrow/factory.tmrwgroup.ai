import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

// AWS Bedrock pricing per 1K tokens (us-east-1, on-demand)
const BEDROCK_PRICING: Record<string, { input: number; output: number }> = {
  // Sonnet 4.5
  "global.anthropic.claude-sonnet-4-5-20250929-v1:0": { input: 0.003, output: 0.015 },
  "anthropic.claude-sonnet-4-5-20250929-v1:0": { input: 0.003, output: 0.015 },
  // Haiku 4.5
  "global.anthropic.claude-haiku-4-5-20251001-v1:0": { input: 0.0008, output: 0.004 },
  "anthropic.claude-haiku-4-5-20251001-v1:0": { input: 0.0008, output: 0.004 },
  // Sonnet 3.5
  "anthropic.claude-3-5-sonnet-20241022-v2:0": { input: 0.003, output: 0.015 },
};

function getModelCost(model: string): { input: number; output: number } {
  return BEDROCK_PRICING[model] ?? { input: 0.003, output: 0.015 };
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
    select: { currentPeriodEnd: true, createdAt: true },
  });

  // Current billing period: from (periodEnd - 30 days) to periodEnd, or last 30 days
  const periodEnd = subscription?.currentPeriodEnd ?? new Date();
  const periodStart = new Date(periodEnd.getTime() - 30 * 24 * 60 * 60 * 1000);

  const usageEvents = await prisma.agentUsageEvent.findMany({
    where: {
      userId: session.user.id,
      createdAt: { gte: periodStart },
    },
    select: {
      model: true,
      inputTokens: true,
      outputTokens: true,
      totalTokens: true,
      latencyMs: true,
      createdAt: true,
      agent: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalTokens = 0;
  let totalCost = 0;
  let totalRequests = usageEvents.length;
  let totalLatencyMs = 0;
  const modelBreakdown: Record<string, { requests: number; inputTokens: number; outputTokens: number; cost: number }> = {};

  for (const event of usageEvents) {
    totalInputTokens += event.inputTokens;
    totalOutputTokens += event.outputTokens;
    totalTokens += event.totalTokens;
    totalLatencyMs += event.latencyMs;

    const pricing = getModelCost(event.model);
    const eventCost =
      (event.inputTokens / 1000) * pricing.input +
      (event.outputTokens / 1000) * pricing.output;
    totalCost += eventCost;

    const modelKey = event.model || "unknown";
    if (!modelBreakdown[modelKey]) {
      modelBreakdown[modelKey] = { requests: 0, inputTokens: 0, outputTokens: 0, cost: 0 };
    }
    modelBreakdown[modelKey].requests += 1;
    modelBreakdown[modelKey].inputTokens += event.inputTokens;
    modelBreakdown[modelKey].outputTokens += event.outputTokens;
    modelBreakdown[modelKey].cost += eventCost;
  }

  return NextResponse.json({
    success: true,
    data: {
      period: {
        start: periodStart.toISOString(),
        end: periodEnd instanceof Date ? periodEnd.toISOString() : new Date().toISOString(),
      },
      totals: {
        requests: totalRequests,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        totalTokens,
        estimatedCost: Math.round(totalCost * 10000) / 10000,
        avgLatencyMs: totalRequests > 0 ? Math.round(totalLatencyMs / totalRequests) : 0,
      },
      modelBreakdown,
    },
  });
}
