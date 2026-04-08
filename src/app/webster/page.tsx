"use client";

import Link from "next/link";

const TOOLS = [
  { category: "Read", items: ["List Programs", "List Smart Campaigns", "List Emails", "List Forms", "List Folders", "List Tokens", "Instance Info", "Email Templates", "LP Templates"] },
  { category: "Write", items: ["Create Program", "Clone Program", "Delete Program", "Create Smart Campaign", "Clone Smart Campaign", "Activate/Deactivate Campaign", "Create Email", "Clone Email", "Approve Email", "Send Test Email"] },
  { category: "Manage", items: ["Create Landing Page", "Clone Landing Page", "Approve Landing Page", "Clone Form", "Approve Form", "Create Folder", "Rename Folder", "Move Asset", "Create Token", "Delete Token"] },
  { category: "Audit", items: ["Health Audit", "Export Users", "Login History", "Audit Trail", "Export Fields"] },
];

const STEPS = [
  { n: "1", title: "Install", desc: "Download the Chrome extension and load it in your browser via chrome://extensions." },
  { n: "2", title: "Subscribe", desc: "Sign up at factory.tmrwgroup.ai and activate a Starter plan ($49/mo)." },
  { n: "3", title: "Create Agent", desc: "Create a webster-marketo agent in your dashboard. Copy the Agent ID." },
  { n: "4", title: "Connect", desc: "Open Marketo, press Ctrl+Shift+W, paste your Agent ID in Settings, and start talking." },
];

export default function WebsterPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0d0d0f", fontFamily: "DM Sans, system-ui, sans-serif", color: "#e8e4de" }}>
      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 32px", maxWidth: "1100px", margin: "0 auto", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "#e8e4de", fontWeight: 700, fontSize: "16px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2DD4BF" }} />
          Venture Factory
        </Link>
        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          <Link href="/watch/webster" style={{ fontSize: "13px", color: "#9b9590", textDecoration: "none" }}>Watch Demo</Link>
          <Link href="/download/webster" style={{ fontSize: "13px", color: "#2DD4BF", textDecoration: "none", fontWeight: 600 }}>Download</Link>
          <Link href="/login" style={{ fontSize: "13px", color: "#9b9590", textDecoration: "none" }}>Dashboard</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: "900px", margin: "0 auto", padding: "80px 24px 48px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(45,212,191,0.1)", color: "#2DD4BF", padding: "6px 14px", borderRadius: "100px", fontSize: "12px", fontWeight: 600, marginBottom: "24px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#2DD4BF" }} />
          Chrome Extension for Marketo
        </div>
        <h1 style={{ fontSize: "48px", fontWeight: 400, lineHeight: 1.15, marginBottom: "16px", fontFamily: "Instrument Serif, Georgia, serif" }}>
          <span style={{ background: "linear-gradient(135deg, #2DD4BF, #0ea5e9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Webster</span>
          {" "}is your AI-powered Marketo operations assistant.
        </h1>
        <p style={{ fontSize: "17px", color: "#9b9590", lineHeight: 1.6, maxWidth: "640px", margin: "0 auto 32px" }}>
          Built by TMRW Group. Webster embeds directly in your Marketo instance — 50+ tools for campaigns, emails, smart lists, tokens, and more.
          Just type what you need in plain English.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/download/webster" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "14px 32px", background: "#e8e4de", color: "#0d0d0f", borderRadius: "100px", textDecoration: "none", fontSize: "15px", fontWeight: 700 }}>
            Download for Chrome
          </Link>
          <Link href="/watch/webster" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "14px 32px", background: "transparent", color: "#e8e4de", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "100px", textDecoration: "none", fontSize: "15px", fontWeight: 600 }}>
            Watch Demo
          </Link>
        </div>
      </section>

      {/* How it Works */}
      <section style={{ maxWidth: "900px", margin: "0 auto", padding: "48px 24px" }}>
        <h2 style={{ textAlign: "center", fontSize: "28px", fontWeight: 400, fontFamily: "Instrument Serif, Georgia, serif", marginBottom: "32px" }}>How it Works</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
          {STEPS.map((s) => (
            <div key={s.n} style={{ padding: "24px 20px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(45,212,191,0.15)", color: "#2DD4BF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "13px", marginBottom: "12px" }}>{s.n}</div>
              <div style={{ fontSize: "15px", fontWeight: 600, marginBottom: "6px" }}>{s.title}</div>
              <div style={{ fontSize: "13px", color: "#9b9590", lineHeight: 1.5 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Tools */}
      <section style={{ maxWidth: "900px", margin: "0 auto", padding: "48px 24px" }}>
        <h2 style={{ textAlign: "center", fontSize: "28px", fontWeight: 400, fontFamily: "Instrument Serif, Georgia, serif", marginBottom: "8px" }}>50+ Marketo Tools</h2>
        <p style={{ textAlign: "center", fontSize: "14px", color: "#9b9590", marginBottom: "32px" }}>All execute directly in your browser — no middleware, no API keys needed for read operations.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
          {TOOLS.map((group) => (
            <div key={group.category} style={{ padding: "20px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#2DD4BF", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>{group.category}</div>
              {group.items.map((item) => (
                <div key={item} style={{ fontSize: "13px", color: "#9b9590", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>{item}</div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Example Prompts */}
      <section style={{ maxWidth: "700px", margin: "0 auto", padding: "48px 24px" }}>
        <h2 style={{ textAlign: "center", fontSize: "28px", fontWeight: 400, fontFamily: "Instrument Serif, Georgia, serif", marginBottom: "24px" }}>Just Ask</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[
            "How many programs are in this instance?",
            "List all my smart campaigns",
            "Create a new program called Q2 Webinar in folder 1042",
            "Clone email 1234 as Q2-Follow-Up",
            "Activate smart campaign 5678",
            "Run a health audit on this instance",
          ].map((prompt) => (
            <div key={prompt} style={{ padding: "12px 20px", borderRadius: "10px", background: "rgba(45,212,191,0.06)", border: "1px solid rgba(45,212,191,0.12)", fontSize: "14px", color: "#e8e4de", fontFamily: "monospace" }}>
              {prompt}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ textAlign: "center", padding: "64px 24px 80px" }}>
        <h2 style={{ fontSize: "32px", fontWeight: 400, fontFamily: "Instrument Serif, Georgia, serif", marginBottom: "16px" }}>Ready to automate your Marketo ops?</h2>
        <Link href="/download/webster" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "16px 36px", background: "#e8e4de", color: "#0d0d0f", borderRadius: "100px", textDecoration: "none", fontSize: "16px", fontWeight: 700 }}>
          Download Webster
        </Link>
        <p style={{ fontSize: "13px", color: "#6b6560", marginTop: "16px" }}>
          Free extension &middot; Starter plan $49/mo &middot; Built by TMRW Group
        </p>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "24px", textAlign: "center", color: "#6b6560", fontSize: "12px" }}>
        TMRW Group &middot; Venture Factory &middot; 2026
      </footer>
    </div>
  );
}
