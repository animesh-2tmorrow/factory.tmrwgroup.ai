"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { Network } from "lucide-react";

interface AgentOption {
  id: string;
  name: string;
  status: "QUEUED" | "PROVISIONING" | "RUNNING" | "FAILED" | "STOPPED";
  parentAgentId: string | null;
}

interface DelegationRow {
  id: string;
  name: string;
  parentAgentId: string | null;
  parentAgent: { id: string; name: string } | null;
  status: string;
}

export default function MultiAgentPage() {
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [rows, setRows] = useState<DelegationRow[]>([]);
  const [parentAgentId, setParentAgentId] = useState("");
  const [childAgentId, setChildAgentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [agentsRes, delegationRes] = await Promise.all([
        fetch("/api/agents", { cache: "no-store" }),
        fetch("/api/delegation", { cache: "no-store" }),
      ]);
      const [agentsBody, delegationBody] = await Promise.all([agentsRes.json(), delegationRes.json()]);
      if (!agentsBody.success) throw new Error(agentsBody.error || "Failed to load agents");
      if (!delegationBody.success) throw new Error(delegationBody.error || "Failed to load delegation");
      setAgents(agentsBody.data as AgentOption[]);
      setRows(delegationBody.data as DelegationRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load delegation");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function linkAgents() {
    if (!parentAgentId || !childAgentId) return;
    setError(null);
    try {
      const response = await fetch("/api/delegation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ parentAgentId, childAgentId }),
      });
      const body = await response.json();
      if (!body.success) throw new Error(body.error || "Failed to link agents");
      setParentAgentId("");
      setChildAgentId("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to link agents");
    }
  }

  async function unlink(childId: string) {
    setError(null);
    try {
      const response = await fetch("/api/delegation", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ childAgentId: childId }),
      });
      const body = await response.json();
      if (!body.success) throw new Error(body.error || "Failed to unlink agents");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlink agents");
    }
  }

  return (
    <>
      <Header title="Multi-Agent" description="Define parent/child delegation across your cloud agents" />
      <div className="page-container vf-section-stack">
        <div className="vf-card vf-card-pad">
          <div className="vf-title" style={{ marginBottom: "var(--space-3)" }}>Create Delegation Link</div>
          <div className="vf-grid-2" style={{ marginBottom: "var(--space-3)" }}>
            <select className="vf-select" value={parentAgentId} onChange={(e) => setParentAgentId(e.target.value)}>
              <option value="">Select parent agent</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} ({agent.status})
                </option>
              ))}
            </select>
            <select className="vf-select" value={childAgentId} onChange={(e) => setChildAgentId(e.target.value)}>
              <option value="">Select child agent</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} ({agent.status})
                </option>
              ))}
            </select>
          </div>
          <div className="vf-row" style={{ justifyContent: "flex-end" }}>
            <button className="vf-button-primary" onClick={() => void linkAgents()} disabled={!parentAgentId || !childAgentId}>
              <Network size={14} />
              Link
            </button>
          </div>
        </div>

        {error && <div className="vf-card vf-card-pad" style={{ borderColor: "var(--error)", color: "var(--error)" }}>{error}</div>}

        {loading ? (
          <div className="vf-muted">Loading delegation graph...</div>
        ) : (
          <div className="vf-table-wrap">
            <table className="vf-table">
              <thead>
                <tr>
                  <th className="label">Child Agent</th>
                  <th className="label">Parent Agent</th>
                  <th className="label">Status</th>
                  <th className="label">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="value">{row.name}</td>
                    <td className="value">{row.parentAgent?.name ?? "n/a"}</td>
                    <td className="value">{row.status}</td>
                    <td className="value">
                      <button className="vf-button-ghost" onClick={() => void unlink(row.id)}>
                        Unlink
                      </button>
                    </td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td className="value" colSpan={4}>
                      No delegation links yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
