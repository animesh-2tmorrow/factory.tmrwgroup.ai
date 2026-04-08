"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { PlugZap, Send, Trash2 } from "lucide-react";

interface ConnectionRow {
  id: string;
  name: string;
  endpointUrl: string;
  enabled: boolean;
  project: { id: string; name: string } | null;
}

export default function IntegrationsPage() {
  const [rows, setRows] = useState<ConnectionRow[]>([]);
  const [name, setName] = useState("");
  const [endpointUrl, setEndpointUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [relayOutput, setRelayOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/a2a/connections", { cache: "no-store" });
      const body = await response.json();
      if (!body.success) throw new Error(body.error || "Failed to load A2A connections");
      setRows(body.data as ConnectionRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load A2A connections");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createConnection() {
    if (!name.trim() || !endpointUrl.trim()) return;
    setError(null);
    try {
      const response = await fetch("/api/a2a/connections", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim(), endpointUrl: endpointUrl.trim() }),
      });
      const body = await response.json();
      if (!body.success) throw new Error(body.error || "Failed to create connection");
      setName("");
      setEndpointUrl("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create connection");
    }
  }

  async function remove(row: ConnectionRow) {
    if (!window.confirm(`Delete "${row.name}"?`)) return;
    setError(null);
    try {
      const response = await fetch(`/api/a2a/connections/${row.id}`, { method: "DELETE" });
      const body = await response.json();
      if (!body.success) throw new Error(body.error || "Failed to delete connection");
      setRows((prev) => prev.filter((item) => item.id !== row.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete connection");
    }
  }

  async function relay(row: ConnectionRow) {
    setError(null);
    setRelayOutput(null);
    try {
      const response = await fetch("/api/a2a/relay", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          connectionId: row.id,
          payload: {
            type: "ping",
            source: "factory.tmrwgroup.ai",
            timestamp: new Date().toISOString(),
          },
        }),
      });
      const body = await response.json();
      if (!body.success) throw new Error(body.error || "Relay failed");
      setRelayOutput(JSON.stringify(body.data, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Relay failed");
    }
  }

  return (
    <>
      <Header title="Integrations" description="A2A links, MCP hardening, and cross-agent relay controls" />
      <div className="page-container vf-section-stack">
        <div className="vf-card vf-card-pad">
          <div className="vf-title" style={{ marginBottom: "var(--space-2)" }}>A2A Connection</div>
          <div className="vf-grid-2" style={{ marginBottom: "var(--space-3)" }}>
            <input className="vf-input" placeholder="Connection name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="vf-input" placeholder="https://remote-agent-host/api/a2a" value={endpointUrl} onChange={(e) => setEndpointUrl(e.target.value)} />
          </div>
          <div className="vf-row" style={{ justifyContent: "flex-end" }}>
            <button className="vf-button-primary" onClick={() => void createConnection()} disabled={!name.trim() || !endpointUrl.trim()}>
              <PlugZap size={14} />
              Save Connection
            </button>
          </div>
        </div>

        <div className="vf-card vf-card-pad">
          <div className="vf-title" style={{ marginBottom: "var(--space-2)" }}>MCP Security</div>
          <p className="vf-muted" style={{ fontSize: "var(--text-sm)" }}>
            Key-auth MCP calls now validate agent ownership server-side and reject user spoofing in request context.
          </p>
        </div>

        {error && <div className="vf-card vf-card-pad" style={{ borderColor: "var(--error)", color: "var(--error)" }}>{error}</div>}

        {loading ? (
          <div className="vf-muted">Loading integrations...</div>
        ) : (
          <div className="vf-section-stack">
            {rows.map((row) => (
              <div key={row.id} className="vf-card vf-card-pad">
                <div className="vf-row" style={{ justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
                  <div style={{ fontWeight: 600 }}>{row.name}</div>
                  <span className={`vf-badge ${row.enabled ? "vf-badge--teal" : "vf-badge--orange"}`}>{row.enabled ? "Enabled" : "Disabled"}</span>
                </div>
                <div className="vf-muted" style={{ fontSize: "var(--text-xs)" }}>{row.endpointUrl}</div>
                <div className="vf-row" style={{ justifyContent: "space-between", marginTop: "var(--space-3)" }}>
                  <button className="vf-button-ghost" onClick={() => void relay(row)}>
                    <Send size={14} />
                    Test Relay
                  </button>
                  <button className="vf-button-ghost" style={{ color: "var(--error)" }} onClick={() => void remove(row)}>
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {!rows.length && <div className="vf-card vf-card-pad vf-muted">No A2A connections yet.</div>}
          </div>
        )}

        {relayOutput && (
          <div className="vf-card vf-card-pad">
            <div className="vf-kicker" style={{ marginBottom: "var(--space-2)" }}>Relay Output</div>
            <pre className="vf-code-block" style={{ padding: "var(--space-3)", margin: 0 }}>
              {relayOutput}
            </pre>
          </div>
        )}
      </div>
    </>
  );
}
