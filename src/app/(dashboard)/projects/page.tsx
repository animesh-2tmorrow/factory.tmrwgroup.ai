"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { FolderKanban, Loader2, Plus, Trash2 } from "lucide-react";

interface ProjectRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  memoryIsolation: boolean;
  isArchived: boolean;
  createdAt: string;
  _count?: {
    agents: number;
    skills: number;
    memories: number;
    scheduledTasks: number;
  };
}

export default function ProjectsPage() {
  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/projects", { cache: "no-store" });
      const body = await response.json();
      if (!body.success) throw new Error(body.error || "Failed to load projects");
      setRows(body.data as ProjectRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createProject() {
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });
      const body = await response.json();
      if (!body.success) throw new Error(body.error || "Failed to create project");
      setName("");
      setDescription("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setSubmitting(false);
    }
  }

  async function archiveToggle(project: ProjectRow) {
    setError(null);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isArchived: !project.isArchived }),
      });
      const body = await response.json();
      if (!body.success) throw new Error(body.error || "Failed to update project");
      setRows((prev) => prev.map((item) => (item.id === project.id ? { ...item, isArchived: !item.isArchived } : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update project");
    }
  }

  async function remove(project: ProjectRow) {
    if (!window.confirm(`Delete project "${project.name}"?`)) return;
    setError(null);
    try {
      const response = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      const body = await response.json();
      if (!body.success) throw new Error(body.error || "Failed to delete project");
      setRows((prev) => prev.filter((item) => item.id !== project.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project");
    }
  }

  return (
    <>
      <Header title="Projects" description="Workspace isolation and context boundaries for cloud agents" />
      <div className="page-container vf-section-stack">
        <div className="vf-card vf-card-pad">
          <div className="vf-row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-4)" }}>
            <div style={{ flex: 1 }}>
              <div className="vf-title" style={{ marginBottom: "var(--space-2)" }}>Create Project</div>
              <div className="vf-muted" style={{ fontSize: "var(--text-sm)", marginBottom: "var(--space-4)" }}>
                Projects scope memories, skills, scheduler tasks, and runtime instructions.
              </div>
              <div className="vf-grid-2">
                <input className="vf-input" placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} />
                <input
                  className="vf-input"
                  placeholder="Description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <button className="vf-button-primary" disabled={submitting || !name.trim()} onClick={() => void createProject()}>
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Create
            </button>
          </div>
        </div>

        {error && (
          <div className="vf-card vf-card-pad" style={{ borderColor: "var(--error)", color: "var(--error)" }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="vf-muted">Loading projects...</div>
        ) : rows.length === 0 ? (
          <div className="vf-card vf-card-pad vf-muted">No projects yet. Create one to isolate agent workspaces and memory.</div>
        ) : (
          <div className="vf-grid-auto">
            {rows.map((row) => (
              <div key={row.id} className="vf-card vf-card-pad">
                <div className="vf-row" style={{ justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
                  <div className="vf-row">
                    <FolderKanban size={14} style={{ color: "var(--teal)" }} />
                    <div style={{ fontWeight: 600 }}>{row.name}</div>
                  </div>
                  {row.isArchived ? <span className="vf-badge vf-badge--orange">Archived</span> : <span className="vf-badge vf-badge--teal">Active</span>}
                </div>
                <div className="vf-muted" style={{ fontSize: "var(--text-xs)", marginBottom: "var(--space-3)" }}>
                  slug: {row.slug}
                </div>
                <p style={{ minHeight: 42, color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
                  {row.description || "No description"}
                </p>
                <div className="vf-muted" style={{ fontSize: "var(--text-xs)", marginTop: "var(--space-3)" }}>
                  agents {row._count?.agents ?? 0} • skills {row._count?.skills ?? 0} • memory {row._count?.memories ?? 0}
                </div>
                <div className="vf-row" style={{ marginTop: "var(--space-4)", justifyContent: "space-between" }}>
                  <button className="vf-button-ghost" onClick={() => void archiveToggle(row)}>
                    {row.isArchived ? "Unarchive" : "Archive"}
                  </button>
                  <button className="vf-button-ghost" style={{ color: "var(--error)" }} onClick={() => void remove(row)}>
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
