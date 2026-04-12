import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  Flame,
  Shield,
  ShieldAlert,
  Users,
} from "lucide-react";
import GridBackground from "@/components/shared/GridBackground";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Cybersecurity Research | TMRW Group",
  description:
    "Research and analysis at the intersection of frontier AI and cybersecurity. Covering defensive AI, threat intelligence, and the tools shaping the next generation of security.",
  openGraph: {
    title: "Cybersecurity Research | TMRW Group",
    description:
      "Research and analysis at the intersection of frontier AI and cybersecurity.",
    url: "https://factory.tmrwgroup.ai/cybersecurity",
  },
};

const NAV_LINKS = [
  { label: "Webster", href: "/webster" },
  { label: "District", href: "/district" },
  { label: "Cybersecurity", href: "/cybersecurity" },
  { label: "Watch", href: "/watch" },
];

const FEATURED_POST = {
  slug: "why-frontier-ai-just-made-cybersecurity-the-biggest-opportunity-of-2026",
  title:
    "Why Frontier AI Just Made Cybersecurity the Biggest Opportunity of 2026",
  excerpt:
    "Anthropic withheld Mythos Preview from public release for the first time ever. Project Glasswing deploys $100M in defensive AI credits. What this means for cybersecurity builders — and why the window to act is now.",
  date: "April 12, 2026",
  readTime: "15 min read",
  tags: ["Frontier AI", "Project Glasswing", "Mythos Preview"],
};

const UPCOMING_POSTS = [
  {
    title: "The AI Security Stack: What Every CISO Needs to Know",
    excerpt:
      "A framework for evaluating AI-native security tools. What to buy, what to build, and what to ignore.",
    tag: "Coming Soon",
  },
  {
    title: "MCP Tools for Security Operations: A Technical Deep Dive",
    excerpt:
      "How Model Context Protocol enables AI agents to interact with security infrastructure in real-time.",
    tag: "Coming Soon",
  },
  {
    title: "Building AI-Native SOCs: From Theory to Production",
    excerpt:
      "Lessons from deploying AI agents in security operations centers. What works, what doesn't, and what's next.",
    tag: "Coming Soon",
  },
];

export default function CybersecurityPage() {
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
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <Link href="/login" className="vf-button-primary">
          Open Dashboard
          <ArrowRight size={14} />
        </Link>
      </header>

      {/* Hero */}
      <section
        style={{
          maxWidth: "1240px",
          margin: "0 auto",
          padding: "120px 24px 0",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ maxWidth: "720px" }}>
          <span className="vf-public-badge">
            <Shield size={12} />
            TMRW Group Research
          </span>
          <h1
            style={{
              fontSize: "clamp(2.2rem, 5vw, 3.2rem)",
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              color: "var(--text-primary, #e6e8eb)",
              fontWeight: 400,
              fontFamily:
                "var(--font-heading, Instrument Serif, Georgia, serif)",
              marginTop: "16px",
              marginBottom: "16px",
            }}
          >
            <span className="vf-gradient-text">Cybersecurity</span>{" "}
            Research
          </h1>
          <p
            style={{
              fontSize: "16px",
              lineHeight: 1.7,
              color: "var(--text-secondary, #abb2bc)",
              maxWidth: "56ch",
            }}
          >
            Analysis and insight at the intersection of frontier AI and
            cybersecurity. Covering defensive AI, threat intelligence,
            exploit analysis, and the tools shaping the next generation of
            security infrastructure.
          </p>
        </div>
      </section>

      {/* Featured Post */}
      <section
        style={{
          maxWidth: "1240px",
          margin: "0 auto",
          padding: "48px 24px 0",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--text-muted, #7d8692)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "16px",
          }}
        >
          Featured
        </div>
        <Link
          href={`/cybersecurity/${FEATURED_POST.slug}`}
          style={{
            display: "block",
            padding: "clamp(24px, 3vw, 40px)",
            borderRadius: "16px",
            border:
              "1px solid color-mix(in srgb, var(--border-active, #313a45) 86%, #6f7fff 14%)",
            background:
              "linear-gradient(135deg, rgba(8, 10, 16, 0.96), rgba(7, 8, 12, 0.96)), radial-gradient(circle at 15% 80%, rgba(134, 184, 168, 0.15), transparent 40%)",
            textDecoration: "none",
            transition: "border-color 0.2s",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              marginBottom: "16px",
            }}
          >
            <span className="vf-public-badge">
              <ShieldAlert size={12} />
              Frontier AI &times; Cybersecurity
            </span>
            <span className="vf-public-badge">
              <Flame size={12} />
              Featured
            </span>
          </div>
          <h2
            style={{
              fontSize: "clamp(1.4rem, 3vw, 2rem)",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: "var(--text-primary, #e6e8eb)",
              fontWeight: 400,
              fontFamily:
                "var(--font-heading, Instrument Serif, Georgia, serif)",
              marginBottom: "12px",
            }}
          >
            {FEATURED_POST.title}
          </h2>
          <p
            style={{
              fontSize: "15px",
              lineHeight: 1.7,
              color: "var(--text-secondary, #abb2bc)",
              maxWidth: "72ch",
              marginBottom: "16px",
            }}
          >
            {FEATURED_POST.excerpt}
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
              fontSize: "13px",
              color: "var(--text-muted, #7d8692)",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Users size={13} />
              TMRW Group Research Team
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Calendar size={13} />
              {FEATURED_POST.date}
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Clock size={13} />
              {FEATURED_POST.readTime}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              gap: "6px",
              flexWrap: "wrap",
              marginTop: "16px",
            }}
          >
            {FEATURED_POST.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 500,
                  color: "var(--teal, #86b8a8)",
                  border:
                    "1px solid color-mix(in srgb, var(--teal, #86b8a8) 20%, transparent)",
                  background:
                    "color-mix(in srgb, var(--teal, #86b8a8) 6%, transparent)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
          <div
            style={{
              marginTop: "20px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "14px",
              fontWeight: 500,
              color: "var(--teal, #86b8a8)",
            }}
          >
            Read Article
            <ArrowRight size={14} />
          </div>
        </Link>
      </section>

      {/* Upcoming Posts */}
      <section
        style={{
          maxWidth: "1240px",
          margin: "0 auto",
          padding: "48px 24px 80px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--text-muted, #7d8692)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "16px",
          }}
        >
          <BookOpen
            size={12}
            style={{
              display: "inline",
              verticalAlign: "middle",
              marginRight: "6px",
            }}
          />
          Coming Soon
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "12px",
          }}
        >
          {UPCOMING_POSTS.map((post) => (
            <div
              key={post.title}
              style={{
                padding: "24px",
                borderRadius: "12px",
                border:
                  "1px solid var(--border, rgba(255,255,255,0.08))",
                background:
                  "var(--card-bg, rgba(255,255,255,0.03))",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted, #7d8692)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontWeight: 600,
                }}
              >
                {post.tag}
              </span>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 500,
                  color: "var(--text-primary, #e6e8eb)",
                  marginTop: "8px",
                  marginBottom: "8px",
                  lineHeight: 1.3,
                }}
              >
                {post.title}
              </h3>
              <p
                style={{
                  fontSize: "13px",
                  lineHeight: 1.6,
                  color: "var(--text-secondary, #abb2bc)",
                  margin: 0,
                }}
              >
                {post.excerpt}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
