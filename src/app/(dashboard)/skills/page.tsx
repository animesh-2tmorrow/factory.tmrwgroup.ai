"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { Sparkles, Trash2 } from "lucide-react";

interface ProjectOption {
  id: string;
  name: string;
}

interface SkillRow {
  id: string;
  name: string;
  slug: string;
  scope: "GLOBAL" | "PROJECT";
  description: string | null;
  content: string;
  isActive: boolean;
  project: { id: string; name: string } | null;
}

export default function SkillsPage() {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [skills, setSkills] = useState<SkillRow[]>([]);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [projectId, setProjectId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [skillsRes, projectsRes] = await Promise.all([
        fetch("/api/skills?includeInactive=true", { cache: "no-store" }),
        fetch("/api/projects", { cache: "no-store" }),
      ]);
      const [skillsBody, projectsBody] = await Promise.all([skillsRes.json(), projectsRes.json()]);
      if (!skillsBody.success) throw new Error(skillsBody.error || "Failed to load skills");
      if (!projectsBody.success) throw new Error(projectsBody.error || "Failed to load projects");
      setSkills(skillsBody.data as SkillRow[]);
      setProjects((projectsBody.data as Array<{ id: string; name: string }>).map((p) => ({ id: p.id, name: p.name })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load skills");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createSkill() {
    if (!name.trim() || !content.trim()) return;
    setError(null);
    try {
      const response = await fetch("/api/skills", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          content: content.trim(),
          projectId: projectId || undefined,
        }),
      });
      const body = await response.json();
      if (!body.success) throw new Error(body.error || "Failed to create skill");
      setName("");
      setContent("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create skill");
    }
  }

  async function toggle(skill: SkillRow) {
    setError(null);
    try {
      const response = await fetch(`/api/skills/${skill.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isActive: !skill.isActive }),
      });
      const body = await response.json();
      if (!body.success) throw new Error(body.error || "Failed to update skill");
      setSkills((prev) => prev.map((row) => (row.id === skill.id ? { ...row, isActive: !row.isActive } : row)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update skill");
    }
  }

  async function remove(skill: SkillRow) {
    if (!window.confirm(`Delete skill "${skill.name}"?`)) return;
    setError(null);
    try {
      const response = await fetch(`/api/skills/${skill.id}`, { method: "DELETE" });
      const body = await response.json();
      if (!body.success) throw new Error(body.error || "Failed to delete skill");
      setSkills((prev) => prev.filter((row) => row.id !== skill.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete skill");
    }
  }

  return (
    <>
      <Header title="Skills" description="Reusable skill blocks loaded into cloud-agent runtime context" />
      <div className="page-container vf-section-stack">
        <div className="vf-card vf-card-pad">
          <div className="vf-title" style={{ marginBottom: "var(--space-3)" }}>Add Skill</div>
          <div className="vf-grid-2" style={{ marginBottom: "var(--space-3)" }}>
            <input className="vf-input" placeholder="Skill name" value={name} onChange={(e) => setName(e.target.value)} />
            <select className="vf-select" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">Global skill (all projects)</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <textarea
            className="vf-textarea"
            placeholder="Instructional skill content (procedures, guardrails, commands, conventions)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="vf-row" style={{ justifyContent: "flex-end", marginTop: "var(--space-3)" }}>
            <button className="vf-button-primary" onClick={() => void createSkill()} disabled={!name.trim() || !content.trim()}>
              <Sparkles size={14} />
              Save Skill
            </button>
          </div>
        </div>

        {error && <div className="vf-card vf-card-pad" style={{ borderColor: "var(--error)", color: "var(--error)" }}>{error}</div>}

        {loading ? (
          <div className="vf-muted">Loading skills...</div>
        ) : (
          <div className="vf-grid-auto">
            {skills.map((skill) => (
              <div key={skill.id} className="vf-card vf-card-pad">
                <div className="vf-row" style={{ justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
                  <div className="vf-row">
                    <Sparkles size={14} style={{ color: "var(--gold)" }} />
                    <div style={{ fontWeight: 600 }}>{skill.name}</div>
                  </div>
                  <span className={`vf-badge ${skill.isActive ? "vf-badge--teal" : "vf-badge--orange"}`}>
                    {skill.isActive ? "Active" : "Disabled"}
                  </span>
                </div>
                <div className="vf-muted" style={{ fontSize: "var(--text-xs)", marginBottom: "var(--space-2)" }}>
                  {skill.scope} {skill.project ? `• ${skill.project.name}` : ""}
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", minHeight: 48 }}>
                  {skill.description || skill.content.slice(0, 140)}
                </p>
                <div className="vf-row" style={{ marginTop: "var(--space-4)", justifyContent: "space-between" }}>
                  <button className="vf-button-ghost" onClick={() => void toggle(skill)}>
                    {skill.isActive ? "Disable" : "Enable"}
                  </button>
                  <button className="vf-button-ghost" style={{ color: "var(--error)" }} onClick={() => void remove(skill)}>
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
