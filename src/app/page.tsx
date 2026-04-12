import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Brain,
  Chrome,
  Cpu,
  Download,
  LayoutGrid,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import GridBackground from "@/components/shared/GridBackground";
import VideoModal from "@/components/shared/VideoModal";
import Footer from "@/components/layout/Footer";

const NAV_LINKS = [
  { label: "Webster", href: "/webster", openInNewTab: false },
  { label: "District", href: "/district", openInNewTab: true },
  { label: "Collective", href: "/collective", openInNewTab: true },
  { label: "Cybersecurity", href: "/cybersecurity", openInNewTab: false },
  { label: "Watch", href: "/watch", openInNewTab: true },
  { label: "Docs", href: "/docs", openInNewTab: false },
];

const MODELS = [
  { name: "Claude", provider: "Anthropic", color: "#d4a574" },
  { name: "GPT-4", provider: "OpenAI", color: "#74d4a5" },
  { name: "Amazon Nova", provider: "AWS Bedrock", color: "#74a5d4" },
  { name: "Gemini", provider: "Google", color: "#a574d4" },
];

const PLATFORM_CAPABILITIES = [
  { icon: Bot, title: "Agent Builder", desc: "Create AI agents with natural language instructions. Define persona, connect tools, deploy — no code required." },
  { icon: Workflow, title: "50+ MCP Tools", desc: "Pre-built Model Context Protocol tools for Marketo, Salesforce, HubSpot, and more. Read, write, audit, and automate." },
  { icon: ShieldCheck, title: "Browser-Native Execution", desc: "Agents execute inside your authenticated browser session. No API keys stored server-side. Your data stays yours." },
  { icon: Zap, title: "Real-Time Streaming", desc: "SSE architecture delivers token-by-token responses. Watch agents think, call tools, and return results live." },
  { icon: Brain, title: "Multi-Model Intelligence", desc: "Route to Claude, GPT-4, Nova, or Gemini automatically. Best model for each task — balancing cost, speed, and depth." },
  { icon: MessageSquare, title: "Voice & Chat", desc: "Speak or type. Factory agents accept voice commands and execute via the same tool pipeline." },
];

const WEBSTER_TOOLS = [
  { label: "List Programs", desc: "Export all programs with IDs, channels, and folders" },
  { label: "Smart Campaigns", desc: "View and manage all smart campaigns with status" },
  { label: "Email Management", desc: "Create, clone, approve, and send test emails" },
  { label: "Landing Pages", desc: "Create, clone, and approve landing pages" },
  { label: "Token Management", desc: "Create, update, and delete program tokens" },
  { label: "Health Audits", desc: "Run instance health checks and export audit trails" },
];

const HOW_WEBSTER_WORKS = [
  { step: "1", title: "Install Extension", desc: "Download the Chrome extension and load it in your browser. Takes under 2 minutes.", icon: Chrome },
  { step: "2", title: "Connect to Marketo", desc: "Navigate to your Marketo instance — Webster detects it automatically and connects.", icon: LayoutGrid },
  { step: "3", title: "Ask in Plain English", desc: "Type what you need. Webster calls the right tools and returns real data — not explanations.", icon: Bot },
];

export default function HomePage() {
  return (
    <main className="vf-public">
      <GridBackground />

      {/* Nav */}
      <header className="vf-public-nav vf-glass">
        <Link href="/" className="vf-public-brand">
          <span>Venture Factory</span>
          <small>TMRW Group</small>
        </Link>
        <nav className="vf-public-links">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              target={item.openInNewTab ? "_blank" : undefined}
              rel={item.openInNewTab ? "noopener noreferrer" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link href="/login" className="vf-button-primary">
          Open Dashboard
          <ArrowRight size={14} />
        </Link>
      </header>

      {/* ═══ Hero — Platform ═══ */}
      <section className="vf-public-hero">
        <div className="vf-public-hero-copy">
          <span className="vf-public-badge">
            <Cpu size={12} />
            AI-Native Agent Platform
          </span>
          <h1>
            Build agents that{" "}
            <span className="vf-gradient-text">do real work.</span>
          </h1>
          <p>
            Venture Factory is the agentic AI platform by TMRW Group. Create AI agents,
            connect them to your tools via MCP, and execute real work inside Marketo,
            Salesforce, HubSpot, and more — all through natural language.
          </p>
          <div className="vf-public-cta-row">
            <Link href="/login" className="vf-button-primary vf-landing-cta-glow">
              Open Dashboard
              <ArrowRight size={14} />
            </Link>
            <VideoModal videoSrc="/videos/webster-demo.mp4" buttonText="See it in Action" buttonClassName="vf-button-secondary" />
          </div>
        </div>

        <div className="vf-public-hero-panel vf-glass">
          <div className="vf-landing-capabilities-label">Integrated Models</div>
          <div className="vf-public-hero-grid">
            {MODELS.map((model) => (
              <div key={model.name} className="vf-public-hero-item">
                <Brain size={14} style={{ color: model.color, flexShrink: 0, marginTop: 2 }} />
                <span><strong style={{ color: model.color }}>{model.name}</strong> <span style={{ opacity: 0.5 }}>&middot;</span> {model.provider}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "var(--space-4)", paddingTop: "var(--space-3)", borderTop: "1px solid var(--border)" }}>
            <div className="vf-landing-capabilities-label" style={{ marginBottom: "var(--space-2)" }}>Platform</div>
            <div className="vf-public-hero-grid">
              <div className="vf-public-hero-item">
                <Workflow size={14} style={{ color: "var(--teal)", flexShrink: 0, marginTop: 2 }} />
                <span>50+ MCP tools — Marketo, Salesforce, HubSpot</span>
              </div>
              <div className="vf-public-hero-item">
                <ShieldCheck size={14} style={{ color: "var(--teal)", flexShrink: 0, marginTop: 2 }} />
                <span>Browser-native execution — your session, your data</span>
              </div>
              <div className="vf-public-hero-item">
                <Zap size={14} style={{ color: "var(--teal)", flexShrink: 0, marginTop: 2 }} />
                <span>Real-time streaming with tool execution cards</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Platform Capabilities ═══ */}
      <section style={{ maxWidth: "1240px", margin: "0 auto", padding: "64px 24px 0" }}>
        <h2 style={{ textAlign: "center", fontSize: "28px", fontWeight: 400, fontFamily: "var(--font-heading, Instrument Serif, Georgia, serif)", color: "var(--text-primary, #e8e4de)", marginBottom: "8px" }}>
          The Agentic AI Platform
        </h2>
        <p style={{ textAlign: "center", fontSize: "14px", color: "var(--text-secondary, #9b9590)", marginBottom: "40px", maxWidth: "600px", margin: "0 auto 40px" }}>
          Not a chatbot. Not a wrapper. A full platform for building AI agents that call real APIs, pull real data, and execute real workflows.
        </p>
      </section>
      <section className="vf-public-cards" style={{ gap: "12px" }}>
        {PLATFORM_CAPABILITIES.map((cap) => (
          <div
            key={cap.title}
            className="vf-card vf-card-pad vf-public-card vf-glow-border"
          >
            <div className="vf-landing-card-icon" style={{ color: "var(--teal)" }}>
              <cap.icon size={20} />
            </div>
            <h2>{cap.title}</h2>
            <p>{cap.desc}</p>
          </div>
        ))}
      </section>

      {/* ═══ Webster — Flagship Product ═══ */}
      <section style={{ maxWidth: "1240px", margin: "0 auto", padding: "80px 24px 0", position: "relative", zIndex: 1 }}>
        <div style={{
          borderRadius: "var(--vf-radius-xl, 16px)",
          border: "1px solid color-mix(in srgb, var(--border-active, #313a45) 86%, #6f7fff 14%)",
          background: "linear-gradient(135deg, rgba(8, 10, 16, 0.96), rgba(7, 8, 12, 0.96)), radial-gradient(circle at 15% 80%, rgba(134, 184, 168, 0.2), transparent 40%)",
          padding: "clamp(1.4rem, 2.6vw, 2.4rem)",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "var(--space-6, 2rem)" }}>
            <div>
              <span className="vf-public-badge" style={{ marginBottom: "var(--space-3, 0.75rem)", display: "inline-flex" }}>
                <Chrome size={12} />
                Flagship Product &middot; Marketing Operations
              </span>
              <h2 style={{ fontSize: "clamp(1.8rem, 3.6vw, 2.8rem)", lineHeight: 1.05, letterSpacing: "-0.03em", marginTop: "var(--space-3, 0.75rem)" }}>
                <span className="vf-gradient-text">Webster</span> — your Marketo AI assistant.
              </h2>
              <p style={{ marginTop: "var(--space-4, 1rem)", color: "var(--text-secondary, #abb2bc)", maxWidth: "52ch", lineHeight: 1.6 }}>
                Webster is a Chrome extension that embeds directly in your Marketo instance.
                50+ tools for campaigns, emails, smart lists, tokens, and audits — all via natural language.
                Built for marketing operations teams who need execution, not explanations.
              </p>
              <p style={{ marginTop: "var(--space-3, 0.75rem)", color: "var(--text-muted, #7d8692)", fontSize: "var(--text-sm, 0.875rem)", lineHeight: 1.6 }}>
                Competing with allGood&apos;s Mary? Webster goes deeper. It doesn&apos;t just manage lists and routing —
                it calls Marketo&apos;s internal APIs directly from your browser. Create programs, clone emails,
                approve landing pages, manage tokens, run health audits. Real configuration, real execution.
              </p>
              <div className="vf-public-cta-row" style={{ marginTop: "var(--space-5, 1.5rem)" }}>
                <Link href="/download/webster" className="vf-button-primary vf-landing-cta-glow">
                  <Download size={14} />
                  Download Extension
                </Link>
                <Link href="/webster" className="vf-button-secondary">
                  Learn More
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
            <div className="vf-glass" style={{ borderRadius: "var(--vf-radius-lg, 10px)", padding: "var(--space-4, 1rem)", alignSelf: "center" }}>
              <div className="vf-landing-capabilities-label" style={{ marginBottom: "var(--space-3, 0.75rem)" }}>How Webster Works</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3, 0.75rem)" }}>
                {HOW_WEBSTER_WORKS.map((step) => (
                  <div key={step.step} style={{ display: "flex", alignItems: "start", gap: "var(--space-2, 0.5rem)" }}>
                    <step.icon size={14} style={{ color: "var(--teal)", flexShrink: 0, marginTop: 3 }} />
                    <div>
                      <div style={{ fontSize: "var(--text-sm, 0.875rem)", fontWeight: 600, color: "var(--text-primary, #e6e8eb)" }}>{step.step}. {step.title}</div>
                      <div style={{ fontSize: "var(--text-xs, 0.75rem)", color: "var(--text-muted, #7d8692)", marginTop: 2 }}>{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Webster Tools Grid ═══ */}
      <section style={{ maxWidth: "900px", margin: "0 auto", padding: "48px 24px 40px", position: "relative", zIndex: 1 }}>
        <h2 style={{ textAlign: "center", fontSize: "24px", fontWeight: 400, marginBottom: "8px", fontFamily: "var(--font-heading, Instrument Serif, Georgia, serif)", color: "var(--text-primary, #e8e4de)" }}>
          50+ Marketo Tools
        </h2>
        <p style={{ textAlign: "center", fontSize: "14px", color: "var(--text-secondary, #9b9590)", marginBottom: "24px" }}>
          Webster calls Marketo&apos;s internal APIs directly from your browser. No middleware, no latency.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px" }}>
          {WEBSTER_TOOLS.map((tool) => (
            <div
              key={tool.label}
              style={{
                padding: "16px 20px",
                borderRadius: "12px",
                border: "1px solid var(--border, rgba(255,255,255,0.08))",
                background: "var(--card-bg, rgba(255,255,255,0.03))",
              }}
            >
              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary, #e8e4de)", marginBottom: "4px" }}>{tool.label}</div>
              <div style={{ fontSize: "13px", color: "var(--text-secondary, #9b9590)", lineHeight: 1.4 }}>{tool.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <Link href="/download/webster" className="vf-button-primary vf-landing-cta-glow" style={{ fontSize: "15px", padding: "14px 32px" }}>
            <Download size={15} />
            Download Webster for Chrome
          </Link>
          <p style={{ fontSize: "13px", color: "var(--text-secondary, #9b9590)", marginTop: "12px" }}>
            Free to install &middot; Requires Venture Factory subscription ($49/mo) &middot; Marketo access required
          </p>
        </div>
      </section>

      {/* ═══ Coming Soon — More Platforms ═══ */}
      <section style={{ maxWidth: "1240px", margin: "0 auto", padding: "40px 24px 16px", position: "relative", zIndex: 1 }}>
        <h2 style={{ textAlign: "center", fontSize: "24px", fontWeight: 400, fontFamily: "var(--font-heading, Instrument Serif, Georgia, serif)", color: "var(--text-primary, #e8e4de)", marginBottom: "6px" }}>
          Expanding to More Platforms
        </h2>
        <p style={{ textAlign: "center", fontSize: "14px", color: "var(--text-secondary, #9b9590)", marginBottom: "32px", maxWidth: "500px", margin: "0 auto 32px" }}>
          Webster starts with Marketo. HubSpot, Salesforce, and Segment are next. Same agent platform, same MCP tools, more SaaS configurators.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
          {["Marketo", "HubSpot", "Salesforce", "Segment"].map((platform, i) => (
            <span
              key={platform}
              style={{
                padding: "10px 24px",
                borderRadius: "8px",
                border: "1px solid var(--border, rgba(255,255,255,0.08))",
                background: i === 0 ? "rgba(134, 184, 168, 0.1)" : "var(--card-bg, rgba(255,255,255,0.03))",
                color: i === 0 ? "var(--teal, #86b8a8)" : "var(--text-muted, #7d8692)",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              {platform} {i === 0 ? "✓" : "— Soon"}
            </span>
          ))}
        </div>
      </section>

      {/* ═══ Platform Products ═══ */}
      <section style={{ maxWidth: "1240px", margin: "0 auto", padding: "48px 24px 0", position: "relative", zIndex: 1 }}>
        <h2 style={{ textAlign: "center", fontSize: "24px", fontWeight: 400, fontFamily: "var(--font-heading, Instrument Serif, Georgia, serif)", color: "var(--text-primary, #e8e4de)", marginBottom: "32px" }}>
          Inside the Factory
        </h2>
      </section>
      <section className="vf-public-cards">
        {[
          {
            icon: LayoutGrid,
            title: "District",
            desc: "Autonomous job execution board. Jobs go in, agents execute, results come back. 5 factory lines with quality validation.",
            href: "/district",
            color: "var(--teal)",
          },
          {
            icon: Users,
            title: "Collective",
            desc: "Marketplace for hiring agentic builders. Each builder comes with their own AI agent swarm. One person, 10x output.",
            href: "/collective",
            color: "var(--blue)",
          },
          {
            icon: Sparkles,
            title: "Watch",
            desc: "Live demos and walkthroughs showing how agentic systems operate in real-time practice.",
            href: "/watch",
            color: "var(--gold)",
          },
        ].map((feature) => (
          <Link
            key={feature.href}
            href={feature.href}
            className="vf-card vf-card-pad vf-public-card vf-glow-border"
          >
            <div className="vf-landing-card-icon" style={{ color: feature.color }}>
              <feature.icon size={20} />
            </div>
            <h2>{feature.title}</h2>
            <p>{feature.desc}</p>
            <span className="vf-landing-card-link" style={{ color: feature.color }}>
              Open {feature.title}
              <ArrowRight size={13} />
            </span>
          </Link>
        ))}
      </section>

      <Footer />
    </main>
  );
}
