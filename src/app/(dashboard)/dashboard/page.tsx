"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import RuntimePulse from "@/components/dashboard/RuntimePulse";
import ExecutionPipeline from "@/components/dashboard/ExecutionPipeline";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import PlanModal from "@/components/onboarding/PlanModal";
import { useSubscription } from "@/hooks/useSubscription";
import {
  ArrowRight,
  Bot,
  Clock3,
  Globe,
  Rocket,
  Workflow,
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  status: "QUEUED" | "PROVISIONING" | "RUNNING" | "FAILED" | "STOPPED";
}

const QUICK_LINKS = [
  {
    label: "New Agent",
    href: "/create",
    desc: "Choose plan and launch a cloud runtime",
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
    label: "District",
    href: "/district",
    desc: "Review execution jobs and approval state",
    color: "var(--gold)",
    icon: Workflow,
    openInNewTab: true,
  },
  {
    label: "Collective",
    href: "/collective",
    desc: "Public builder marketplace and intake",
    color: "var(--orange)",
    icon: Globe,
    openInNewTab: true,
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { subscription, hasPaidPlan, loading: subLoading } = useSubscription();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [planModalOpen, setPlanModalOpen] = useState(false);

  useEffect(() => {
    void loadAgents();
  }, []);

  async function loadAgents() {
    setAgentsLoading(true);
    try {
      const response = await fetch("/api/agents", { cache: "no-store" });
      const body = await response.json();
      if (body.success) {
        setAgents(body.data as Agent[]);
      }
    } finally {
      setAgentsLoading(false);
    }
  }

  const loading = subLoading || agentsLoading;

  const runningAgents = useMemo(
    () => agents.filter((a) => a.status === "RUNNING" || a.status === "PROVISIONING").length,
    [agents]
  );
  const failedAgents = useMemo(() => agents.filter((a) => a.status === "FAILED").length, [agents]);
  const queuedAgents = useMemo(() => agents.filter((a) => a.status === "QUEUED").length, [agents]);

  const hasAuth = true;
  const hasAgent = agents.length > 0;

  function handleNewAgent() {
    if (hasPaidPlan) {
      router.push("/create");
    } else {
      setPlanModalOpen(true);
    }
  }

  // Build a mock activity feed from agent data
  const activityItems = useMemo(() => {
    return agents
      .slice(0, 5)
      .map((a) => ({
        id: a.id,
        time: "now",
        agent: a.name,
        action: a.status === "RUNNING" ? "is active" : a.status === "FAILED" ? "reported an error" : `is ${a.status.toLowerCase()}`,
      }));
  }, [agents]);

  return (
    <>
      <Header title="Command Center" description="Provision, monitor, and manage your AI agent fleet" />
      <motion.div
        className="page-container vf-section-stack"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Runtime Pulse Stats */}
        <RuntimePulse
          running={runningAgents}
          queued={queuedAgents}
          failed={failedAgents}
          plan={subscription?.plan ?? "FREE"}
          loading={loading}
        />

        {/* Execution Pipeline */}
        <div className="vf-card vf-card-pad">
          <h3 className="vf-title" style={{ marginBottom: "var(--space-2)" }}>Execution Flow</h3>
          <p className="vf-muted" style={{ fontSize: "var(--text-sm)" }}>
            Your path from authentication to deployed agent
          </p>
          <ExecutionPipeline hasAuth={hasAuth} hasPlan={hasPaidPlan} hasAgent={hasAgent} />
        </div>

        {/* Quick Access + Activity Feed */}
        <div className="vf-grid-2">
          {/* Quick Access */}
          <div className="vf-card vf-card-pad">
            <h3 className="vf-title" style={{ marginBottom: "var(--space-4)" }}>Quick Access</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
              {QUICK_LINKS.map((link, i) => {
                const isNewAgent = link.label === "New Agent";
                const card = (
                  <div
                    className="vf-card vf-card-pad vf-glow-border"
                    style={{ cursor: "pointer", minHeight: 110 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "var(--space-2)",
                      }}
                    >
                      <span
                        className="vf-dash-stat-icon"
                        style={{ color: link.color }}
                      >
                        <link.icon size={15} />
                      </span>
                      <ArrowRight size={13} style={{ color: "var(--text-muted)" }} />
                    </div>
                    <div style={{ fontSize: "var(--text-md)", fontWeight: 600, color: link.color }}>
                      {link.label}
                    </div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 4 }}>
                      {link.desc}
                    </div>
                  </div>
                );

                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {isNewAgent ? (
                      <div onClick={handleNewAgent}>{card}</div>
                    ) : (
                      <Link
                        href={link.href}
                        target={link.openInNewTab ? "_blank" : undefined}
                        rel={link.openInNewTab ? "noopener noreferrer" : undefined}
                      >
                        {card}
                      </Link>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="vf-card vf-card-pad">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
              <h3 className="vf-title">Activity Feed</h3>
              <Link href="/agents" className="vf-button-ghost" style={{ fontSize: "var(--text-xs)" }}>
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <ActivityFeed items={activityItems} />
          </div>
        </div>

        {/* Next Step CTA */}
        <motion.div
          className="vf-card vf-card-pad"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "var(--space-4)",
            flexWrap: "wrap",
            borderColor: "color-mix(in srgb, var(--border-active) 85%, #6b7cff 15%)",
            background: "linear-gradient(145deg, rgba(14, 14, 17, 0.97), rgba(11, 11, 14, 0.97))",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div>
            <div className="vf-kicker">Next step</div>
            <h3 className="vf-title" style={{ marginTop: 6 }}>
              {hasPaidPlan ? "Launch another agent from templates" : "Complete plan activation"}
            </h3>
            <p className="vf-muted" style={{ marginTop: 6, fontSize: "var(--text-sm)" }}>
              {hasPaidPlan
                ? "Use templates to spin up production-safe agents faster with repeatable defaults."
                : "Once your plan is active, provisioning is available immediately from the create page."}
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "var(--space-2)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
              <Clock3 size={12} />
              {loading ? "loading..." : "just now"}
            </span>
            {hasPaidPlan ? (
              <Link href="/create" className="vf-button-primary">
                New Agent
                <ArrowRight size={14} />
              </Link>
            ) : (
              <button className="vf-button-primary" onClick={() => setPlanModalOpen(true)}>
                Activate Plan
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </motion.div>

        <PlanModal isOpen={planModalOpen} onClose={() => setPlanModalOpen(false)} />
      </motion.div>
    </>
  );
}
