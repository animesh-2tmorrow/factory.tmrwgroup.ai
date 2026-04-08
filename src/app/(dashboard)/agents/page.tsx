"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import StatusPill from "@/components/shared/StatusPill";
import PlanModal from "@/components/onboarding/PlanModal";
import { useSubscription } from "@/hooks/useSubscription";
import { PUBLIC_RUNTIME_LABEL } from "@/lib/runtime-brand";
import {
  Bot,
  Clock,
  Cpu,
  MessageSquare,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

function friendlyModelName(raw: string | null): string | null {
  if (!raw) return null;
  const l = raw.toLowerCase();
  if (l.includes("sonnet-4-5") || l.includes("sonnet-4.5")) return "Claude Sonnet 4.5";
  if (l.includes("sonnet-4-6") || l.includes("sonnet-4.6")) return "Claude Sonnet 4.6";
  if (l.includes("opus-4-6") || l.includes("opus-4.6")) return "Claude Opus 4.6";
  if (l.includes("haiku-4-5") || l.includes("haiku-4.5")) return "Claude Haiku 4.5";
  if (l.includes("sonnet")) return "Claude Sonnet";
  if (l.includes("opus")) return "Claude Opus";
  if (l.includes("haiku")) return "Claude Haiku";
  return raw;
}

type AgentStatus = "QUEUED" | "PROVISIONING" | "RUNNING" | "FAILED" | "STOPPED";

interface Agent {
  id: string;
  name: string;
  platform: "CLOUD";
  status: AgentStatus;
  instructions: string | null;
  inputConfig: {
    workspaceId?: string | null;
    channelId?: string | null;
    webhookUrl?: string | null;
  } | null;
  ecsTaskArn: string | null;
  ecsServiceArn: string | null;
  cloudChatEndpoint: string | null;
  modelName: string | null;
  lastError: string | null;
  createdAt: string;
}

const STATUS_ACCENT: Record<AgentStatus, string> = {
  RUNNING: "var(--teal)",
  PROVISIONING: "var(--blue)",
  QUEUED: "var(--gold)",
  FAILED: "var(--error)",
  STOPPED: "var(--text-muted)",
};

export default function AgentsPage() {
  const router = useRouter();
  const { hasPaidPlan } = useSubscription();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [planModalOpen, setPlanModalOpen] = useState(false);

  function handleNewAgent() {
    if (hasPaidPlan) {
      router.push("/create");
    } else {
      setPlanModalOpen(true);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/agents", { cache: "no-store" });
      const body = await response.json();
      if (!body.success) throw new Error(body.error || "Failed to load agents");
      setAgents(body.data as Agent[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load agents");
    }
    setLoading(false);
  }

  async function deleteAgent(agent: Agent) {
    const confirmed = window.confirm(`Delete agent "${agent.name}"? This removes chat history and usage logs.`);
    if (!confirmed) return;

    setDeletingId(agent.id);
    setError(null);
    try {
      const response = await fetch(`/api/agents/${agent.id}`, { method: "DELETE" });
      const body = await response.json();
      if (!body.success) throw new Error(body.error || "Failed to delete agent");
      setAgents((prev) => prev.filter((a) => a.id !== agent.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete agent");
    } finally {
      setDeletingId(null);
    }
  }

  const agentCount = agents.length;

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <>
      <Header title="Agents" description="Cloud agent runtime status" />
      <motion.div
        className="page-container vf-section-stack"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Top bar */}
        <div className="vf-row" style={{ justifyContent: "space-between" }}>
          <div className="vf-row">
            <h2 className="vf-title">{agentCount} Agent{agentCount !== 1 ? "s" : ""}</h2>
          </div>
          <div className="vf-row" style={{ gap: "var(--space-2)" }}>
            <button className="vf-button-ghost" onClick={() => void load()} title="Refresh">
              <RefreshCw size={14} />
            </button>
            <button className="vf-button-primary" onClick={handleNewAgent}>
              <Plus size={14} />
              New Agent
            </button>
          </div>
        </div>

        {error && (
          <div className="vf-card vf-card-pad" style={{ borderColor: "var(--error)", color: "var(--error)", fontSize: "var(--text-sm)" }}>
            {error}
          </div>
        )}

        {loading ? (
          <p className="vf-muted">Loading agents...</p>
        ) : agents.length === 0 ? (
          <div
            className="vf-card vf-card-pad"
            style={{
              textAlign: "center",
              padding: "var(--space-9) var(--space-6)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "var(--space-4)",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "var(--teal-dim)",
                border: "1px solid color-mix(in srgb, var(--teal) 30%, var(--border))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--teal)",
              }}
            >
              <Bot size={24} />
            </div>
            <div>
              <h3 className="vf-title">Deploy your first agent</h3>
              <p className="vf-muted" style={{ marginTop: "var(--space-2)" }}>
                Create a cloud agent to start chatting on the TMRW runtime.
              </p>
            </div>
            <button className="vf-button-primary" onClick={handleNewAgent}>
              <Plus size={14} />
              Create Agent
            </button>
          </div>
        ) : (
          <div className="vf-agent-grid">
            {agents.map((agent, i) => (
              <motion.div
                key={agent.id}
                className="vf-agent-card"
                style={{
                  "--card-accent": STATUS_ACCENT[agent.status],
                } as React.CSSProperties}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: 3,
                    background: STATUS_ACCENT[agent.status],
                    borderRadius: "var(--vf-radius-lg) 0 0 var(--vf-radius-lg)",
                  }}
                />

                <div className="vf-agent-card-header">
                  <div className="vf-agent-card-name">{agent.name}</div>
                  <StatusPill status={agent.status} />
                </div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: "var(--space-1)" }}>
                  ID: {agent.id}
                </div>


                <div className="vf-agent-card-meta">
                  <span className="vf-badge vf-badge--blue" style={{ fontSize: "0.7rem" }}>
                    {PUBLIC_RUNTIME_LABEL}
                  </span>
                  {friendlyModelName(agent.modelName) && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "var(--text-xs)", color: "var(--teal)" }}>
                      <Cpu size={11} />
                      {friendlyModelName(agent.modelName)}
                    </span>
                  )}
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                    <Clock size={11} />
                    {timeAgo(agent.createdAt)}
                  </span>
                </div>

                <div className="vf-agent-card-desc">
                  {agent.instructions || "No runtime instructions provided."}
                </div>

                {agent.lastError && (
                  <p style={{ color: "var(--warning)", fontSize: "var(--text-xs)", margin: 0 }}>
                    {agent.lastError}
                  </p>
                )}

                <div className="vf-agent-card-actions">
                  <Link href={`/agents/${agent.id}/chat`} className="vf-button-primary" style={{ fontSize: "var(--text-sm)", padding: "6px 14px" }}>
                    <MessageSquare size={13} />
                    Open Chat
                  </Link>
                  <button
                    className="vf-button-ghost"
                    style={{ color: "var(--text-muted)", marginLeft: "auto" }}
                    onClick={() => void deleteAgent(agent)}
                    disabled={deletingId === agent.id}
                    title="Delete agent"
                  >
                    <Trash2 size={14} />
                    {deletingId === agent.id ? "..." : ""}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        <PlanModal isOpen={planModalOpen} onClose={() => setPlanModalOpen(false)} />
      </motion.div>
    </>
  );
}
