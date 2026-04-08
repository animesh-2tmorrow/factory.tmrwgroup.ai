"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/layout/Header";
import PlanModal from "@/components/onboarding/PlanModal";
import { useSubscription } from "@/hooks/useSubscription";
import {
  DEFAULT_RUNTIME_PROFILE,
  RUNTIME_PROFILES,
  type RuntimeProfileId,
} from "@/lib/runtime-profiles";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  Cloud,
  FileText,
  Loader2,
  MessageSquare,
  Rocket,
} from "lucide-react";

type AgentStatus = "QUEUED" | "PROVISIONING" | "RUNNING" | "FAILED" | "STOPPED";

interface CreatedAgent {
  id: string;
  status: AgentStatus;
  lastError: string | null;
}

interface ProjectOption {
  id: string;
  name: string;
}

interface ExistingAgentOption {
  id: string;
  name: string;
}

const STEPS = [
  { label: "Configure", icon: FileText },
  { label: "Runtime", icon: Cloud },
  { label: "Deploy", icon: Rocket },
];

export default function CreatePage() {
  const router = useRouter();
  const { subscription, loading: subLoading, hasPaidPlan, refresh: refreshSubscription } = useSubscription();

  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [projectId, setProjectId] = useState("");
  const [parentAgentId, setParentAgentId] = useState("");
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [existingAgents, setExistingAgents] = useState<ExistingAgentOption[]>([]);
  const [runtimeProfile, setRuntimeProfile] = useState<RuntimeProfileId>(DEFAULT_RUNTIME_PROFILE);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdAgent, setCreatedAgent] = useState<CreatedAgent | null>(null);
  const [confirmingCheckout, setConfirmingCheckout] = useState(false);
  const runtimeChoices = useMemo(
    () => Object.values(RUNTIME_PROFILES),
    []
  );
  const selectedRuntime = RUNTIME_PROFILES[runtimeProfile];
  const confirmCheckout = useCallback(async (sessionId: string) => {
    setConfirmingCheckout(true);
    try {
      const response = await fetch("/api/billing/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const body = await response.json();
      if (body.success) {
        await refreshSubscription();
      }
    } catch {
      // proceed anyway
    } finally {
      setConfirmingCheckout(false);
      // Clean URL
      const cleaned = new URL(window.location.href);
      cleaned.searchParams.delete("checkout");
      cleaned.searchParams.delete("session_id");
      cleaned.searchParams.delete("simulated");
      window.history.replaceState({}, "", cleaned.toString());
    }
  }, [refreshSubscription]);

  // Handle Stripe redirect: ?checkout=success&session_id=...
  useEffect(() => {
    const url = new URL(window.location.href);
    const checkoutStatus = url.searchParams.get("checkout");
    const sessionId = url.searchParams.get("session_id");

    if (checkoutStatus === "success" && sessionId) {
      void confirmCheckout(sessionId);
    }
  }, [confirmCheckout]);

  // Open plan modal if no paid plan and not loading
  useEffect(() => {
    if (!subLoading && !hasPaidPlan && !confirmingCheckout) {
      setPlanModalOpen(true);
    }
  }, [subLoading, hasPaidPlan, confirmingCheckout]);

  useEffect(() => {
    if (!hasPaidPlan) return;
    let active = true;
    const loadScopeOptions = async () => {
      try {
        const [projectsRes, agentsRes] = await Promise.all([
          fetch("/api/projects", { cache: "no-store" }),
          fetch("/api/agents", { cache: "no-store" }),
        ]);
        const [projectsBody, agentsBody] = await Promise.all([projectsRes.json(), agentsRes.json()]);
        if (!active) return;
        if (projectsBody.success) {
          setProjects((projectsBody.data as Array<{ id: string; name: string }>).map((p) => ({ id: p.id, name: p.name })));
        }
        if (agentsBody.success) {
          setExistingAgents((agentsBody.data as Array<{ id: string; name: string }>).map((a) => ({ id: a.id, name: a.name })));
        }
      } catch {
        // non-blocking for create flow
      }
    };
    void loadScopeOptions();
    return () => {
      active = false;
    };
  }, [hasPaidPlan]);

  // Poll agent status after creation
  useEffect(() => {
    if (!createdAgent?.id) return;
    if (createdAgent.status === "RUNNING" || createdAgent.status === "FAILED") return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/agents/${createdAgent.id}`, { cache: "no-store" });
        const body = await response.json();
        if (body.success && body.data) {
          setCreatedAgent((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              status: body.data.status as AgentStatus,
              lastError: (body.data.lastError as string | null) ?? null,
            };
          });
        }
      } catch {
        // keep current state
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [createdAgent?.id, createdAgent?.status]);

  async function createAgent() {
    setCreating(true);
    setCreateError(null);
    setCreatedAgent(null);

    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          platform: "CLOUD",
          instructions: instructions || undefined,
          runtimeProfile,
          projectId: projectId || undefined,
          parentAgentId: parentAgentId || undefined,
        }),
      });

      const body = await response.json();
      if (!body.success) {
        throw new Error(body.error || "Failed to create agent");
      }

      setCreatedAgent({
        id: body.data.id as string,
        status: body.data.status as AgentStatus,
        lastError: (body.data.lastError as string | null) ?? null,
      });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create agent");
    } finally {
      setCreating(false);
    }
  }

  const canProceedStep0 = name.trim().length >= 2;
  const canProceedStep1 = Boolean(runtimeProfile);
  const canDeploy = canProceedStep0 && canProceedStep1;

  const completionPercent = useMemo(() => {
    if (!createdAgent) return 0;
    const map: Record<AgentStatus, number> = {
      QUEUED: 25,
      PROVISIONING: 60,
      RUNNING: 100,
      FAILED: 100,
      STOPPED: 0,
    };
    return map[createdAgent.status];
  }, [createdAgent]);

  if (subLoading || confirmingCheckout) {
    return (
      <>
        <Header title="New Agent" description="Configure and deploy a cloud agent" />
        <div className="page-container" style={{ display: "flex", justifyContent: "center", paddingTop: "var(--space-9)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", color: "var(--text-muted)" }}>
            <Loader2 size={18} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
            {confirmingCheckout ? "Confirming your plan..." : "Loading..."}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="New Agent" description="Configure and deploy a cloud agent" />
      <PlanModal isOpen={planModalOpen} onClose={() => setPlanModalOpen(false)} />

      <motion.div
        className="page-container vf-section-stack"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Stepper */}
        {!createdAgent && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "var(--space-2)",
              marginBottom: "var(--space-4)",
            }}
          >
            {STEPS.map((s, i) => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <button
                  onClick={() => { if (i < step) setStep(i); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 14px",
                    borderRadius: "var(--vf-radius-sm)",
                    border: "1px solid",
                    borderColor: i === step ? "var(--teal)" : i < step ? "color-mix(in srgb, var(--teal) 40%, var(--border))" : "var(--border)",
                    background: i === step ? "var(--teal-dim)" : "transparent",
                    color: i <= step ? "var(--text-primary)" : "var(--text-muted)",
                    fontSize: "var(--text-sm)",
                    fontWeight: i === step ? 600 : 400,
                    cursor: i < step ? "pointer" : "default",
                    transition: "all 0.2s ease",
                  }}
                >
                  {i < step ? (
                    <Check size={14} style={{ color: "var(--teal)" }} />
                  ) : (
                    <s.icon size={14} />
                  )}
                  {s.label}
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    style={{
                      width: 32,
                      height: 1,
                      background: i < step ? "var(--teal)" : "var(--border)",
                      transition: "background 0.3s ease",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {!createdAgent && step === 0 && (
            <motion.div
              key="step-0"
              className="vf-card vf-card-pad"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="vf-title" style={{ marginBottom: "var(--space-2)" }}>Configure Agent</h2>
              <p className="vf-muted" style={{ marginBottom: "var(--space-5)", fontSize: "var(--text-sm)" }}>
                Give your agent a name and instructions that define its behavior.
              </p>

              <div style={{ marginBottom: "var(--space-4)" }}>
                <label htmlFor="agent-name" className="vf-kicker" style={{ display: "block", marginBottom: "var(--space-2)" }}>
                  Agent Name
                </label>
                <input
                  id="agent-name"
                  className="vf-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. research-assistant, code-reviewer"
                />
              </div>

              <div style={{ marginBottom: "var(--space-5)" }}>
                <label htmlFor="agent-instructions" className="vf-kicker" style={{ display: "block", marginBottom: "var(--space-2)" }}>
                  Custom Instructions <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span>
                </label>
                <textarea
                  id="agent-instructions"
                  className="vf-textarea"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder={name.toLowerCase().includes("webster")
                    ? "e.g. Focus on the Etumos Dev instance. Always check program status before making changes."
                    : "e.g. Help with planning, research, and execution using tools when needed."}
                  rows={3}
                />
                <p style={{ marginTop: "var(--space-2)", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                  {name.toLowerCase().includes("webster")
                    ? "Webster agents automatically get Marketo tools and the full system prompt. Just add any custom behavior here — keep it short."
                    : "Short instructions that define custom behavior. The system prompt and tools are added automatically based on the agent name."}
                </p>
              </div>

              <div className="vf-grid-2" style={{ marginBottom: "var(--space-5)" }}>
                <div>
                  <label className="vf-kicker" style={{ display: "block", marginBottom: "var(--space-2)" }}>
                    Project Scope
                  </label>
                  <select className="vf-select" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                    <option value="">No project (global)</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="vf-kicker" style={{ display: "block", marginBottom: "var(--space-2)" }}>
                    Parent Agent (optional)
                  </label>
                  <select className="vf-select" value={parentAgentId} onChange={(e) => setParentAgentId(e.target.value)}>
                    <option value="">No parent</option>
                    {existingAgents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  className="vf-button-primary"
                  onClick={() => setStep(1)}
                  disabled={!canProceedStep0}
                >
                  Next: Runtime
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {!createdAgent && step === 1 && (
            <motion.div
              key="step-1"
              className="vf-card vf-card-pad"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="vf-title" style={{ marginBottom: "var(--space-2)" }}>Runtime Environment</h2>
              <p className="vf-muted" style={{ marginBottom: "var(--space-5)", fontSize: "var(--text-sm)" }}>
                Choose the runtime profile to control startup bootstrap and default tooling.
              </p>

              <div style={{ display: "grid", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
                {runtimeChoices.map((profile) => {
                  const active = profile.id === runtimeProfile;
                  return (
                    <button
                      key={profile.id}
                      type="button"
                      className="vf-card vf-card-pad"
                      onClick={() => setRuntimeProfile(profile.id)}
                      style={{
                        textAlign: "left",
                        borderColor: active
                          ? "color-mix(in srgb, var(--teal) 40%, var(--border))"
                          : "var(--border)",
                        background: active ? "var(--teal-dim)" : "var(--bg-elevated)",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                        <Cloud size={16} style={{ color: active ? "var(--teal)" : "var(--text-muted)" }} />
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{profile.label}</div>
                        {active && (
                          <span
                            style={{
                              marginLeft: "auto",
                              padding: "2px 8px",
                              borderRadius: "var(--vf-radius-sm)",
                              background: "color-mix(in srgb, var(--teal) 20%, transparent)",
                              color: "var(--teal)",
                              fontSize: "var(--text-xs)",
                              fontWeight: 600,
                            }}
                          >
                            Selected
                          </span>
                        )}
                      </div>
                      <div style={{ marginTop: "var(--space-2)", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                        {profile.summary}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div
                className="vf-card vf-card-pad"
                style={{
                  borderColor: "color-mix(in srgb, var(--teal) 40%, var(--border))",
                  background: "var(--teal-dim)",
                  marginBottom: "var(--space-5)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: "color-mix(in srgb, var(--teal) 15%, transparent)",
                      border: "1px solid color-mix(in srgb, var(--teal) 30%, transparent)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--teal)",
                    }}
                  >
                    <Cloud size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "var(--text-md)", color: "var(--text-primary)" }}>
                      {selectedRuntime.label}
                    </div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                      {selectedRuntime.summary}
                    </div>
                  </div>
                  <span
                    style={{
                      marginLeft: "auto",
                      padding: "2px 8px",
                      borderRadius: "var(--vf-radius-sm)",
                      background: "color-mix(in srgb, var(--teal) 20%, transparent)",
                      color: "var(--teal)",
                      fontSize: "var(--text-xs)",
                      fontWeight: 600,
                    }}
                  >
                    Selected
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                  {[
                    { label: "Runtime Profile", value: selectedRuntime.label },
                    { label: "Runtime", value: selectedRuntime.runtime },
                    { label: "Tools", value: selectedRuntime.toolsLabel },
                    { label: "Plan", value: subscription?.plan ?? "-" },
                  ].map((item) => (
                    <div key={item.label}>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{item.label}</div>
                      <div style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)", fontWeight: 500 }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedRuntime.id === "WEBSTER_EXTENSION" && (
                <div
                  style={{
                    marginBottom: "var(--space-5)",
                    padding: "var(--space-3)",
                    borderRadius: "var(--vf-radius-sm)",
                    border: "1px solid color-mix(in srgb, var(--teal) 25%, var(--border))",
                    background: "color-mix(in srgb, var(--teal) 6%, transparent)",
                    color: "var(--text-muted)",
                    fontSize: "var(--text-xs)",
                  }}
                >
                  Webster profile preloads <code>webster-chrome-extension</code> in <code>/workspace</code> at startup.
                  Configure task-level SSH key secrets to clone private repositories.
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button className="vf-button-ghost" onClick={() => setStep(0)}>
                  <ArrowLeft size={14} />
                  Back
                </button>
                <button className="vf-button-primary" onClick={() => setStep(2)} disabled={!canProceedStep1}>
                  Next: Review
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {!createdAgent && step === 2 && (
            <motion.div
              key="step-2"
              className="vf-card vf-card-pad"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="vf-title" style={{ marginBottom: "var(--space-2)" }}>Review & Deploy</h2>
              <p className="vf-muted" style={{ marginBottom: "var(--space-5)", fontSize: "var(--text-sm)" }}>
                Confirm the details below, then deploy your agent.
              </p>

              <div style={{ display: "grid", gap: "var(--space-3)", marginBottom: "var(--space-5)" }}>
                {[
                  { label: "Agent Name", value: name },
                  { label: "Platform", value: "Cloud Agent (ECS)" },
                  { label: "Project", value: projects.find((project) => project.id === projectId)?.name ?? "Global scope" },
                  { label: "Parent Agent", value: existingAgents.find((agent) => agent.id === parentAgentId)?.name ?? "None" },
                  { label: "Runtime Profile", value: selectedRuntime.label },
                  { label: "Instructions", value: instructions || "Default agent behavior" },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      padding: "var(--space-3)",
                      borderRadius: "var(--vf-radius-sm)",
                      border: "1px solid var(--border)",
                      background: "var(--bg-elevated)",
                    }}
                  >
                    <div className="vf-kicker" style={{ marginBottom: 4 }}>{item.label}</div>
                    <div
                      style={{
                        fontSize: "var(--text-sm)",
                        color: "var(--text-primary)",
                        whiteSpace: item.label === "Instructions" ? "pre-wrap" : undefined,
                      }}
                    >
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              {createError && (
                <div
                  style={{
                    padding: "var(--space-3)",
                    borderRadius: "var(--vf-radius-sm)",
                    background: "color-mix(in srgb, var(--error) 10%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--error) 30%, transparent)",
                    color: "var(--error)",
                    fontSize: "var(--text-sm)",
                    marginBottom: "var(--space-4)",
                  }}
                >
                  {createError}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button className="vf-button-ghost" onClick={() => setStep(1)}>
                  <ArrowLeft size={14} />
                  Back
                </button>
                <button
                  className="vf-button-primary"
                  onClick={() => void createAgent()}
                  disabled={!canDeploy || creating}
                >
                  {creating ? (
                    <>
                      <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Rocket size={14} />
                      Create and Deploy Agent
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Provisioning Status */}
          {createdAgent && (
            <motion.div
              key="provisioning"
              className="vf-card vf-card-pad"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
            >
              <div style={{ textAlign: "center", marginBottom: "var(--space-5)" }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    margin: "0 auto var(--space-4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      createdAgent.status === "RUNNING"
                        ? "var(--teal-dim)"
                        : createdAgent.status === "FAILED"
                          ? "color-mix(in srgb, var(--error) 10%, transparent)"
                          : "color-mix(in srgb, var(--blue) 10%, transparent)",
                    border: `1px solid ${
                      createdAgent.status === "RUNNING"
                        ? "color-mix(in srgb, var(--teal) 30%, transparent)"
                        : createdAgent.status === "FAILED"
                          ? "color-mix(in srgb, var(--error) 30%, transparent)"
                          : "color-mix(in srgb, var(--blue) 30%, transparent)"
                    }`,
                    color:
                      createdAgent.status === "RUNNING"
                        ? "var(--teal)"
                        : createdAgent.status === "FAILED"
                          ? "var(--error)"
                          : "var(--blue)",
                  }}
                >
                  {createdAgent.status === "RUNNING" ? (
                    <Check size={24} />
                  ) : createdAgent.status === "FAILED" ? (
                    <Bot size={24} />
                  ) : (
                    <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
                  )}
                </div>

                <h2 className="vf-title">
                  {createdAgent.status === "RUNNING"
                    ? "Agent Ready"
                    : createdAgent.status === "FAILED"
                      ? "Deployment Failed"
                      : "Deploying Agent..."}
                </h2>
                <p className="vf-muted" style={{ marginTop: "var(--space-2)" }}>
                  {createdAgent.status === "RUNNING"
                    ? "Your agent is deployed and ready for chat."
                    : createdAgent.status === "FAILED"
                      ? createdAgent.lastError || "Something went wrong during deployment."
                      : "Setting up cloud infrastructure. This may take a minute."}
                </p>
              </div>

              {/* Progress bar */}
              <div
                style={{
                  height: 8,
                  borderRadius: 999,
                  border: "1px solid var(--border)",
                  background: "rgba(255,255,255,0.04)",
                  overflow: "hidden",
                  marginBottom: "var(--space-4)",
                }}
              >
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: `${completionPercent}%` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    height: "100%",
                    background:
                      createdAgent.status === "FAILED"
                        ? "var(--error)"
                        : "linear-gradient(90deg, var(--teal), var(--blue))",
                    borderRadius: 999,
                  }}
                />
              </div>

              {/* Status label */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "var(--space-3)",
                  marginBottom: "var(--space-5)",
                }}
              >
                <span
                  style={{
                    padding: "4px 12px",
                    borderRadius: "var(--vf-radius-sm)",
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    background:
                      createdAgent.status === "RUNNING"
                        ? "var(--teal-dim)"
                        : createdAgent.status === "FAILED"
                          ? "color-mix(in srgb, var(--error) 10%, transparent)"
                          : "color-mix(in srgb, var(--blue) 10%, transparent)",
                    color:
                      createdAgent.status === "RUNNING"
                        ? "var(--teal)"
                        : createdAgent.status === "FAILED"
                          ? "var(--error)"
                          : "var(--blue)",
                  }}
                >
                  {createdAgent.status}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "center", gap: "var(--space-3)" }}>
                {createdAgent.status === "RUNNING" && (
                  <Link
                    href={`/agents/${createdAgent.id}/chat`}
                    className="vf-button-primary"
                  >
                    <MessageSquare size={14} />
                    Open Chat
                  </Link>
                )}
                <button
                  className="vf-button-ghost"
                  onClick={() => router.push("/agents")}
                >
                  View All Agents
                </button>
                {createdAgent.status === "FAILED" && (
                  <button
                    className="vf-button-ghost"
                    onClick={() => {
                      setCreatedAgent(null);
                      setStep(2);
                    }}
                  >
                    Try Again
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

