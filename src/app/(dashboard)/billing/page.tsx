"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { useSubscription } from "@/hooks/useSubscription";
import { PUBLIC_RUNTIME_LABEL } from "@/lib/runtime-brand";
import { Activity, Check, CreditCard, Loader2, Rocket, Shield, XCircle, Zap } from "lucide-react";

type PaidPlan = "STARTER" | "PRO";

interface UsageData {
  period: { start: string; end: string };
  totals: {
    requests: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: number;
    avgLatencyMs: number;
  };
  modelBreakdown: Record<string, { requests: number; inputTokens: number; outputTokens: number; cost: number }>;
}

function friendlyModel(raw: string): string {
  const l = raw.toLowerCase();
  if (l.includes("sonnet-4-5") || l.includes("sonnet-4.5")) return "Claude Sonnet 4.5";
  if (l.includes("haiku-4-5") || l.includes("haiku-4.5")) return "Claude Haiku 4.5";
  if (l.includes("sonnet")) return "Claude Sonnet";
  if (l.includes("haiku")) return "Claude Haiku";
  return raw;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const PLAN_OPTIONS: Array<{
  key: PaidPlan;
  label: string;
  price: string;
  features: string[];
}> = [
  {
    key: "STARTER",
    label: "Starter",
    price: "$49/mo",
    features: [
      "Up to 3 cloud agents",
      PUBLIC_RUNTIME_LABEL,
      "Session chat + usage tracking",
      "Standard ECS provisioning",
    ],
  },
  {
    key: "PRO",
    label: "Pro",
    price: "$199/mo",
    features: [
      "Up to 20 cloud agents",
      "Priority provisioning",
      "Expanded runtime controls",
      "Advanced usage visibility",
    ],
  },
];

export default function BillingPage() {
  const { subscription, loading, hasPaidPlan, refresh } = useSubscription();
  const [busyPlan, setBusyPlan] = useState<PaidPlan | null>(null);
  const [confirmingCheckout, setConfirmingCheckout] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);

  const planSummary = useMemo(() => {
    if (!subscription) return "FREE / NONE";
    return `${subscription.plan} / ${subscription.status}`;
  }, [subscription]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const checkoutStatus = url.searchParams.get("checkout");
    const sessionId = url.searchParams.get("session_id");
    if (checkoutStatus !== "success" || !sessionId) return;

    void confirmCheckout(sessionId);
  }, []);

  useEffect(() => {
    if (hasPaidPlan) void fetchUsage();
  }, [hasPaidPlan]);

  async function fetchUsage() {
    setUsageLoading(true);
    try {
      const res = await fetch("/api/billing/usage", { cache: "no-store" });
      const body = await res.json();
      if (body.success) setUsage(body.data as UsageData);
    } catch { /* silent */ }
    setUsageLoading(false);
  }

  async function cancelSubscription() {
    const confirmed = window.confirm("Cancel your subscription? You will lose access to agents and dashboard at the end of your billing period.");
    if (!confirmed) return;

    setCancelling(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      const body = await res.json();
      if (!body.success) throw new Error(body.error || "Cancellation failed");
      await refresh();
      setSuccess("Subscription cancelled. You retain access until the end of your current billing period.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancellation failed");
    } finally {
      setCancelling(false);
    }
  }

  async function confirmCheckout(sessionId: string) {
    setConfirmingCheckout(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/billing/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const body = await response.json();
      if (!body.success) {
        throw new Error(body.error || "Unable to confirm checkout");
      }
      await refresh();
      setSuccess("Subscription activated. You now have full platform access.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm checkout");
    } finally {
      setConfirmingCheckout(false);
      const cleaned = new URL(window.location.href);
      cleaned.searchParams.delete("checkout");
      cleaned.searchParams.delete("session_id");
      cleaned.searchParams.delete("simulated");
      window.history.replaceState({}, "", cleaned.toString());
    }
  }

  async function startCheckout(plan: PaidPlan) {
    setBusyPlan(plan);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const body = await response.json();
      if (!body.success) {
        throw new Error(body.error || "Unable to start checkout");
      }
      if (!body.data?.checkoutUrl) {
        throw new Error("Checkout URL missing");
      }
      window.location.href = body.data.checkoutUrl as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setBusyPlan(null);
    }
  }

  return (
    <>
      <Header
        title="Billing"
        description="Choose a subscription to unlock Dashboard, Agents, and New Agent."
      />

      <div className="page-container vf-section-stack">
        {(loading || confirmingCheckout) && (
          <div className="vf-card vf-card-pad" style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
            <span className="vf-muted">{confirmingCheckout ? "Confirming Stripe checkout..." : "Loading subscription..."}</span>
          </div>
        )}

        {!loading && !confirmingCheckout && (
          <>
            <div className="vf-card vf-card-pad" style={{ display: "grid", gap: "var(--space-3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <CreditCard size={16} style={{ color: "var(--teal)" }} />
                <span className="vf-kicker">Current status</span>
              </div>
              <div className="vf-title" style={{ fontSize: "var(--text-lg)" }}>{planSummary}</div>
              {subscription?.currentPeriodEnd && (
                <div className="vf-muted" style={{ fontSize: "var(--text-sm)" }}>
                  Current period end: {new Date(subscription.currentPeriodEnd).toLocaleString()}
                </div>
              )}
            </div>

            {error && (
              <div
                className="vf-card vf-card-pad"
                style={{
                  borderColor: "color-mix(in srgb, var(--error) 35%, var(--border))",
                  background: "color-mix(in srgb, var(--error) 8%, var(--bg-card))",
                  color: "var(--error)",
                }}
              >
                {error}
              </div>
            )}

            {success && (
              <div
                className="vf-card vf-card-pad"
                style={{
                  borderColor: "color-mix(in srgb, var(--teal) 35%, var(--border))",
                  background: "color-mix(in srgb, var(--teal) 8%, var(--bg-card))",
                  color: "var(--teal)",
                }}
              >
                {success}
              </div>
            )}

            {hasPaidPlan ? (
              <>
                <div className="vf-card vf-card-pad" style={{ display: "grid", gap: "var(--space-4)" }}>
                  <div>
                    <h2 className="vf-title" style={{ marginBottom: "var(--space-2)" }}>Subscription active</h2>
                    <p className="vf-muted" style={{ fontSize: "var(--text-sm)" }}>
                      Billing is active. You can now access Dashboard, Agents, and New Agent.
                    </p>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", alignItems: "center" }}>
                    <Link href="/dashboard" className="vf-button-primary">
                      <Rocket size={14} />
                      Open Dashboard
                    </Link>
                    <Link href="/agents" className="vf-button-ghost">
                      Agents
                    </Link>
                    <Link href="/create" className="vf-button-ghost">
                      New Agent
                    </Link>
                    <button
                      className="vf-button-ghost"
                      style={{ color: "var(--error)", marginLeft: "auto", fontSize: "var(--text-sm)" }}
                      onClick={() => void cancelSubscription()}
                      disabled={cancelling}
                    >
                      <XCircle size={14} />
                      {cancelling ? "Cancelling..." : "Cancel Subscription"}
                    </button>
                  </div>
                </div>

                {/* Usage Stats */}
                <div className="vf-card vf-card-pad" style={{ display: "grid", gap: "var(--space-4)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <Activity size={16} style={{ color: "var(--teal)" }} />
                    <span className="vf-kicker">Usage this billing period</span>
                  </div>

                  {usageLoading ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                      <span className="vf-muted">Loading usage...</span>
                    </div>
                  ) : usage ? (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "var(--space-3)" }}>
                        <div style={{ padding: "var(--space-3)", borderRadius: "var(--vf-radius-md)", background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                          <div className="vf-kicker" style={{ marginBottom: "var(--space-1)" }}>Total Requests</div>
                          <div className="vf-title" style={{ fontSize: "var(--text-xl)" }}>{usage.totals.requests}</div>
                        </div>
                        <div style={{ padding: "var(--space-3)", borderRadius: "var(--vf-radius-md)", background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                          <div className="vf-kicker" style={{ marginBottom: "var(--space-1)" }}>Input Tokens</div>
                          <div className="vf-title" style={{ fontSize: "var(--text-xl)" }}>{formatTokens(usage.totals.inputTokens)}</div>
                        </div>
                        <div style={{ padding: "var(--space-3)", borderRadius: "var(--vf-radius-md)", background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                          <div className="vf-kicker" style={{ marginBottom: "var(--space-1)" }}>Output Tokens</div>
                          <div className="vf-title" style={{ fontSize: "var(--text-xl)" }}>{formatTokens(usage.totals.outputTokens)}</div>
                        </div>
                        <div style={{ padding: "var(--space-3)", borderRadius: "var(--vf-radius-md)", background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                          <div className="vf-kicker" style={{ marginBottom: "var(--space-1)" }}>
                            <Zap size={11} style={{ display: "inline", marginRight: 4 }} />
                            Est. Bedrock Cost
                          </div>
                          <div className="vf-title" style={{ fontSize: "var(--text-xl)", color: "var(--teal)" }}>${usage.totals.estimatedCost.toFixed(4)}</div>
                        </div>
                      </div>

                      {Object.keys(usage.modelBreakdown).length > 0 && (
                        <div>
                          <div className="vf-kicker" style={{ marginBottom: "var(--space-2)" }}>By Model</div>
                          <div style={{ display: "grid", gap: "var(--space-2)" }}>
                            {Object.entries(usage.modelBreakdown).map(([model, stats]) => (
                              <div
                                key={model}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  padding: "var(--space-2) var(--space-3)",
                                  borderRadius: "var(--vf-radius-md)",
                                  background: "var(--bg-surface)",
                                  border: "1px solid var(--border)",
                                  fontSize: "var(--text-sm)",
                                }}
                              >
                                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{friendlyModel(model)}</span>
                                <div style={{ display: "flex", gap: "var(--space-4)" }}>
                                  <span className="vf-muted">{stats.requests} req</span>
                                  <span className="vf-muted">{formatTokens(stats.inputTokens + stats.outputTokens)} tokens</span>
                                  <span style={{ color: "var(--teal)", fontWeight: 500 }}>${stats.cost.toFixed(4)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="vf-muted" style={{ fontSize: "var(--text-xs)" }}>
                        Period: {new Date(usage.period.start).toLocaleDateString()} — {new Date(usage.period.end).toLocaleDateString()}
                        {usage.totals.avgLatencyMs > 0 && ` | Avg latency: ${usage.totals.avgLatencyMs}ms`}
                      </div>
                    </>
                  ) : (
                    <p className="vf-muted" style={{ fontSize: "var(--text-sm)" }}>No usage data available.</p>
                  )}
                </div>
              </>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--space-4)" }}>
                {PLAN_OPTIONS.map((plan) => (
                  <div key={plan.key} className="vf-card vf-card-pad" style={{ display: "grid", gap: "var(--space-4)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <h2 className="vf-title" style={{ fontSize: "var(--text-lg)" }}>{plan.label}</h2>
                      <span style={{ color: "var(--teal)", fontWeight: 700 }}>{plan.price}</span>
                    </div>
                    <div style={{ display: "grid", gap: "var(--space-2)" }}>
                      {plan.features.map((feature) => (
                        <div key={feature} style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", fontSize: "var(--text-sm)" }}>
                          <Check size={14} style={{ color: "var(--teal)", flexShrink: 0 }} />
                          <span className="vf-muted">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      className="vf-button-primary"
                      disabled={busyPlan !== null}
                      onClick={() => void startCheckout(plan.key)}
                    >
                      {busyPlan === plan.key ? (
                        <>
                          <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                          Redirecting...
                        </>
                      ) : (
                        <>
                          <Shield size={14} />
                          Buy {plan.label}
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
