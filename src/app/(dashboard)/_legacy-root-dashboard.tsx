"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  CircleAlert,
  Clock3,
  CreditCard,
  Layers3,
  Rocket,
  Sparkles,
  Workflow,
} from "lucide-react";

type BillingPlan = "FREE" | "STARTER" | "PRO";
type BillingStatus = "NONE" | "PENDING" | "ACTIVE" | "CANCELED" | "PAST_DUE";

interface SubscriptionInfo {
  plan: BillingPlan;
  status: BillingStatus;
  currentPeriodEnd: string | null;
}

interface Agent {
  id: string;
  status: "QUEUED" | "PROVISIONING" | "RUNNING" | "FAILED" | "STOPPED";
}

const QUICK_LINKS = [
  {
    label: "New Agent",
    href: "/create",
    desc: "Choose plan and launch Slack/Discord runtime",
    color: "var(--teal)",
    icon: Rocket,
  },
  {
    label: "Agents",
    href: "/agents",
    desc: "Monitor runtime health and task states",
    color: "var(--blue)",
    icon: Bot,
  },
  {
    label: "Templates",
    href: "/templates",
    desc: "Start from approved product and agent patterns",
    color: "var(--gold)",
    icon: Layers3,
  },
  {
    label: "Infrastructure",
    href: "/infra",
    desc: "Review ECS topology, limits, and deployment details",
    color: "var(--orange)",
    icon: Workflow,
  },
];

export default function DashboardPage() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);

    try {
      const [subscriptionResponse, agentsResponse] = await Promise.all([
        fetch("/api/billing/subscription", { cache: "no-store" }),
        fetch("/api/agents", { cache: "no-store" }),
      ]);

      const subscriptionBody = await subscriptionResponse.json();
      const agentsBody = await agentsResponse.json();

      if (subscriptionBody.success) {
        setSubscription(subscriptionBody.data as SubscriptionInfo);
      }

      if (agentsBody.success) {
        setAgents(agentsBody.data as Agent[]);
      }
    } finally {
      setLoading(false);
    }
  }

  const runningAgents = useMemo(
    () => agents.filter((agent) => agent.status === "RUNNING" || agent.status === "PROVISIONING").length,
    [agents]
  );
  const failedAgents = useMemo(() => agents.filter((agent) => agent.status === "FAILED").length, [agents]);
  const queuedAgents = useMemo(() => agents.filter((agent) => agent.status === "QUEUED").length, [agents]);

  const canCreateAgent = subscription?.status === "ACTIVE" && subscription?.plan !== "FREE";

  const planValue = loading ? "..." : subscription?.plan ?? "FREE";
  const billingValue = loading ? "..." : subscription?.status ?? "NONE";
  const totalAgentsValue = loading ? "..." : String(agents.length);
  const runningValue = loading ? "..." : String(runningAgents);

  const stats = [
    { value: planValue, label: "Plan", color: "var(--teal)", icon: CreditCard },
    { value: billingValue, label: "Billing Status", color: "var(--gold)", icon: Sparkles },
    { value: totalAgentsValue, label: "Total Agents", color: "var(--orange)", icon: Layers3 },
    { value: runningValue, label: "Running", color: "var(--blue)", icon: Bot },
  ];

  return (
    <>
      <Header title="Dashboard" description="Login > plan purchase > agent deployment on ECS" />
      <div className="page-container vf-home">
        <section className="vf-home-hero vf-card">
          <div className="vf-home-hero-glow" />
          <div className="vf-home-hero-top">
            <span className="vf-home-chip">Control Center</span>
            <span className={`vf-home-chip ${canCreateAgent ? "is-success" : "is-warning"}`}>
              {canCreateAgent ? "Runtime Enabled" : "Activation Needed"}
            </span>
          </div>
          <div className="vf-home-hero-main">
            <div>
              <h2 className="vf-home-hero-title">Ship agents with fewer clicks and clearer state.</h2>
              <p className="vf-home-hero-copy">
                Provision new runtimes, track orchestration progress, and keep delivery quality high across the
                venture pipeline.
              </p>
            </div>
            <div className="vf-home-hero-actions">
              <Link href="/create" className="vf-button-primary">
                {canCreateAgent ? "Create Agent" : "Activate Plan"}
                <ArrowRight size={14} />
              </Link>
              <Link href="/agents" className="vf-button-secondary">
                View Runtime
              </Link>
            </div>
          </div>
        </section>

        <div className="vf-grid-4 vf-home-stats">
          {stats.map((s) => (
            <div key={s.label} className="vf-card vf-card-pad vf-home-stat">
              <div className="vf-home-stat-top">
                <span className="vf-home-stat-label">{s.label}</span>
                <span className="vf-home-stat-icon" style={{ color: s.color }}>
                  <s.icon size={14} />
                </span>
              </div>
              <div className="vf-home-stat-value" style={{ color: s.color }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        <section className="vf-home-section">
          <div className="vf-home-section-head">
            <h2 className="vf-title">Quick Access</h2>
            <p className="vf-home-section-copy">Core actions to move from plan to deployed runtime.</p>
          </div>
          <div className="vf-grid-2 vf-home-actions">
          {QUICK_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
                <div className="vf-card vf-card-pad vf-home-action-card">
                  <div className="vf-home-action-head">
                    <span className="vf-home-action-icon" style={{ color: link.color }}>
                      <link.icon size={16} />
                    </span>
                    <ArrowRight size={14} className="vf-home-action-arrow" />
                  </div>
                  <div style={{ fontSize: "var(--text-md)", fontWeight: 600, color: link.color, marginBottom: 4 }}>
                    {link.label}
                  </div>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>{link.desc}</div>
                </div>
            </Link>
          ))}
          </div>
        </section>

        <section className="vf-grid-2 vf-home-section">
          <div className="vf-card vf-card-pad vf-home-flow">
            <h3 className="vf-title">Execution Flow</h3>
            <div className="vf-home-flow-list">
              <div className="vf-home-flow-item">
                <CheckCircle2 size={14} color="var(--teal)" />
                <span>Authenticate with Google SSO</span>
              </div>
              <div className="vf-home-flow-item">
                <CreditCard size={14} color="var(--gold)" />
                <span>Choose a plan and confirm billing</span>
              </div>
              <div className="vf-home-flow-item">
                <Rocket size={14} color="var(--blue)" />
                <span>Create agent and deploy to ECS runtime</span>
              </div>
            </div>
            <Link href="/create" className="vf-button-secondary vf-home-flow-cta">
              Start Flow
            </Link>
          </div>

          <div className="vf-card vf-card-pad vf-home-runtime">
            <div className="vf-home-runtime-head">
              <h3 className="vf-title">Runtime Pulse</h3>
              <span className="vf-home-chip">{agents.length} total</span>
            </div>
            <div className="vf-home-runtime-grid">
              <div>
                <span>Running</span>
                <strong>{runningAgents}</strong>
              </div>
              <div>
                <span>Queued</span>
                <strong>{queuedAgents}</strong>
              </div>
              <div>
                <span>Failed</span>
                <strong>{failedAgents}</strong>
              </div>
              <div>
                <span>Plan</span>
                <strong>{planValue}</strong>
              </div>
            </div>
            <div className="vf-home-runtime-note">
              {canCreateAgent ? (
                <>
                  <CheckCircle2 size={14} color="var(--teal)" />
                  Ready for new deployments
                </>
              ) : (
                <>
                  <CircleAlert size={14} color="var(--orange)" />
                  Activate billing to unlock create flow
                </>
              )}
            </div>
          </div>
        </section>

        <section className="vf-card vf-card-pad vf-home-bottom">
          <div>
            <div className="vf-kicker">Next recommended step</div>
            <h3 className="vf-title" style={{ marginTop: 8 }}>
              {canCreateAgent ? "Launch another agent from templates" : "Complete plan activation"}
            </h3>
            <p className="vf-muted" style={{ marginTop: 8 }}>
              {canCreateAgent
                ? "Use templates to spin up production-safe agents faster with repeatable defaults."
                : "Once your plan is active, provisioning is available immediately from the create page."}
            </p>
          </div>
          <div className="vf-home-bottom-meta">
            <span>
              <Clock3 size={14} />
              Last refresh: {loading ? "loading..." : "just now"}
            </span>
            <Link href={canCreateAgent ? "/templates" : "/create"} className="vf-button-primary">
              {canCreateAgent ? "Open Templates" : "Buy Plan + Create Agent"}
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
