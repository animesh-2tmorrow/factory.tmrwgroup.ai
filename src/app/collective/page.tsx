"use client";

import { useState } from "react";
import Link from "next/link";

/* ── Builder data ────────────────────────────────────────── */
const builders = [
  {
    id: "edward",
    name: "Edward Unthank",
    title: "Founder & Chief Strategist",
    specialty: "GTM Strategy, Revenue Operations, Marketing Automation",
    bio: "Former marketing operations leader turned AI-native founder. Built agentic systems that manage multi-channel marketing at scale. 15+ years in marketing technology, now building the future of AI-powered consulting.",
    skills: ["Go-to-Market Strategy", "Revenue Operations", "Marketing Automation", "Agentic Workflows", "ABM", "Sales Enablement"],
    agenticCapabilities: [
      "Multi-channel content generation swarm",
      "Automated competitive intelligence gathering",
      "Real-time campaign optimization agents",
      "Customer journey mapping and personalization",
    ],
    priceRange: "$5,000 – $10,000/mo",
    availability: "Limited" as const,
    color: "#D85A30",
  },
  {
    id: "animesh",
    name: "Animesh",
    title: "Infrastructure & DevOps Lead",
    specialty: "AWS Infrastructure, CI/CD, Cloud Architecture, AI Platform Engineering",
    bio: "Full-stack infrastructure engineer specializing in AWS cloud architecture and AI platform deployment. Builds the systems that make agentic swarms run at scale.",
    skills: ["AWS Architecture", "Docker/Kubernetes", "CI/CD Pipelines", "Database Design", "Security & IAM", "AI Platform Ops"],
    agenticCapabilities: [
      "Infrastructure-as-code deployment swarm",
      "Automated monitoring and self-healing agents",
      "Multi-region cloud orchestration",
      "Cost optimization and scaling agents",
    ],
    priceRange: "$3,000 – $8,000/mo",
    availability: "Available" as const,
    color: "#378ADD",
  },
  {
    id: "james",
    name: "James",
    title: "AI/ML Engineer & Researcher",
    specialty: "Machine Learning, AI Research, Data Science, Agent Architecture",
    bio: "AI researcher with novel contributions to the field. Designs and builds the agent architectures that power agentic swarms. Published researcher with hands-on engineering chops.",
    skills: ["Machine Learning", "NLP/LLM Engineering", "Agent Architecture", "Data Science", "Python/PyTorch", "Research"],
    agenticCapabilities: [
      "Custom model fine-tuning swarm",
      "Automated research and paper analysis agents",
      "Data pipeline and ETL agent fleet",
      "Evaluation and benchmarking automation",
    ],
    priceRange: "$3,000 – $8,000/mo",
    availability: "Available" as const,
    color: "#1D9E75",
  },
  {
    id: "zach",
    name: "Zach",
    title: "Engineering & Tooling",
    specialty: "Full-Stack Engineering, Developer Tools, Automation",
    bio: "Builder of tools that make builders faster. Specializes in developer experience, automation frameworks, and the internal tooling that accelerates entire teams.",
    skills: ["Full-Stack Development", "Developer Tools", "Automation", "API Design", "React/Node.js", "System Design"],
    agenticCapabilities: [
      "Automated code review and testing swarm",
      "CI/CD pipeline optimization agents",
      "Internal tool generation agents",
      "Documentation and knowledge base automation",
    ],
    priceRange: "$3,000 – $8,000/mo",
    availability: "Available" as const,
    color: "#7F77DD",
  },
  {
    id: "ronnie",
    name: "Ronnie",
    title: "Design & GTM",
    specialty: "Product Design, Design Systems, Go-to-Market, Brand",
    bio: "Designer who thinks in systems. Creates cohesive brand experiences and design systems that scale. Bridges the gap between product vision and market execution.",
    skills: ["Product Design", "Design Systems", "Brand Identity", "UI/UX", "Go-to-Market", "Creative Direction"],
    agenticCapabilities: [
      "Automated design asset generation swarm",
      "Brand consistency monitoring agents",
      "A/B testing and conversion optimization",
      "Multi-channel creative production",
    ],
    priceRange: "$3,000 – $8,000/mo",
    availability: "Available" as const,
    color: "#D4537E",
  },
  {
    id: "chelsea",
    name: "Chelsea",
    title: "Marketing & Content",
    specialty: "Content Strategy, Social Media, Thought Leadership, Community",
    bio: "Marketing strategist specializing in content-led growth. Builds content engines that generate qualified leads through authentic thought leadership and community building.",
    skills: ["Content Strategy", "Social Media", "SEO/SEM", "Email Marketing", "Community Building", "Analytics"],
    agenticCapabilities: [
      "Content generation and scheduling swarm",
      "Social listening and engagement agents",
      "SEO optimization and keyword research automation",
      "Lead scoring and nurture sequence agents",
    ],
    priceRange: "$1,000 – $5,000/mo",
    availability: "Available" as const,
    color: "#BA7517",
  },
];

const pricingTiers = [
  {
    name: "Starter",
    price: "$1,000",
    period: "/mo",
    features: ["1 builder", "10 hrs/week", "Weekly sync", "Slack access"],
    cta: "Get started",
    highlight: false,
  },
  {
    name: "Growth",
    price: "$3,000",
    period: "/mo",
    features: ["1 builder", "20 hrs/week", "Daily sync", "Slack access", "Priority SLA"],
    cta: "Get started",
    highlight: false,
  },
  {
    name: "Scale",
    price: "$5,000",
    period: "/mo",
    features: ["1–2 builders", "30 hrs/week", "Daily sync", "Slack access", "Priority SLA", "Agent access"],
    cta: "Get started",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "$10,000",
    period: "/mo",
    features: ["2+ builders", "Dedicated", "Daily sync", "Slack + calls", "Custom SLA", "Full swarm access"],
    cta: "Contact us",
    highlight: false,
  },
];

/* ── Components ──────────────────────────────────────────── */

function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <nav className="coll-nav">
        <a href="https://tmrwgroup.ai" className="coll-nav-logo">
          <span className="dot" /> TMRW Collective
        </a>
        <div className="coll-nav-links">
          <a href="https://factory.tmrwgroup.ai/dashboard" className="coll-nav-link">Back to Factory</a>
          <a href="#builders" className="coll-nav-link">Builders</a>
          <a href="#pricing" className="coll-nav-link">Pricing</a>
          <Link href="/collective/hire" className="coll-nav-cta">Hire a Builder</Link>
        </div>
        <button
          className="coll-nav-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen
              ? <path d="M18 6L6 18M6 6l12 12" />
              : <><path d="M3 12h18" /><path d="M3 6h18" /><path d="M3 18h18" /></>}
          </svg>
        </button>
      </nav>
      <div className={`coll-mobile-menu${menuOpen ? " open" : ""}`}>
        <a href="https://factory.tmrwgroup.ai/dashboard" onClick={() => setMenuOpen(false)}>Back to Factory</a>
        <a href="#builders" onClick={() => setMenuOpen(false)}>Builders</a>
        <a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
        <Link href="/collective/hire" onClick={() => setMenuOpen(false)}>Hire a Builder</Link>
      </div>
    </>
  );
}

function BuilderCard({
  builder,
  expanded,
  onToggle,
}: {
  builder: (typeof builders)[0];
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #E8E4DE",
        borderRadius: 12,
        overflow: "hidden",
        transition: "box-shadow .2s, transform .2s",
        cursor: "pointer",
      }}
      onClick={onToggle}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,.06)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
        (e.currentTarget as HTMLElement).style.transform = "none";
      }}
    >
      {/* Color accent */}
      <div style={{ height: 4, background: builder.color }} />
      <div style={{ padding: "24px 24px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{builder.name}</div>
            <div style={{ fontSize: 14, color: "#6B6560", marginTop: 2 }}>{builder.title}</div>
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              padding: "4px 12px",
              borderRadius: 100,
              background: builder.availability === "Available" ? "#E8F5E9" : "#FFF3E0",
              color: builder.availability === "Available" ? "#2E7D32" : "#E65100",
            }}
          >
            {builder.availability}
          </span>
        </div>
        {/* Skills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
          {builder.skills.slice(0, 4).map((s) => (
            <span
              key={s}
              style={{
                fontSize: 12,
                padding: "4px 10px",
                borderRadius: 100,
                background: "#F5F3F0",
                color: "#6B6560",
              }}
            >
              {s}
            </span>
          ))}
        </div>
        <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: builder.color }}>
            {builder.priceRange}
          </span>
          <span style={{ fontSize: 13, color: "#FF6B35", fontWeight: 500 }}>
            {expanded ? "Close" : "View profile"} {expanded ? "↑" : "→"}
          </span>
        </div>
      </div>

      {/* Expanded profile */}
      {expanded && (
        <div style={{ padding: "0 24px 24px", borderTop: "1px solid #E8E4DE" }}>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "#6B6560", marginTop: 16 }}>
            {builder.bio}
          </p>
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: ".5px", color: "#1A1814", marginBottom: 8 }}>
              Agentic Capabilities
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: "#6B6560", lineHeight: 1.8 }}>
              {builder.agenticCapabilities.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 16 }}>
            {builder.skills.map((s) => (
              <span
                key={s}
                style={{
                  fontSize: 12,
                  padding: "4px 10px",
                  borderRadius: 100,
                  background: "#F5F3F0",
                  color: "#6B6560",
                }}
              >
                {s}
              </span>
            ))}
          </div>
          <Link
            href={`/collective/hire?builder=${builder.id}`}
            style={{
              display: "inline-block",
              marginTop: 20,
              padding: "12px 28px",
              background: "#1A1814",
              color: "#fff",
              borderRadius: 100,
              fontSize: 14,
              fontWeight: 500,
              textDecoration: "none",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            Hire {builder.name.split(" ")[0]} →
          </Link>
        </div>
      )}
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────── */

export default function CollectivePage() {
  const [expandedBuilder, setExpandedBuilder] = useState<string | null>(null);

  return (
    <>
      <Nav />

      {/* ── Hero ── */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 32px 60px", textAlign: "center" }}>
        <h1
          className="coll-serif"
          style={{ fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1.1, margin: 0, fontWeight: 400 }}
        >
          Hire an agentic builder.
        </h1>
        <p
          style={{
            fontSize: "clamp(18px, 2.5vw, 22px)",
            color: "#6B6560",
            marginTop: 16,
            fontWeight: 400,
            lineHeight: 1.5,
          }}
        >
          One person. One swarm. 10x output.
        </p>
        <p
          style={{
            maxWidth: 620,
            margin: "24px auto 0",
            fontSize: 16,
            lineHeight: 1.7,
            color: "#6B6560",
          }}
        >
          Our builders don't just write code or strategy. They operate AI agent
          swarms that multiply their output by 10x. You get a fractional expert
          with the throughput of a full team.
        </p>
        <div style={{ marginTop: 36, display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <a
            href="#builders"
            style={{
              padding: "14px 32px",
              background: "#1A1814",
              color: "#fff",
              borderRadius: 100,
              fontSize: 15,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Browse Builders →
          </a>
          <a
            href="#how-it-works"
            style={{
              padding: "14px 32px",
              border: "1px solid #E8E4DE",
              color: "#1A1814",
              borderRadius: 100,
              fontSize: 15,
              fontWeight: 500,
              textDecoration: "none",
              background: "transparent",
            }}
          >
            How it works ↓
          </a>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section
        id="how-it-works"
        style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 32px 80px", borderTop: "1px solid #E8E4DE" }}
      >
        <h2
          className="coll-serif"
          style={{ fontSize: 28, fontWeight: 400, textAlign: "center", margin: "0 0 48px" }}
        >
          How it works
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 32,
          }}
        >
          {[
            {
              num: "01",
              title: "Tell us what you need",
              desc: "Describe your project, timeline, and budget. We'll match you with the right builder.",
            },
            {
              num: "02",
              title: "Meet your builder",
              desc: "Every builder comes with their own agentic swarm — AI agents that handle execution while the human handles strategy.",
            },
            {
              num: "03",
              title: "Ship at 10x",
              desc: "Your builder's swarm works around the clock. Weekly deliverables, daily updates, real results measured in output, not hours.",
            },
          ].map((step) => (
            <div key={step.num} style={{ padding: 4 }}>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: "#FF6B35",
                  marginBottom: 12,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {step.num}
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                {step.title}
              </div>
              <div style={{ fontSize: 15, lineHeight: 1.65, color: "#6B6560" }}>
                {step.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Builders ── */}
      <section
        id="builders"
        style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 32px 80px", borderTop: "1px solid #E8E4DE" }}
      >
        <h2
          className="coll-serif"
          style={{ fontSize: 28, fontWeight: 400, textAlign: "center", margin: "0 0 48px" }}
        >
          Meet the builders
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 24,
          }}
        >
          {builders.map((b) => (
            <BuilderCard
              key={b.id}
              builder={b}
              expanded={expandedBuilder === b.id}
              onToggle={() =>
                setExpandedBuilder(expandedBuilder === b.id ? null : b.id)
              }
            />
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section
        id="pricing"
        style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 32px 80px", borderTop: "1px solid #E8E4DE" }}
      >
        <h2
          className="coll-serif"
          style={{ fontSize: 28, fontWeight: 400, textAlign: "center", margin: "0 0 48px" }}
        >
          Pricing
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 24,
          }}
        >
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              style={{
                background: "#fff",
                border: tier.highlight ? "2px solid #FF6B35" : "1px solid #E8E4DE",
                borderRadius: 12,
                padding: 28,
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              {tier.highlight && (
                <span
                  style={{
                    position: "absolute",
                    top: -12,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#FF6B35",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "4px 14px",
                    borderRadius: 100,
                    textTransform: "uppercase",
                    letterSpacing: ".5px",
                  }}
                >
                  Most Popular
                </span>
              )}
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                {tier.name}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 20 }}>
                <span style={{ fontSize: 32, fontWeight: 700 }}>{tier.price}</span>
                <span style={{ fontSize: 14, color: "#6B6560" }}>{tier.period}</span>
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "0 0 24px",
                  flex: 1,
                }}
              >
                {tier.features.map((f) => (
                  <li
                    key={f}
                    style={{
                      fontSize: 14,
                      color: "#6B6560",
                      padding: "6px 0",
                      borderBottom: "1px solid #F5F3F0",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span style={{ color: "#FF6B35", fontSize: 14 }}>&#10003;</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href={`/collective/hire?budget=${encodeURIComponent(tier.name)}`}
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "12px 24px",
                  borderRadius: 100,
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: "none",
                  background: tier.highlight ? "#1A1814" : "transparent",
                  color: tier.highlight ? "#fff" : "#1A1814",
                  border: tier.highlight ? "none" : "1px solid #E8E4DE",
                }}
              >
                {tier.cta} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "80px 32px",
          borderTop: "1px solid #E8E4DE",
          textAlign: "center",
        }}
      >
        <h2
          className="coll-serif"
          style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 400, margin: "0 0 16px" }}
        >
          Ready to hire?
        </h2>
        <p style={{ fontSize: 16, color: "#6B6560", maxWidth: 500, margin: "0 auto 32px", lineHeight: 1.6 }}>
          Tell us about your project and we'll match you with the right builder
          within 24 hours.
        </p>
        <Link
          href="/collective/hire"
          style={{
            display: "inline-block",
            padding: "16px 40px",
            background: "#FF6B35",
            color: "#fff",
            borderRadius: 100,
            fontSize: 16,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Start a project →
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="coll-footer">
        <span className="dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF6B35", display: "inline-block", marginRight: 8, verticalAlign: "middle" }} />
        TMRW Collective · Tomorrow, Inc · 2026
        <br />
        <span style={{ fontSize: 12, marginTop: 4, display: "inline-block" }}>
          Built with agentic swarms.
        </span>
      </footer>
    </>
  );
}
