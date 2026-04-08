"use client";

import { useEffect, useState, useCallback, useRef, FormEvent, DragEvent, ChangeEvent } from "react";

/* ── colour tokens ── */
const PERSON_COLOR: Record<string, string> = {
  edward: "#D85A30", animesh: "#378ADD", james: "#1D9E75",
  zach: "#7F77DD", ronnie: "#D4537E",
};
const PERSON_ROLE: Record<string, string> = {
  edward: "Conductor", animesh: "Infra", james: "Swarm Lead",
  zach: "Engineering", ronnie: "GTM",
};
const FACTORY_COLOR: Record<string, string> = {
  content: "#D97706", dev: "#2563EB", marketing: "#DB2777",
  ops: "#7C3AED", general: "#6B7280",
};
const STATUS_COLOR: Record<string, string> = {
  open: "#16A34A", claimed: "#D97706", in_progress: "#D97706",
  completed: "#16A34A", failed: "#DC2626", needs_review: "#EA580C",
};
const PRIORITY_LABEL: Record<string, string> = { critical: "!!", high: "!", medium: "", low: "" };

/* ── types ── */
interface Job {
  jobId: string; title: string; description: string; status: string;
  priority: string; createdBy: string; assignedTo: string;
  cityBlock: string; factory: string; createdAt: string;
  updatedAt: string; completedAt: string; tags: string[];
  autoExecute: boolean; attempts: number; output: string;
}
interface Stats {
  open: number; inProgress: number; completedToday: number;
  activeAgents: number;
  blockStats: Record<string, { jobs: number; active: number }>;
}
interface CsvJob {
  title: string; description: string; factory: string;
  priority: string; cityBlock: string;
}

/* ── password gate ── */
const COOKIE_NAME = "district_auth";

function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  function submit(e: FormEvent) {
    e.preventDefault();
    if (pw === "TmrwDistrict2026") {
      document.cookie = `${COOKIE_NAME}=1;path=/district;max-age=86400;SameSite=Lax`;
      onAuth();
    } else setErr("Wrong password");
  }
  return (
    <div style={gateWrap}>
      <form onSubmit={submit} style={gateBox}>
        <div style={{ fontSize: 14, letterSpacing: 1.5, color: "#9aa4b2", textTransform: "uppercase" }}>TMRW Group</div>
        <h1 style={{ margin: "8px 0 4px", fontSize: 22, fontWeight: 600, color: "#e6e8eb" }}>Factory District</h1>
        <p style={{ color: "#b4bcc7", fontSize: 14, marginBottom: 20 }}>Internal access only</p>
        <input value={pw} onChange={(e) => { setPw(e.target.value); setErr(""); }} type="password" placeholder="Password" style={gateInput} autoFocus />
        {err && <p style={{ color: "#DC2626", fontSize: 13, marginTop: 4 }}>{err}</p>}
        <button type="submit" style={gateBtn}>Enter</button>
      </form>
    </div>
  );
}

/* ── main dashboard ── */
export default function DistrictPage() {
  const [authed, setAuthed] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [toast, setToast] = useState("");
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  useEffect(() => { if (document.cookie.includes(COOKIE_NAME + "=1")) setAuthed(true); }, []);

  const fetchData = useCallback(async () => {
    try {
      const [jRes, sRes] = await Promise.all([fetch("/api/district/jobs"), fetch("/api/district/stats")]);
      const jData = await jRes.json();
      const sData = await sRes.json();
      if (jData.ok) setJobs(jData.jobs);
      if (sData.ok) setStats(sData.stats);
    } catch {}
  }, []);

  useEffect(() => {
    if (!authed) return;
    fetchData();
    const iv = setInterval(fetchData, 10_000);
    return () => clearInterval(iv);
  }, [authed, fetchData]);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  async function retryJob(j: Job) {
    await fetch("/api/district/jobs", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: j.jobId, createdAt: j.createdAt, status: "open", assignedTo: "unassigned", output: "{}" }),
    });
    showToast("Job reset to open - will re-execute");
    fetchData();
  }

  async function approveJob(j: Job) {
    await fetch("/api/district/jobs", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: j.jobId, createdAt: j.createdAt, status: "completed" }),
    });
    showToast("Job approved");
    fetchData();
  }

  function getJobOutput(j: Job) {
    try { return j.output && j.output !== "{}" ? JSON.parse(j.output) : null; } catch { return null; }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => showToast("Copied to clipboard"));
  }

  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />;
  const persons = ["edward", "animesh", "james", "zach", "ronnie"];

  return (
    <div style={pageWrap}>
      {/* toast */}
      {toast && <div style={toastStyle}>{toast}</div>}

      {/* header */}
      <header style={header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={liveDot} />
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#e6e8eb", margin: 0 }}>Factory District</h1>
        </div>
        <p style={subtitle}>tmrw-job-board &middot; us-east-1 &middot; live</p>
        <div style={headerActions}>
          <a
            href="https://factory.tmrwgroup.ai/dashboard"
            style={{ ...refreshBtn, textDecoration: "none" }}
          >
            Back to Factory
          </a>
          <button onClick={() => setShowBulk(true)} style={bulkBtn}>Bulk Add</button>
          <button onClick={() => setShowAdd(true)} style={addBtn}>+ Add Job</button>
          <button onClick={fetchData} style={refreshBtn}>Refresh</button>
        </div>
      </header>

      {/* metric cards */}
      <section style={metricGrid} data-metric-grid>
        <MetricCard label="Open" value={stats?.open ?? 0} color="#16A34A" />
        <MetricCard label="In Progress" value={stats?.inProgress ?? 0} color="#D97706" />
        <MetricCard label="Done Today" value={stats?.completedToday ?? 0} color="#2563EB" />
        <MetricCard label="Active Agents" value={stats?.activeAgents ?? 0} color="#7C3AED" />
      </section>

      {/* city blocks */}
      <section>
        <h2 style={sectionTitle}>City Blocks</h2>
        <div style={blockGrid} data-block-grid>
          {persons.map((p) => {
            const bs = stats?.blockStats?.[p];
            return (
              <div key={p} style={{ ...blockCard, borderTop: `3px solid ${PERSON_COLOR[p]}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600, fontSize: 15, color: "#e6e8eb", textTransform: "capitalize" }}>{p}</span>
                  <span style={{ fontSize: 11, color: "#9aa4b2", textTransform: "uppercase", letterSpacing: 0.8 }}>{PERSON_ROLE[p]}</span>
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 13, color: "#b4bcc7" }}>
                  <span><b style={{ color: PERSON_COLOR[p] }}>{bs?.active ?? 0}</b> active</span>
                  <span><b>{bs?.jobs ?? 0}</b> jobs</span>
                </div>
                <div style={progressTrack}>
                  <div style={{ ...progressBar, width: `${Math.min(100, (bs?.active ?? 0) * 33)}%`, background: PERSON_COLOR[p] }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* job board */}
      <section>
        <h2 style={sectionTitle}>Recent Jobs</h2>
        <div style={tableWrap} data-table-wrap>
          <table style={table}>
            <thead><tr>
              <th style={th}>Job</th><th style={th}>Factory</th><th style={th}>Block</th>
              <th style={th}>Status</th><th style={th}>Assigned</th><th style={th}>Priority</th>
            </tr></thead>
            <tbody>
              {jobs.map((j) => {
                const out = getJobOutput(j);
                const isExpanded = expandedJob === j.jobId;
                const hasOutput = out && out.content;
                return (
                  <tr key={j.jobId + j.createdAt} style={{ verticalAlign: "top" }}>
                    <td style={td} colSpan={hasOutput || j.status === "needs_review" ? undefined : undefined}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontWeight: 500, color: "#e6e8eb", flex: 1 }}>{j.title}</span>
                        {out?.validation?.score && <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: out.validation.score >= 7 ? "#16A34A18" : "#EA580C18", color: out.validation.score >= 7 ? "#16A34A" : "#EA580C" }}>{out.validation.score}/10</span>}
                        {j.attempts > 0 && <span style={{ fontSize: 10, color: "#9aa4b2" }}>x{j.attempts}</span>}
                      </div>
                      {hasOutput && (
                        <button onClick={() => setExpandedJob(isExpanded ? null : j.jobId)} style={{ background: "none", border: "none", color: "#2563EB", fontSize: 11, cursor: "pointer", padding: "4px 0 0", fontWeight: 500 }}>
                          {isExpanded ? "Hide output" : "View output"}
                        </button>
                      )}
                      {isExpanded && hasOutput && (
                        <div style={{ marginTop: 8, padding: 12, background: "#101318", border: "1px solid #2a3340", borderRadius: 8, fontSize: 13, lineHeight: 1.6, color: "#d6dbe2", whiteSpace: "pre-wrap", maxHeight: 300, overflow: "auto" }}>
                          {out.content}
                          <div style={{ display: "flex", gap: 6, marginTop: 10, borderTop: "1px solid #2a3340", paddingTop: 8 }}>
                            <button onClick={() => copyToClipboard(out.content)} style={{ ...smallBtn, background: "#86b8a8", color: "#0a0c0f" }}>Copy</button>
                            {j.status === "needs_review" && <button onClick={() => approveJob(j)} style={{ ...smallBtn, background: "#16A34A", color: "#fff" }}>Approve</button>}
                            <button onClick={() => retryJob(j)} style={{ ...smallBtn, border: "1px solid #2a3340" }}>Retry</button>
                            {out.elapsedSeconds && <span style={{ fontSize: 11, color: "#9aa4b2", marginLeft: "auto", alignSelf: "center" }}>{out.elapsedSeconds}s</span>}
                          </div>
                        </div>
                      )}
                      {!hasOutput && j.status === "needs_review" && (
                        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                          <button onClick={() => approveJob(j)} style={{ ...smallBtn, background: "#16A34A", color: "#fff" }}>Approve</button>
                          <button onClick={() => retryJob(j)} style={{ ...smallBtn, border: "1px solid #2a3340" }}>Retry</button>
                        </div>
                      )}
                    </td>
                    <td style={td}><Badge label={j.factory} color={FACTORY_COLOR[j.factory] ?? "#6B7280"} /></td>
                    <td style={td}><span style={{ textTransform: "capitalize", fontSize: 13 }}>{j.cityBlock}</span></td>
                    <td style={td}><Badge label={j.status.replace("_", " ")} color={STATUS_COLOR[j.status] ?? "#6B7280"} /></td>
                    <td style={td}><span style={{ textTransform: "capitalize", fontSize: 13, color: j.assignedTo === "unassigned" ? "#bbb" : PERSON_COLOR[j.assignedTo] ?? "#666", fontWeight: j.assignedTo !== "unassigned" ? 600 : 400 }}>{j.assignedTo === "unassigned" ? "\u2014" : j.assignedTo.replace("lambda-", "agent-")}</span></td>
                    <td style={td}><span style={{ color: j.priority === "critical" ? "#DC2626" : j.priority === "high" ? "#D97706" : "#999", fontWeight: j.priority === "critical" ? 700 : 400 }}>{j.priority}{PRIORITY_LABEL[j.priority]}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={mobileCards} data-mobile-cards>
          {jobs.map((j) => (
            <div key={j.jobId + j.createdAt} style={mobileCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: "#e6e8eb", flex: 1 }}>{j.title}</span>
                <Badge label={j.status.replace("_", " ")} color={STATUS_COLOR[j.status] ?? "#6B7280"} />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 12 }}>
                <Badge label={j.factory} color={FACTORY_COLOR[j.factory] ?? "#6B7280"} />
                <span style={{ textTransform: "capitalize", color: "#b4bcc7" }}>{j.cityBlock}</span>
                <span style={{ marginLeft: "auto", textTransform: "capitalize", color: PERSON_COLOR[j.assignedTo] ?? "#999", fontWeight: 600 }}>{j.assignedTo === "unassigned" ? "\u2014" : j.assignedTo}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {showAdd && <AddJobModal onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); fetchData(); }} />}
      {showBulk && <BulkAddModal onClose={() => setShowBulk(false)} onCreated={(n) => { setShowBulk(false); fetchData(); showToast(`Added ${n} jobs to the board`); }} />}
    </div>
  );
}

/* ── shared small components ── */
function MetricCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={metricCard}>
      <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#9aa4b2", marginTop: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</div>
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, background: color + "18", color, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

/* ── Add single job modal (unchanged) ── */
function AddJobModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState(""); const [desc, setDesc] = useState("");
  const [factory, setFactory] = useState("general"); const [priority, setPriority] = useState("medium");
  const [block, setBlock] = useState("shared"); const [loading, setLoading] = useState(false);
  const [autoExec, setAutoExec] = useState(true);

  async function submit(e: FormEvent) {
    e.preventDefault(); if (!title.trim()) return; setLoading(true);
    try { await fetch("/api/district/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: title.trim(), description: desc.trim(), factory, priority, cityBlock: block, autoExecute: autoExec }) }); onCreated(); }
    catch { setLoading(false); }
  }
  return (
    <div style={modalOverlay} onClick={onClose}>
      <form style={modalBox} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px", color: "#e6e8eb" }}>Add Job</h2>
        <label style={formLabel}>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} style={formInput} autoFocus placeholder="Short task description" />
        <label style={formLabel}>Description</label>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} style={{ ...formInput, height: 80, resize: "vertical" }} placeholder="Full details..." />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={formLabel}>Factory</label><FactorySelect value={factory} onChange={setFactory} /></div>
          <div><label style={formLabel}>Priority</label><PrioritySelect value={priority} onChange={setPriority} /></div>
        </div>
        <label style={formLabel}>City Block</label><BlockSelect value={block} onChange={setBlock} />
        <label style={{ ...formLabel, marginTop: 12, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={autoExec} onChange={(e) => setAutoExec(e.target.checked)} style={{ width: 16, height: 16, accentColor: "#1a1a1a" }} />
          <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 500, color: "#b4bcc7" }}>Auto-execute with AI agent</span>
        </label>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button type="submit" disabled={loading} style={{ ...addBtn, flex: 1, opacity: loading ? 0.6 : 1 }}>{loading ? "Creating..." : "Create Job"}</button>
          <button type="button" onClick={onClose} style={{ ...refreshBtn, flex: 1 }}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

/* ── shared select helpers ── */
function FactorySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <select value={value} onChange={(e) => onChange(e.target.value)} style={formInput}><option value="general">General</option><option value="content">Content</option><option value="dev">Dev</option><option value="marketing">Marketing</option><option value="ops">Ops</option></select>;
}
function PrioritySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <select value={value} onChange={(e) => onChange(e.target.value)} style={formInput}><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>;
}
function BlockSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <select value={value} onChange={(e) => onChange(e.target.value)} style={formInput}><option value="shared">Shared</option><option value="edward">Edward</option><option value="animesh">Animesh</option><option value="james">James</option><option value="zach">Zach</option><option value="ronnie">Ronnie</option></select>;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   BULK ADD MODAL — paste / CSV / voice tabs
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
type BulkTab = "paste" | "csv" | "voice";

function BulkAddModal({ onClose, onCreated }: { onClose: () => void; onCreated: (n: number) => void }) {
  const [tab, setTab] = useState<BulkTab>("paste");
  const [factory, setFactory] = useState("general");
  const [priority, setPriority] = useState("medium");
  const [block, setBlock] = useState("shared");
  const [loading, setLoading] = useState(false);
  const [autoExec, setAutoExec] = useState(true);

  // paste state
  const [pasteText, setPasteText] = useState("");
  const pasteLines = pasteText.split("\n").map((l) => l.trim()).filter(Boolean);

  // csv state
  const [csvJobs, setCsvJobs] = useState<CsvJob[]>([]);
  const [csvFileName, setCsvFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // voice state
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [parsedVoice, setParsedVoice] = useState<string[]>([]);
  const [parsing, setParsing] = useState(false);
  const recognitionRef = useRef<any>(null);

  /* ── submit ── */
  async function submitBulk() {
    setLoading(true);
    try {
      let body: any;
      if (tab === "paste") {
        body = { titles: pasteLines, factory, priority, cityBlock: block, autoExecute: autoExec };
      } else if (tab === "csv") {
        body = { jobs: csvJobs.map((j) => ({
          title: j.title, description: j.description,
          factory: j.factory || factory, priority: j.priority || priority,
          cityBlock: j.cityBlock || block,
        })), autoExecute: autoExec };
      } else {
        body = { titles: parsedVoice, factory, priority, cityBlock: block, autoExecute: autoExec };
      }

      const res = await fetch("/api/district/jobs/bulk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.ok) onCreated(data.created);
      else setLoading(false);
    } catch { setLoading(false); }
  }

  const count = tab === "paste" ? pasteLines.length : tab === "csv" ? csvJobs.length : parsedVoice.length;

  /* ── CSV parsing ── */
  function parseCSV(text: string) {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];
    const headerRaw = lines[0].split(/[,\t]/);
    const header = headerRaw.map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
    const tIdx = header.findIndex((h) => h === "title");
    if (tIdx < 0) return [];
    const dIdx = header.findIndex((h) => h === "description");
    const fIdx = header.findIndex((h) => h === "factory");
    const pIdx = header.findIndex((h) => h === "priority");
    const bIdx = header.findIndex((h) => h === "cityblock" || h === "city_block");

    const sep = lines[0].includes("\t") ? "\t" : ",";
    const result: CsvJob[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(sep).map((c) => c.trim().replace(/^["']|["']$/g, ""));
      const title = cols[tIdx]?.trim();
      if (!title) continue;
      result.push({
        title,
        description: dIdx >= 0 ? cols[dIdx] ?? "" : "",
        factory: fIdx >= 0 ? cols[fIdx] ?? "" : "",
        priority: pIdx >= 0 ? cols[pIdx] ?? "" : "",
        cityBlock: bIdx >= 0 ? cols[bIdx] ?? "" : "",
      });
    }
    return result;
  }

  function handleFile(file: File | undefined) {
    if (!file) return;
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setCsvJobs(parsed);
    };
    reader.readAsText(file);
  }

  function downloadTemplate() {
    const csv = "title,description,factory,priority,cityBlock\nWrite LinkedIn post about agentic factories,,content,high,shared\nDesign GTC business cards,,marketing,high,ronnie\nRecord video walkthrough of dashboard,,content,medium,edward\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "factory-district-template.csv";
    a.click();
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith(".csv") || file.name.endsWith(".tsv"))) handleFile(file);
  }

  /* ── Voice ── */
  function startVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setTranscript("Speech recognition not supported in this browser."); return; }
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    let final = "";
    recognition.onresult = (ev: any) => {
      let interim = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) final += ev.results[i][0].transcript + " ";
        else interim += ev.results[i][0].transcript;
      }
      setTranscript(final + interim);
    };
    recognition.onerror = () => setRecording(false);
    recognition.onend = () => setRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
    setRecording(true);
    setTranscript("");
    setParsedVoice([]);
  }

  function stopVoice() {
    recognitionRef.current?.stop();
    setRecording(false);
  }

  async function parseTranscript() {
    if (!transcript.trim()) return;
    setParsing(true);
    try {
      const res = await fetch("/api/district/jobs/parse", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: transcript.trim() }),
      });
      const data = await res.json();
      setParsedVoice(data.jobs ?? [transcript.trim()]);
    } catch {
      setParsedVoice([transcript.trim()]);
    }
    setParsing(false);
  }

  /* ── render ── */
  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={{ ...modalBox, maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: "#e6e8eb" }}>Bulk Add Jobs</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#999", padding: 4 }}>&times;</button>
        </div>

        {/* tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
          {(["paste", "csv", "voice"] as BulkTab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ ...tabBtn, ...(tab === t ? tabBtnActive : {}) }}>
              {t === "paste" ? "Paste" : t === "csv" ? "CSV Upload" : "Voice"}
            </button>
          ))}
        </div>

        {/* ── paste tab ── */}
        {tab === "paste" && (
          <>
            <textarea
              value={pasteText} onChange={(e) => setPasteText(e.target.value)}
              placeholder="One job per line. Paste a list or type freely."
              style={{ ...formInput, height: 160, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
              autoFocus
            />
            {pasteLines.length > 0 && (
              <p style={{ fontSize: 13, color: "#b4bcc7", marginTop: 8 }}>
                <b>{pasteLines.length}</b> job{pasteLines.length !== 1 ? "s" : ""} detected
              </p>
            )}
          </>
        )}

        {/* ── csv tab ── */}
        {tab === "csv" && (
          <>
            <div
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              style={dropZone}
            >
              <input ref={fileRef} type="file" accept=".csv,.tsv" style={{ display: "none" }}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleFile(e.target.files?.[0])} />
              {csvFileName ? (
                <span style={{ color: "#16A34A", fontWeight: 600 }}>{csvFileName}</span>
              ) : (
                <>
                  <span style={{ fontSize: 24, marginBottom: 4 }}>&#128196;</span>
                  <span>Drop a CSV here, or click to upload</span>
                  <span style={{ fontSize: 11, color: "#aaa" }}>Columns: title, description, factory, priority, cityBlock</span>
                </>
              )}
            </div>
            <button onClick={downloadTemplate} style={{ ...linkBtn, marginTop: 8 }}>Download template</button>

            {csvJobs.length > 0 && (
              <>
                <p style={{ fontSize: 13, color: "#b4bcc7", margin: "12px 0 8px" }}>
                  <b>{csvJobs.length}</b> job{csvJobs.length !== 1 ? "s" : ""} found in CSV
                </p>
                <div style={{ maxHeight: 150, overflow: "auto", border: "1px solid #2a3340", borderRadius: 8 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead><tr>
                      <th style={previewTh}>Title</th><th style={previewTh}>Factory</th><th style={previewTh}>Priority</th>
                    </tr></thead>
                    <tbody>
                      {csvJobs.slice(0, 5).map((j, i) => (
                        <tr key={i}>
                          <td style={previewTd}>{j.title}</td>
                          <td style={previewTd}>{j.factory || <i style={{ color: "#bbb" }}>default</i>}</td>
                          <td style={previewTd}>{j.priority || <i style={{ color: "#bbb" }}>default</i>}</td>
                        </tr>
                      ))}
                      {csvJobs.length > 5 && <tr><td colSpan={3} style={{ ...previewTd, color: "#999", fontStyle: "italic" }}>+{csvJobs.length - 5} more...</td></tr>}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}

        {/* ── voice tab ── */}
        {tab === "voice" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              {!recording ? (
                <button onClick={startVoice} style={micBtn} title="Start recording">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                  <span style={{ marginLeft: 8 }}>Tap to record</span>
                </button>
              ) : (
                <button onClick={stopVoice} style={{ ...micBtn, background: "#DC2626", color: "#fff", borderColor: "#DC2626" }}>
                  <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#fff", marginRight: 8, animation: "pulse 1s infinite" }} />
                  Recording... tap to stop
                </button>
              )}
            </div>

            {transcript && (
              <>
                <div style={{ background: "#101318", border: "1px solid #2a3340", borderRadius: 8, padding: 12, fontSize: 13, color: "#d6dbe2", marginBottom: 8, maxHeight: 100, overflow: "auto", lineHeight: 1.5 }}>
                  &ldquo;{transcript}&rdquo;
                </div>
                {parsedVoice.length === 0 && !parsing && (
                  <button onClick={parseTranscript} style={{ ...addBtn, width: "100%" }}>Parse into jobs</button>
                )}
                {parsing && <p style={{ textAlign: "center", color: "#9aa4b2", fontSize: 13 }}>Parsing with AI...</p>}
              </>
            )}

            {parsedVoice.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#9aa4b2", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>Parsed jobs</p>
                {parsedVoice.map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "#bbb", minWidth: 18 }}>{i + 1}.</span>
                    <input value={t} onChange={(e) => { const copy = [...parsedVoice]; copy[i] = e.target.value; setParsedVoice(copy); }}
                      style={{ ...formInput, padding: "6px 10px", fontSize: 13 }} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── shared controls ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 16 }}>
          <div><label style={formLabel}>Factory</label><FactorySelect value={factory} onChange={setFactory} /></div>
          <div><label style={formLabel}>Priority</label><PrioritySelect value={priority} onChange={setPriority} /></div>
          <div><label style={formLabel}>City Block</label><BlockSelect value={block} onChange={setBlock} /></div>
        </div>
        <label style={{ ...formLabel, marginTop: 12, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={autoExec} onChange={(e) => setAutoExec(e.target.checked)} style={{ width: 16, height: 16, accentColor: "#1a1a1a" }} />
          <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 500, color: "#b4bcc7" }}>Auto-execute with AI agent</span>
        </label>

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={submitBulk} disabled={loading || count === 0}
            style={{ ...addBtn, flex: 1, opacity: loading || count === 0 ? 0.5 : 1 }}>
            {loading ? "Adding..." : `Add all ${count} job${count !== 1 ? "s" : ""}`}
          </button>
          <button onClick={onClose} style={{ ...refreshBtn, flex: 0 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   STYLES
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const pageWrap: React.CSSProperties = { maxWidth: 960, margin: "0 auto", padding: "24px 16px 80px", fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", background: "#0a0c0f", minHeight: "100vh", color: "#d6dbe2" };
const header: React.CSSProperties = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 24 };
const liveDot: React.CSSProperties = { width: 8, height: 8, borderRadius: "50%", background: "#16A34A", boxShadow: "0 0 6px #16A34A88", display: "inline-block" };
const subtitle: React.CSSProperties = { fontSize: 12, color: "#9aa4b2", fontFamily: "'JetBrains Mono', monospace", margin: 0, flex: "1 1 100%", order: 3 };
const headerActions: React.CSSProperties = { display: "flex", gap: 8, marginLeft: "auto" };
const addBtn: React.CSSProperties = { padding: "8px 16px", borderRadius: 8, border: "none", background: "#86b8a8", color: "#0a0c0f", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const bulkBtn: React.CSSProperties = { padding: "8px 16px", borderRadius: 8, border: "1.5px solid #2a3340", background: "#101318", color: "#d6dbe2", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const refreshBtn: React.CSSProperties = { padding: "8px 16px", borderRadius: 8, border: "1px solid #2a3340", background: "#101318", color: "#b4bcc7", fontSize: 13, fontWeight: 500, cursor: "pointer" };
const metricGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 };
const metricCard: React.CSSProperties = { background: "#101318", border: "0.5px solid #2a3340", borderRadius: 12, padding: "16px 20px" };
const sectionTitle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: "#9aa4b2", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 };
const blockGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 28, overflowX: "auto" };
const blockCard: React.CSSProperties = { background: "#101318", border: "0.5px solid #2a3340", borderRadius: 12, padding: "14px 16px", minWidth: 150 };
const progressTrack: React.CSSProperties = { height: 4, borderRadius: 2, background: "#202733", marginTop: 10, overflow: "hidden" };
const progressBar: React.CSSProperties = { height: "100%", borderRadius: 2, transition: "width 0.4s ease" };
const tableWrap: React.CSSProperties = { background: "#101318", border: "0.5px solid #2a3340", borderRadius: 12, overflow: "hidden" };
const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse" };
const th: React.CSSProperties = { textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6, color: "#9aa4b2", borderBottom: "1px solid #2a3340" };
const td: React.CSSProperties = { padding: "12px 14px", fontSize: 13, borderBottom: "1px solid #1d2430", color: "#b4bcc7" };
const mobileCards: React.CSSProperties = { display: "none" };
const mobileCard: React.CSSProperties = { background: "#101318", border: "0.5px solid #2a3340", borderRadius: 12, padding: "14px 16px", marginBottom: 8 };
const gateWrap: React.CSSProperties = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0c0f", fontFamily: "'DM Sans', system-ui, sans-serif" };
const gateBox: React.CSSProperties = { background: "#101318", border: "0.5px solid #2a3340", borderRadius: 16, padding: "40px 36px", textAlign: "center", maxWidth: 340, width: "100%" };
const gateInput: React.CSSProperties = { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #2a3340", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#0b0f14", color: "#e6e8eb" };
const gateBtn: React.CSSProperties = { width: "100%", marginTop: 12, padding: "10px", borderRadius: 8, border: "none", background: "#86b8a8", color: "#0a0c0f", fontSize: 14, fontWeight: 600, cursor: "pointer" };
const modalOverlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 };
const modalBox: React.CSSProperties = { background: "#101318", borderRadius: 16, padding: "28px 24px", width: "100%", maxWidth: 440, maxHeight: "90vh", overflow: "auto", border: "1px solid #2a3340" };
const formLabel: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "#9aa4b2", marginBottom: 4, marginTop: 0, textTransform: "uppercase", letterSpacing: 0.6 };
const formInput: React.CSSProperties = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #2a3340", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#0b0f14", color: "#e6e8eb" };
const tabBtn: React.CSSProperties = { padding: "6px 14px", borderRadius: 6, border: "1px solid #2a3340", background: "#0b0f14", color: "#9aa4b2", fontSize: 13, fontWeight: 500, cursor: "pointer" };
const tabBtnActive: React.CSSProperties = { background: "#86b8a8", color: "#0a0c0f", borderColor: "#86b8a8" };
const dropZone: React.CSSProperties = { border: "2px dashed #2a3340", borderRadius: 12, padding: "28px 16px", textAlign: "center", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, fontSize: 13, color: "#9aa4b2", transition: "border-color 0.2s" };
const linkBtn: React.CSSProperties = { background: "none", border: "none", color: "#2563EB", fontSize: 12, cursor: "pointer", textDecoration: "underline", padding: 0 };
const micBtn: React.CSSProperties = { display: "inline-flex", alignItems: "center", padding: "12px 24px", borderRadius: 12, border: "1.5px solid #2a3340", background: "#0b0f14", color: "#e6e8eb", fontSize: 14, fontWeight: 500, cursor: "pointer" };
const previewTh: React.CSSProperties = { textAlign: "left", padding: "6px 10px", fontSize: 11, fontWeight: 600, color: "#9aa4b2", borderBottom: "1px solid #2a3340", textTransform: "uppercase" };
const previewTd: React.CSSProperties = { padding: "6px 10px", fontSize: 12, borderBottom: "1px solid #1d2430", color: "#b4bcc7" };
const toastStyle: React.CSSProperties = { position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "#86b8a8", color: "#0a0c0f", padding: "10px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600, zIndex: 2000, boxShadow: "0 4px 20px rgba(0,0,0,0.25)" };
const smallBtn: React.CSSProperties = { padding: "4px 12px", borderRadius: 6, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer", background: "#0b0f14", color: "#b4bcc7" };
