import type { BillingPlan, Subscription, SubscriptionStatus } from "@prisma/client";

export const PLAN_LABELS: Record<BillingPlan, string> = {
  FREE: "Free",
  STARTER: "Starter",
  PRO: "Pro",
};

export const PLAN_AGENT_LIMITS: Record<BillingPlan, number> = {
  FREE: 0,
  STARTER: 3,
  PRO: 20,
};

export function isPaidPlanActive(subscription: Pick<Subscription, "plan" | "status"> | null | undefined): boolean {
  if (!subscription) return false;
  return subscription.status === "ACTIVE" && subscription.plan !== "FREE";
}

export function normalizeSubscription(
  subscription: Pick<Subscription, "plan" | "status" | "currentPeriodEnd"> | null | undefined
): { plan: BillingPlan; status: SubscriptionStatus; currentPeriodEnd: string | null } {
  if (!subscription) {
    return {
      plan: "FREE",
      status: "NONE",
      currentPeriodEnd: null,
    };
  }

  return {
    plan: subscription.plan,
    status: subscription.status,
    currentPeriodEnd: subscription.currentPeriodEnd ? subscription.currentPeriodEnd.toISOString() : null,
  };
}

export function getAppUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000";
  return appUrl.replace(/\/$/, "");
}

export function getPlanPriceEnv(plan: "STARTER" | "PRO"): string | null {
  if (plan === "STARTER") {
    return process.env.STRIPE_PRICE_STARTER_MONTHLY ?? null;
  }

  return process.env.STRIPE_PRICE_PRO_MONTHLY ?? null;
}

export function getAgentLimitForPlan(plan: BillingPlan): number {
  return PLAN_AGENT_LIMITS[plan];
}
