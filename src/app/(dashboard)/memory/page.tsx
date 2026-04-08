"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { Database, Trash2 } from "lucide-react";

interface MemoryRow {
  id: string;
  kind: "NOTE" | "FACT" | "DECISION" | "SUMMARY" | "KNOWLEDGE";
  title: string | null;
  content: string;
  createdAt: string;
  project: { id: string; name: string } | null;
  agent: { id: string; name: string } | null;
}

const KINDS: Array<MemoryRow["kind"]> = ["NOTE", "FACT", "DECISION", "SUMMARY", "KNOWLEDGE"];

export default function MemoryPage() {
  const [rows, setRows] = useState<MemoryRow[]>([]);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<MemoryRow["kind"]>("NOTE");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/memory?take=120", { cache: "no-store" });
      const body = await response.json();
      if (!body.success) throw new Error(body.error || "Failed to load memory");
      setRows(body.data as MemoryRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load memory");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    if (!content.trim()) return;
    setError(null);
    try {
      const response = await fetch("/api/memory", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind,
          title: title.trim() || undefined,
          content: content.trim(),
        }),
      });
      const body = await response.json();
      if (!body.success) throw new Error(body.error || "Failed to save memory entry");
      setTitle("");
      setContent("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save memory entry");
    }
  }

  async function remove(row: MemoryRow) {
    if (!window.confirm("Delete this memory entry?")) return;
    setError(null);
    try {
      const response = await fetch(`/api/memory/${row.id}`, { method: "DELETE" });
      const body = await response.json();
      if (!body.success) throw new Error(body.error || "Failed to delete memory entry");
      setRows((prev) => prev.filter((entry) => entry.id !== row.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete memory entry");
    }
  }

  return (
    <>
      <Header title="Memory" description="Persistent operator notes and model recall summaries" />
      <div className="page-container vf-section-stack">
        <div className="vf-card vf-card-pad">
          <div className="vf-row" style={{ justifyContent: "space-between", marginBottom: "var(--space-3)" }}>
            <div className="vf-title">Write Memory Entry</div>
            <span className="vf-badge vf-badge--teal">Persistent</span>
          </div>
          <div className="vf-grid-2" style={{ marginBottom: "var(--space-3)" }}>
            <input className="vf-input" placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
            <select className="vf-select" value={kind} onChange={(e) => setKind(e.target.value as MemoryRow["kind"])}>
              {KINDS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <textarea className="vf-textarea" placeholder="Write the memory note..." value={content} onChange={(e) => setContent(e.target.value)} />
          <div className="vf-row" style={{ justifyContent: "flex-end", marginTop: "var(--space-3)" }}>
            <button className="vf-button-primary" onClick={() => void save()} disabled={!content.trim()}>
              <Database size={14} />
              Save Entry
            </button>
          </div>
        </div>

        {error && <div className="vf-card vf-card-pad" style={{ borderColor: "var(--error)", color: "var(--error)" }}>{error}</div>}

        {loading ? (
          <div className="vf-muted">Loading memory entries...</div>
        ) : (
          <div className="vf-section-stack">
            {rows.map((row) => (
              <div key={row.id} className="vf-card vf-card-pad">
                <div className="vf-row" style={{ justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
                  <div className="vf-row">
                    <span className="vf-badge vf-badge--blue">{row.kind}</span>
                    <div style={{ fontWeight: 600 }}>{row.title || "Untitled memory"}</div>
                  </div>
                  <button className="vf-button-ghost" style={{ color: "var(--error)" }} onClick={() => void remove(row)}>
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
                <p style={{ color: "var(--text-secondary)", whiteSpace: "pre-wrap", fontSize: "var(--text-sm)" }}>{row.content}</p>
                <div className="vf-muted" style={{ marginTop: "var(--space-3)", fontSize: "var(--text-xs)" }}>
                  {row.project ? `project ${row.project.name} • ` : ""}
                  {row.agent ? `agent ${row.agent.name} • ` : ""}
                  {new Date(row.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
            {!rows.length && <div className="vf-card vf-card-pad vf-muted">No memory entries yet.</div>}
          </div>
        )}
      </div>
    </>
  );
}
