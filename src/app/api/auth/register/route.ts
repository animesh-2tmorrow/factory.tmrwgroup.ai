import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import prisma from "@/lib/db";
import { provisionAgentOnEcs } from "@/lib/agent-provisioning";
import { currentQuotaPeriod, hashPassword } from "@/lib/jwt-auth";
import { getAppUrl, issueEmailVerificationToken, notifyAuthLink } from "@/lib/auth-links";

const FREE_TRIAL_DAYS = 7;
const FREE_TRIAL_TOKENS = 50_000;

const registerSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(120),
});

function getStripeClient(): Stripe | null {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  return stripeKey ? new Stripe(stripeKey) : null;
}

function slugifyName(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

function nextTrialEndDate(): Date {
  return new Date(Date.now() + FREE_TRIAL_DAYS * 24 * 60 * 60_000);
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid request body" },
      { status: 400 }
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const existing = await prisma.user.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json({ success: false, error: "Email is already registered" }, { status: 409 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const stripe = getStripeClient();
  let stripeCustomerId: string | null = null;

  if (stripe) {
    try {
      const customer = await stripe.customers.create({
        email,
        name: parsed.data.name,
      });
      stripeCustomerId = customer.id;
    } catch (error) {
      console.warn(
        `[auth/register] Stripe customer creation failed for ${email}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  const now = new Date();
  const trialEndsAt = nextTrialEndDate();
  const { periodStart, periodEnd } = currentQuotaPeriod(now);
  const defaultAgentName = `webster-${slugifyName(parsed.data.name) || "user"}`;

  const created = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        name: parsed.data.name,
        passwordHash,
        planId: "free_trial",
        planStatus: "trialing",
        trialEndsAt,
        quotaMonthlyTokens: FREE_TRIAL_TOKENS,
        stripeCustomerId: stripeCustomerId ?? undefined,
        lastSeenAt: now,
      },
    });

    await tx.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        plan: "FREE",
        status: "NONE",
        stripeCustomerId: stripeCustomerId ?? undefined,
      },
      update: {
        stripeCustomerId: stripeCustomerId ?? undefined,
      },
    });

    const agent = await tx.agent.create({
      data: {
        userId: user.id,
        name: defaultAgentName,
        platform: "CLOUD",
        status: "QUEUED",
        instructions: "Webster assistant",
      },
      select: {
        id: true,
        userId: true,
        name: true,
        platform: true,
        instructions: true,
        inputConfig: true,
      },
    });

    await tx.monthlyQuota.create({
      data: {
        userId: user.id,
        periodStart,
        periodEnd,
        tokensIncluded: FREE_TRIAL_TOKENS,
      },
    });

    await tx.user.update({
      where: { id: user.id },
      data: {
        bedrockAgentId: agent.id,
      },
    });

    return { user, agent };
  });

  const provisionResult = await provisionAgentOnEcs(created.agent);
  const cloudMeta =
    created.agent.platform === "CLOUD"
      ? (() => {
          try {
            return provisionResult.reason ? JSON.parse(provisionResult.reason) : {};
          } catch {
            return {} as Record<string, unknown>;
          }
        })()
      : {};

  await prisma.agent.update({
    where: { id: created.agent.id },
    data: provisionResult.started
      ? {
          status: "PROVISIONING",
          ecsClusterArn: provisionResult.clusterArn ?? null,
          ecsTaskArn: provisionResult.taskArn ?? null,
          ecsServiceArn: null,
          efsAccessPointId: provisionResult.efsAccessPointId ?? null,
          cloudChatEndpoint: `/agents/${created.agent.id}/chat`,
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
          status: "QUEUED",
          lastError: provisionResult.reason ?? "Waiting for ECS provisioning config",
        },
  });

  const verificationToken = await issueEmailVerificationToken(created.user.id);
  const verificationUrl = `${getAppUrl()}/api/auth/verify-email/${encodeURIComponent(verificationToken)}`;

  if (created.user.email) {
    notifyAuthLink("verify", created.user.email, verificationUrl).catch((error) => {
      console.warn(
        `[auth/register] Failed to publish verification link for ${created.user.email}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    });
  }

  const includeVerificationUrl =
    process.env.AUTH_RETURN_LINKS === "true" || process.env.NODE_ENV !== "production";

  return NextResponse.json(
    {
      success: true,
      userId: created.user.id,
      email: created.user.email,
      verificationSent: true,
      ...(includeVerificationUrl ? { verificationUrl } : {}),
    },
    { status: 201 }
  );
}
