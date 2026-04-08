"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type BillingPlan = "FREE" | "STARTER" | "PRO";
type BillingStatus = "NONE" | "PENDING" | "ACTIVE" | "CANCELED" | "PAST_DUE";

export interface SubscriptionInfo {
  plan: BillingPlan;
  status: BillingStatus;
  currentPeriodEnd: string | null;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/billing/subscription", { cache: "no-store" });
      const body = await response.json();
      if (!body.success) {
        throw new Error(body.error || "Failed to load subscription");
      }
      setSubscription(body.data as SubscriptionInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load subscription");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const hasPaidPlan = useMemo(() => {
    if (!subscription) return false;
    return subscription.status === "ACTIVE" && subscription.plan !== "FREE";
  }, [subscription]);

  return { subscription, loading, error, hasPaidPlan, refresh };
}
