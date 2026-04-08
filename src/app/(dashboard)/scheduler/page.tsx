"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { CalendarClock, Trash2 } from "lucide-react";

interface TaskRow {
  id: string;
  title: string;
  instruction: string;
  cronExpr: string;
  timezone: string;
  status: "ACTIVE" | "PAUSED" | "FAILED";
  enabled: boolean;
  nextRunAt: string | null;
  agent: { id: string; name: string } | null;
  project: { id: string; name: string } | null;
}

export default function SchedulerPage() {
  const [rows, setRows] = useState<TaskRow[]>([]);
  const [title, setTitle] = useState("");
  const [instruction, setInstruction] = useState("");
  const [cronExpr, setCronExpr] = useState("0 * * * *");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/scheduler", { cache: "no-store" });
      const body = await response.json();
      if (!body.success) throw new Error(body.error || "Failed to load scheduler");
      setRows(body.data as TaskRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load scheduler");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createTask() {
    if (!title.trim() || !instruction.trim()) return;
    setError(null);
    try {
      const response = await fetch("/api/scheduler", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          instruction: instruction.trim(),
          cronExpr: cronExpr.trim(),
        }),
      });
      const body = await response.json();
      if (!body.success) throw new Error(body.error || "Failed to create task");
      setTitle("");
      setInstruction("");
      setCronExpr("0 * * * *");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    }
  }

  async function toggle(task: TaskRow) {
    setError(null);
    try {
      const response = await fetch(`/api/scheduler/${task.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: task.status === "ACTIVE" ? "PAUSED" : "ACTIVE",
          enabled: task.status !== "ACTIVE",
        }),
      });
      const body = await response.json();
      if (!body.success) throw new Error(body.error || "Failed to update task");
      setRows((prev) =>
        prev.map((row) =>
          row.id === task.id ? { ...row, status: task.status === "ACTIVE" ? "PAUSED" : "ACTIVE", enabled: task.status !== "ACTIVE" } : row
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    }
  }

  async function remove(task: TaskRow) {
    if (!window.confirm(`Delete scheduled task "${task.title}"?`)) return;
    setError(null);
    try {
      const response = await fetch(`/api/scheduler/${task.id}`, { method: "DELETE" });
      const body = await response.json();
      if (!body.success) throw new Error(body.error || "Failed to delete task");
      setRows((prev) => prev.filter((row) => row.id !== task.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
    }
  }

  return (
    <>
      <Header title="Scheduler" description="Recurring jobs for agent maintenance, reports, and automations" />
      <div className="page-container vf-section-stack">
        <div className="vf-card vf-card-pad">
          <div className="vf-title" style={{ marginBottom: "var(--space-3)" }}>Create Scheduled Task</div>
          <div className="vf-grid-2" style={{ marginBottom: "var(--space-3)" }}>
            <input className="vf-input" placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <input className="vf-input" placeholder="Cron expression" value={cronExpr} onChange={(e) => setCronExpr(e.target.value)} />
          </div>
          <textarea className="vf-textarea" placeholder="Instruction for the scheduled run" value={instruction} onChange={(e) => setInstruction(e.target.value)} />
          <div className="vf-row" style={{ justifyContent: "flex-end", marginTop: "var(--space-3)" }}>
            <button className="vf-button-primary" onClick={() => void createTask()} disabled={!title.trim() || !instruction.trim()}>
              <CalendarClock size={14} />
              Save Task
            </button>
          </div>
        </div>

        {error && <div className="vf-card vf-card-pad" style={{ borderColor: "var(--error)", color: "var(--error)" }}>{error}</div>}

        {loading ? (
          <div className="vf-muted">Loading scheduler...</div>
        ) : (
          <div className="vf-section-stack">
            {rows.map((row) => (
              <div key={row.id} className="vf-card vf-card-pad">
                <div className="vf-row" style={{ justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
                  <div className="vf-row">
                    <span className={`vf-badge ${row.status === "ACTIVE" ? "vf-badge--teal" : row.status === "PAUSED" ? "vf-badge--orange" : "vf-badge--pink"}`}>
                      {row.status}
                    </span>
                    <div style={{ fontWeight: 600 }}>{row.title}</div>
                  </div>
                  <button className="vf-button-ghost" style={{ color: "var(--error)" }} onClick={() => void remove(row)}>
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", marginBottom: "var(--space-2)" }}>{row.instruction}</p>
                <div className="vf-muted" style={{ fontSize: "var(--text-xs)" }}>
                  cron: {row.cronExpr} ({row.timezone}) {row.nextRunAt ? `• next ${new Date(row.nextRunAt).toLocaleString()}` : ""}
                </div>
                <div className="vf-row" style={{ justifyContent: "space-between", marginTop: "var(--space-3)" }}>
                  <span className="vf-muted" style={{ fontSize: "var(--text-xs)" }}>
                    {row.agent ? `agent ${row.agent.name}` : "no agent link"} {row.project ? `• project ${row.project.name}` : ""}
                  </span>
                  <button className="vf-button-ghost" onClick={() => void toggle(row)}>
                    {row.status === "ACTIVE" ? "Pause" : "Resume"}
                  </button>
                </div>
              </div>
            ))}
            {!rows.length && <div className="vf-card vf-card-pad vf-muted">No scheduled tasks yet.</div>}
          </div>
        )}
      </div>
    </>
  );
}
