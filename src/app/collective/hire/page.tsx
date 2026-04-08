"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const builderOptions = [
  { value: "", label: "No preference" },
  { value: "edward", label: "Edward Unthank" },
  { value: "animesh", label: "Animesh" },
  { value: "james", label: "James" },
  { value: "zach", label: "Zach" },
  { value: "ronnie", label: "Ronnie" },
  { value: "chelsea", label: "Chelsea" },
];

const budgetOptions = [
  { value: "Starter $1k", label: "Starter — $1,000/mo" },
  { value: "Growth $3k", label: "Growth — $3,000/mo" },
  { value: "Scale $5k", label: "Scale — $5,000/mo" },
  { value: "Enterprise $10k", label: "Enterprise — $10,000/mo" },
];

const timelineOptions = [
  { value: "ASAP", label: "ASAP" },
  { value: "This month", label: "This month" },
  { value: "Next quarter", label: "Next quarter" },
  { value: "Exploring", label: "Just exploring" },
];

export default function HirePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh" }} />}>
      <HirePageInner />
    </Suspense>
  );
}

function HirePageInner() {
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    company: "",
    name: "",
    email: "",
    description: "",
    budget: "",
    builder: "",
    timeline: "",
    source: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const b = searchParams.get("builder") || "";
    const budget = searchParams.get("budget") || "";
    if (b || budget) {
      setForm((prev) => ({
        ...prev,
        builder: b || prev.builder,
        budget: budget
          ? budgetOptions.find((o) => o.value.toLowerCase().includes(budget.toLowerCase()))?.value || prev.budget
          : prev.budget,
      }));
    }
  }, [searchParams]);

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.company || !form.name || !form.email || !form.description || !form.budget) {
      setError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/collective/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    fontSize: 15,
    border: "1px solid #E8E4DE",
    borderRadius: 10,
    background: "#fff",
    fontFamily: "'DM Sans', sans-serif",
    color: "#1A1814",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#1A1814",
    marginBottom: 6,
  };

  /* ── Success state ── */
  if (success) {
    return (
      <>
        {/* Nav */}
        <nav className="coll-nav">
          <Link href="/collective" className="coll-nav-logo">
            <span className="dot" /> TMRW Collective
          </Link>
          <div className="coll-nav-links">
            <Link href="/collective#builders" className="coll-nav-link">Builders</Link>
            <Link href="/collective#pricing" className="coll-nav-link">Pricing</Link>
          </div>
        </nav>

        <section
          style={{
            maxWidth: 600,
            margin: "0 auto",
            padding: "120px 32px 80px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#E8F5E9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              fontSize: 28,
            }}
          >
            ✓
          </div>
          <h1
            className="coll-serif"
            style={{ fontSize: 32, fontWeight: 400, margin: "0 0 16px" }}
          >
            Thanks, {form.name.split(" ")[0]}!
          </h1>
          <p style={{ fontSize: 16, color: "#6B6560", lineHeight: 1.6, margin: "0 0 32px" }}>
            We've received your request. A builder from our collective will
            reach out within 24 hours to discuss your project.
          </p>
          <p style={{ fontSize: 14, color: "#6B6560", marginBottom: 32 }}>
            In the meantime, check out what we're building:
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="https://tmrwgroup.ai"
              style={{
                padding: "12px 28px",
                background: "#1A1814",
                color: "#fff",
                borderRadius: 100,
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Visit TMRW Group →
            </a>
            <Link
              href="/collective"
              style={{
                padding: "12px 28px",
                border: "1px solid #E8E4DE",
                color: "#1A1814",
                borderRadius: 100,
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Back to Collective
            </Link>
          </div>
        </section>
      </>
    );
  }

  /* ── Form ── */
  return (
    <>
      {/* Nav */}
      <nav className="coll-nav">
        <Link href="/collective" className="coll-nav-logo">
          <span className="dot" /> TMRW Collective
        </Link>
        <div className="coll-nav-links">
          <Link href="/collective#builders" className="coll-nav-link">Builders</Link>
          <Link href="/collective#pricing" className="coll-nav-link">Pricing</Link>
        </div>
        <button
          className="coll-nav-menu-btn"
          onClick={() => {}}
          aria-label="Menu"
          style={{ visibility: "hidden" }}
        >
          &nbsp;
        </button>
      </nav>

      <section style={{ maxWidth: 640, margin: "0 auto", padding: "60px 32px 80px" }}>
        <h1
          className="coll-serif"
          style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 400, margin: "0 0 8px" }}
        >
          Hire a builder
        </h1>
        <p style={{ fontSize: 16, color: "#6B6560", lineHeight: 1.6, margin: "0 0 40px" }}>
          Tell us about your project and we'll match you with the right builder
          within 24 hours.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <label style={labelStyle}>Company name *</label>
              <input
                style={inputStyle}
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
                placeholder="Acme Inc"
              />
            </div>
            <div>
              <label style={labelStyle}>Your name *</label>
              <input
                style={inputStyle}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Jane Smith"
              />
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <label style={labelStyle}>Email *</label>
            <input
              type="email"
              style={inputStyle}
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="jane@acme.com"
            />
          </div>

          <div style={{ marginTop: 20 }}>
            <label style={labelStyle}>What do you need? *</label>
            <textarea
              style={{ ...inputStyle, minHeight: 120, resize: "vertical" }}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Describe your project, goals, and timeline..."
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
            <div>
              <label style={labelStyle}>Budget tier *</label>
              <select
                style={inputStyle}
                value={form.budget}
                onChange={(e) => set("budget", e.target.value)}
              >
                <option value="">Select budget</option>
                {budgetOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Preferred builder</label>
              <select
                style={inputStyle}
                value={form.builder}
                onChange={(e) => set("builder", e.target.value)}
              >
                {builderOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
            <div>
              <label style={labelStyle}>Timeline</label>
              <select
                style={inputStyle}
                value={form.timeline}
                onChange={(e) => set("timeline", e.target.value)}
              >
                <option value="">Select timeline</option>
                {timelineOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>How did you hear about us?</label>
              <input
                style={inputStyle}
                value={form.source}
                onChange={(e) => set("source", e.target.value)}
                placeholder="Referral, event, etc."
              />
            </div>
          </div>

          {error && (
            <div
              style={{
                marginTop: 20,
                padding: "12px 16px",
                background: "#FFF3F0",
                border: "1px solid #FFD4C8",
                borderRadius: 10,
                color: "#C62828",
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: 32,
              width: "100%",
              padding: "16px 32px",
              background: submitting ? "#999" : "#FF6B35",
              color: "#fff",
              border: "none",
              borderRadius: 100,
              fontSize: 16,
              fontWeight: 600,
              cursor: submitting ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {submitting ? "Submitting..." : "Submit →"}
          </button>
        </form>
      </section>

      {/* Footer */}
      <footer className="coll-footer">
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF6B35", display: "inline-block", marginRight: 8, verticalAlign: "middle" }} />
        TMRW Collective · Tomorrow, Inc · 2026
      </footer>
    </>
  );
}
