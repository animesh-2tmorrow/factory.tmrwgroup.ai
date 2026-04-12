import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  BookOpen,
  Calendar,
  Clock,
  ExternalLink,
  Flame,
  Globe,
  Lock,
  Megaphone,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import GridBackground from "@/components/shared/GridBackground";
import Footer from "@/components/layout/Footer";

const SLUG =
  "why-frontier-ai-just-made-cybersecurity-the-biggest-opportunity-of-2026";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (slug !== SLUG) return { title: "Not Found" };
  return {
    title:
      "Why Frontier AI Just Made Cybersecurity the Biggest Opportunity of 2026 | TMRW Group",
    description:
      "Anthropic withheld Mythos Preview from public release for the first time. Project Glasswing deploys $100M in defensive AI. What this means for cybersecurity builders.",
    openGraph: {
      title:
        "Why Frontier AI Just Made Cybersecurity the Biggest Opportunity of 2026",
      description:
        "Anthropic withheld Mythos Preview for the first time. Project Glasswing deploys $100M in defensive AI credits. The cybersecurity opportunity of a generation.",
      type: "article",
      publishedTime: "2026-04-12T00:00:00Z",
      authors: ["TMRW Group Research Team"],
      url: `https://factory.tmrwgroup.ai/cybersecurity/${SLUG}`,
    },
    twitter: {
      card: "summary_large_image",
      title:
        "Why Frontier AI Just Made Cybersecurity the Biggest Opportunity of 2026",
      description:
        "Anthropic withheld Mythos Preview for the first time. Project Glasswing deploys $100M in defensive AI credits.",
    },
    alternates: {
      canonical: `https://factory.tmrwgroup.ai/cybersecurity/${SLUG}`,
    },
  };
}

const NAV_LINKS = [
  { label: "Webster", href: "/webster" },
  { label: "District", href: "/district" },
  { label: "Cybersecurity", href: "/cybersecurity" },
  { label: "Watch", href: "/watch" },
];

const GLASSWING_PARTNERS = [
  { name: "CrowdStrike", role: "Endpoint & threat intelligence" },
  { name: "Palo Alto Networks", role: "Network & cloud security" },
  { name: "Recorded Future", role: "Threat intelligence feeds" },
  { name: "Trail of Bits", role: "Binary analysis & formal verification" },
  { name: "SpecterOps", role: "Identity attack path analysis" },
  { name: "Leviathan Security", role: "Hardware & firmware auditing" },
];

const RELATED_ARTICLES = [
  {
    title: "The AI Security Stack: What Every CISO Needs to Know",
    href: "/cybersecurity",
    tag: "Coming Soon",
  },
  {
    title: "MCP Tools for Security Operations: A Technical Deep Dive",
    href: "/cybersecurity",
    tag: "Coming Soon",
  },
  {
    title: "Building AI-Native SOCs: From Theory to Production",
    href: "/cybersecurity",
    tag: "Coming Soon",
  },
];

function ShareButtons({ url, title }: { url: string; title: string }) {
  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
      <a
        href={`https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          padding: "8px 16px",
          borderRadius: "8px",
          border: "1px solid var(--border, rgba(255,255,255,0.08))",
          background: "var(--card-bg, rgba(255,255,255,0.03))",
          color: "var(--text-secondary, #abb2bc)",
          fontSize: "13px",
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          transition: "border-color 0.15s",
        }}
      >
        <ExternalLink size={12} />
        Share on X
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          padding: "8px 16px",
          borderRadius: "8px",
          border: "1px solid var(--border, rgba(255,255,255,0.08))",
          background: "var(--card-bg, rgba(255,255,255,0.03))",
          color: "var(--text-secondary, #abb2bc)",
          fontSize: "13px",
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          transition: "border-color 0.15s",
        }}
      >
        <ExternalLink size={12} />
        Share on LinkedIn
      </a>
      <a
        href={`https://bsky.app/intent/compose?text=${encodedTitle}%20${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          padding: "8px 16px",
          borderRadius: "8px",
          border: "1px solid var(--border, rgba(255,255,255,0.08))",
          background: "var(--card-bg, rgba(255,255,255,0.03))",
          color: "var(--text-secondary, #abb2bc)",
          fontSize: "13px",
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          transition: "border-color 0.15s",
        }}
      >
        <ExternalLink size={12} />
        Bluesky
      </a>
    </div>
  );
}

function SectionIcon({
  icon: Icon,
  color = "var(--teal)",
}: {
  icon: typeof Shield;
  color?: string;
}) {
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: "10px",
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 20%, transparent)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon size={18} style={{ color }} />
    </div>
  );
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (slug !== SLUG) {
    return (
      <main className="vf-public">
        <GridBackground />
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <h1
              style={{
                fontSize: "24px",
                color: "var(--text-primary, #e6e8eb)",
              }}
            >
              Post not found
            </h1>
            <Link
              href="/cybersecurity"
              className="vf-button-secondary"
              style={{ marginTop: "16px", display: "inline-flex" }}
            >
              <ArrowLeft size={14} />
              Back to Cybersecurity
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  const articleUrl = `https://factory.tmrwgroup.ai/cybersecurity/${SLUG}`;
  const articleTitle =
    "Why Frontier AI Just Made Cybersecurity the Biggest Opportunity of 2026";

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

      {/* ═══ Hero ═══ */}
      <section
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "120px 24px 0",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Link
          href="/cybersecurity"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            color: "var(--text-muted, #7d8692)",
            textDecoration: "none",
            marginBottom: "24px",
            transition: "color 0.15s",
          }}
        >
          <ArrowLeft size={13} />
          Cybersecurity Research
        </Link>

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
            Featured Analysis
          </span>
        </div>

        <h1
          style={{
            fontSize: "clamp(2rem, 4.5vw, 3rem)",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            color: "var(--text-primary, #e6e8eb)",
            fontWeight: 400,
            fontFamily:
              "var(--font-heading, Instrument Serif, Georgia, serif)",
            marginBottom: "20px",
          }}
        >
          Why Frontier AI Just Made Cybersecurity the{" "}
          <span className="vf-gradient-text">
            Biggest Opportunity of 2026
          </span>
        </h1>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
            fontSize: "13px",
            color: "var(--text-muted, #7d8692)",
            marginBottom: "32px",
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
            April 12, 2026
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Clock size={13} />
            15 min read
          </span>
        </div>

        {/* Video Embed */}
        <div
          style={{
            borderRadius: "12px",
            overflow: "hidden",
            border:
              "1px solid var(--border-active, rgba(255,255,255,0.12))",
            background: "#000",
            marginBottom: "32px",
            aspectRatio: "16/9",
          }}
        >
          {/* TODO: Replace VIDEO_ID_HERE with actual YouTube video ID */}
          <iframe
            src="https://www.youtube.com/embed/VIDEO_ID_HERE"
            title="Why Frontier AI Just Made Cybersecurity the Biggest Opportunity of 2026"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              width: "100%",
              height: "100%",
              border: "none",
            }}
          />
        </div>

        <ShareButtons url={articleUrl} title={articleTitle} />
      </section>

      {/* ═══ Article Body ═══ */}
      <article
        style={{
          maxWidth: "740px",
          margin: "0 auto",
          padding: "48px 24px 0",
          position: "relative",
          zIndex: 1,
          color: "var(--text-secondary, #abb2bc)",
          fontSize: "16px",
          lineHeight: 1.8,
        }}
      >
        {/* Lead */}
        <p
          style={{
            fontSize: "18px",
            lineHeight: 1.7,
            color: "var(--text-primary, #e6e8eb)",
            marginBottom: "32px",
          }}
        >
          On March 27, 2026, Anthropic did something unprecedented in the
          history of frontier AI: they withheld their most powerful model
          from public release. Claude Mythos Preview &mdash; internally
          codenamed <em>Capybara</em> &mdash; was deemed too capable in
          offensive cybersecurity to ship without restrictions. This is the
          first time a major AI lab has taken this step, and it changes
          everything for the security industry.
        </p>

        {/* Section 1: The Bombshell */}
        <div
          style={{
            display: "flex",
            alignItems: "start",
            gap: "14px",
            marginBottom: "16px",
            marginTop: "48px",
          }}
        >
          <SectionIcon icon={AlertTriangle} color="#d87272" />
          <h2
            style={{
              fontSize: "24px",
              fontWeight: 400,
              fontFamily:
                "var(--font-heading, Instrument Serif, Georgia, serif)",
              color: "var(--text-primary, #e6e8eb)",
              lineHeight: 1.2,
              margin: 0,
              paddingTop: "6px",
            }}
          >
            The Bombshell Announcement
          </h2>
        </div>
        <p>
          Every major AI lab has released increasingly powerful models on a
          predictable cadence. GPT-5, Gemini Ultra 2, Claude Opus &mdash;
          each one shipped within weeks of completion. Mythos Preview broke
          that pattern.
        </p>
        <p>
          Anthropic&apos;s internal red team found that Mythos Preview could
          independently discover zero-day vulnerabilities in production
          software, chain multiple exploits into working attack sequences,
          and generate novel attack techniques that had never been
          documented. Not with heavy prompting or jailbreaks &mdash; through
          straightforward security research prompts.
        </p>
        <div
          style={{
            padding: "20px 24px",
            borderRadius: "12px",
            borderLeft: "3px solid var(--teal, #86b8a8)",
            background:
              "linear-gradient(135deg, rgba(134, 184, 168, 0.06), transparent)",
            margin: "24px 0",
            fontSize: "15px",
            lineHeight: 1.7,
          }}
        >
          <strong
            style={{ color: "var(--teal, #86b8a8)", display: "block", marginBottom: "6px" }}
          >
            Key finding from Anthropic&apos;s red team:
          </strong>
          Mythos Preview demonstrated &ldquo;autonomous exploit
          development&rdquo; &mdash; the ability to go from vulnerability
          discovery to working proof-of-concept without human guidance. This
          capability was present in no prior Claude model.
          <div style={{ marginTop: "8px" }}>
            <a
              href="https://red.anthropic.com/2026/mythos-preview/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "var(--teal, #86b8a8)",
                textDecoration: "none",
                fontSize: "13px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              Read the full red team report
              <ExternalLink size={11} />
            </a>
          </div>
        </div>
        <p>
          The decision to withhold wasn&apos;t a marketing stunt. It was a
          calculated response to capability evaluations that exceeded
          Anthropic&apos;s own ASL-3 safety thresholds for autonomous cyber
          operations. Mythos Preview is available only through the Frontier
          Safety Program &mdash; vetted security researchers, defense
          contractors, and select partners.
        </p>

        {/* Section 2: Raw Power */}
        <div
          style={{
            display: "flex",
            alignItems: "start",
            gap: "14px",
            marginBottom: "16px",
            marginTop: "48px",
          }}
        >
          <SectionIcon icon={Zap} color="var(--orange, #d6a261)" />
          <h2
            style={{
              fontSize: "24px",
              fontWeight: 400,
              fontFamily:
                "var(--font-heading, Instrument Serif, Georgia, serif)",
              color: "var(--text-primary, #e6e8eb)",
              lineHeight: 1.2,
              margin: 0,
              paddingTop: "6px",
            }}
          >
            The Raw Power of Mythos in Cybersecurity
          </h2>
        </div>
        <p>
          What makes Mythos Preview qualitatively different from previous
          models isn&apos;t just benchmark scores &mdash; it&apos;s the
          nature of the capabilities. Here&apos;s what the evaluations
          revealed:
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "12px",
            margin: "24px 0",
          }}
        >
          {[
            {
              icon: Target,
              title: "Zero-Day Discovery",
              desc: "Independently found exploitable vulnerabilities in codebases it had never seen, including memory corruption bugs in C/C++ and logic flaws in web applications.",
              color: "#d87272",
            },
            {
              icon: Lock,
              title: "Exploit Chaining",
              desc: "Combined multiple low-severity vulnerabilities into high-impact attack chains, demonstrating strategic reasoning about defense-in-depth architectures.",
              color: "var(--orange, #d6a261)",
            },
            {
              icon: Globe,
              title: "Novel Techniques",
              desc: "Generated attack methodologies that don't appear in existing CVE databases or public exploit repositories. Genuinely new approaches to known problem classes.",
              color: "var(--blue, #8aa9cf)",
            },
            {
              icon: Shield,
              title: "Defensive Analysis",
              desc: "When prompted defensively, produced patch recommendations, detection signatures, and architectural hardening guides of expert quality.",
              color: "var(--teal, #86b8a8)",
            },
          ].map((cap) => (
            <div
              key={cap.title}
              style={{
                padding: "20px",
                borderRadius: "12px",
                border:
                  "1px solid var(--border, rgba(255,255,255,0.08))",
                background:
                  "var(--card-bg, rgba(255,255,255,0.03))",
              }}
            >
              <cap.icon
                size={18}
                style={{
                  color: cap.color,
                  marginBottom: "10px",
                }}
              />
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "var(--text-primary, #e6e8eb)",
                  marginBottom: "6px",
                }}
              >
                {cap.title}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  lineHeight: 1.6,
                  color: "var(--text-secondary, #abb2bc)",
                }}
              >
                {cap.desc}
              </div>
            </div>
          ))}
        </div>
        <p>
          The benchmarks tell part of the story: Mythos Preview scored 91%
          on CyberSecEval 3 (up from 67% for Claude Opus), solved 73% of
          previously-unseen CTF challenges autonomously, and generated
          working exploits for 4 out of 5 planted vulnerabilities in a
          controlled codebase &mdash; all within single-session interactions.
        </p>

        {/* Section 3: Project Glasswing */}
        <div
          style={{
            display: "flex",
            alignItems: "start",
            gap: "14px",
            marginBottom: "16px",
            marginTop: "48px",
          }}
        >
          <SectionIcon icon={ShieldCheck} color="var(--teal, #86b8a8)" />
          <h2
            style={{
              fontSize: "24px",
              fontWeight: 400,
              fontFamily:
                "var(--font-heading, Instrument Serif, Georgia, serif)",
              color: "var(--text-primary, #e6e8eb)",
              lineHeight: 1.2,
              margin: 0,
              paddingTop: "6px",
            }}
          >
            Project Glasswing &mdash; The Defensive Lockdown
          </h2>
        </div>
        <p>
          Anthropic didn&apos;t just restrict Mythos Preview and walk away.
          They launched{" "}
          <a
            href="https://www.anthropic.com/glasswing"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--teal, #86b8a8)",
              textDecoration: "none",
            }}
          >
            Project Glasswing
          </a>{" "}
          &mdash; a massive defensive initiative designed to ensure that AI
          capabilities tilt toward defenders, not attackers.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
            margin: "24px 0",
          }}
        >
          {[
            {
              value: "$100M",
              label: "API credits for defensive security startups",
            },
            {
              value: "$4M",
              label: "Direct donations to open-source security tools",
            },
            {
              value: "6+",
              label: "Elite security firms as founding partners",
            },
          ].map((stat) => (
            <div
              key={stat.value}
              style={{
                padding: "20px",
                borderRadius: "12px",
                border:
                  "1px solid color-mix(in srgb, var(--teal, #86b8a8) 20%, transparent)",
                background:
                  "linear-gradient(135deg, rgba(134, 184, 168, 0.06), transparent)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "var(--teal, #86b8a8)",
                  letterSpacing: "-0.02em",
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted, #7d8692)",
                  marginTop: "4px",
                  lineHeight: 1.4,
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        <p>The Glasswing partner roster reads like a cybersecurity hall of fame:</p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "8px",
            margin: "16px 0 24px",
          }}
        >
          {GLASSWING_PARTNERS.map((partner) => (
            <div
              key={partner.name}
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                border:
                  "1px solid var(--border, rgba(255,255,255,0.08))",
                background:
                  "var(--card-bg, rgba(255,255,255,0.03))",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <ShieldCheck
                size={14}
                style={{ color: "var(--teal, #86b8a8)", flexShrink: 0 }}
              />
              <div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--text-primary, #e6e8eb)",
                  }}
                >
                  {partner.name}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted, #7d8692)",
                  }}
                >
                  {partner.role}
                </div>
              </div>
            </div>
          ))}
        </div>
        <p>
          The message is clear: Anthropic is putting serious money behind
          the idea that frontier AI should make defenders stronger, not just
          attackers more dangerous. The $100M in API credits alone means that
          security startups can build on Mythos-class capabilities without
          the capital requirements that would normally be prohibitive.
        </p>

        {/* Section 4: Bitter Lesson */}
        <div
          style={{
            display: "flex",
            alignItems: "start",
            gap: "14px",
            marginBottom: "16px",
            marginTop: "48px",
          }}
        >
          <SectionIcon icon={BookOpen} color="var(--gold, #c2ab74)" />
          <h2
            style={{
              fontSize: "24px",
              fontWeight: 400,
              fontFamily:
                "var(--font-heading, Instrument Serif, Georgia, serif)",
              color: "var(--text-primary, #e6e8eb)",
              lineHeight: 1.2,
              margin: 0,
              paddingTop: "6px",
            }}
          >
            The Bitter Lesson of Simplicity
          </h2>
        </div>
        <p>
          As Nate B Jones pointed out in his analysis, this moment
          crystallizes the &ldquo;bitter lesson&rdquo; that Rich Sutton
          articulated years ago: general methods that leverage computation
          always beat specialized approaches. For cybersecurity, this means
          the era of hand-crafted detection rules and signature-based
          systems is ending.
        </p>
        <div
          style={{
            padding: "20px 24px",
            borderRadius: "12px",
            borderLeft: "3px solid var(--gold, #c2ab74)",
            background:
              "linear-gradient(135deg, rgba(194, 171, 116, 0.06), transparent)",
            margin: "24px 0",
            fontSize: "15px",
            lineHeight: 1.7,
          }}
        >
          The security industry has spent decades building increasingly
          complex rule sets, heuristics, and specialized tools. A single
          frontier model now matches or exceeds the detection capability of
          entire security teams on certain classes of vulnerabilities.
          That&apos;s not a trend &mdash; that&apos;s a phase transition.
        </div>
        <p>
          The models that will define the next decade of cybersecurity
          won&apos;t be the ones with the most hand-tuned features. They
          will be the ones with the most compute, the best training data, and
          the most capable reasoning. The &ldquo;bitter lesson&rdquo;
          applies to security just as it applies to chess, Go, and protein
          folding.
        </p>

        {/* Section 5: Traditional Tools Obsolete */}
        <div
          style={{
            display: "flex",
            alignItems: "start",
            gap: "14px",
            marginBottom: "16px",
            marginTop: "48px",
          }}
        >
          <SectionIcon icon={Megaphone} color="#d87272" />
          <h2
            style={{
              fontSize: "24px",
              fontWeight: 400,
              fontFamily:
                "var(--font-heading, Instrument Serif, Georgia, serif)",
              color: "var(--text-primary, #e6e8eb)",
              lineHeight: 1.2,
              margin: 0,
              paddingTop: "6px",
            }}
          >
            Why Traditional Security Tools Are Becoming Obsolete
          </h2>
        </div>
        <p>
          Consider the current state of enterprise security: dozens of
          point solutions, each generating alerts that a human analyst must
          triage. The average SOC receives over 11,000 alerts per day. The
          average dwell time for an attacker inside a compromised network is
          still measured in weeks.
        </p>
        <p>
          When a frontier model can autonomously discover zero-days and
          chain exploits, the attack surface doesn&apos;t just grow &mdash;
          it transforms. Static signatures can&apos;t detect novel attack
          patterns. Rule-based WAFs can&apos;t stop AI-generated payloads
          that are unique every time. SIEM correlation rules written by
          humans can&apos;t keep pace with an adversary that iterates at
          machine speed.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            margin: "24px 0",
          }}
        >
          <div
            style={{
              padding: "20px",
              borderRadius: "12px",
              border: "1px solid rgba(216, 114, 114, 0.2)",
              background:
                "linear-gradient(135deg, rgba(216, 114, 114, 0.06), transparent)",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "#d87272",
                marginBottom: "8px",
              }}
            >
              Legacy Approach
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: "16px",
                fontSize: "13px",
                lineHeight: 1.7,
                color: "var(--text-secondary, #abb2bc)",
              }}
            >
              <li>Static signature matching</li>
              <li>Manual alert triage (11K/day)</li>
              <li>Weekly threat intel updates</li>
              <li>Rule-based correlation</li>
              <li>Reactive patching cycles</li>
            </ul>
          </div>
          <div
            style={{
              padding: "20px",
              borderRadius: "12px",
              border:
                "1px solid color-mix(in srgb, var(--teal, #86b8a8) 20%, transparent)",
              background:
                "linear-gradient(135deg, rgba(134, 184, 168, 0.06), transparent)",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--teal, #86b8a8)",
                marginBottom: "8px",
              }}
            >
              AI-Native Approach
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: "16px",
                fontSize: "13px",
                lineHeight: 1.7,
                color: "var(--text-secondary, #abb2bc)",
              }}
            >
              <li>Behavioral anomaly detection</li>
              <li>Autonomous triage &amp; response</li>
              <li>Real-time threat synthesis</li>
              <li>Reasoning-based correlation</li>
              <li>Proactive vulnerability discovery</li>
            </ul>
          </div>
        </div>

        {/* Section 6: Strategic Moment */}
        <div
          style={{
            display: "flex",
            alignItems: "start",
            gap: "14px",
            marginBottom: "16px",
            marginTop: "48px",
          }}
        >
          <SectionIcon icon={TrendingUp} color="var(--teal, #86b8a8)" />
          <h2
            style={{
              fontSize: "24px",
              fontWeight: 400,
              fontFamily:
                "var(--font-heading, Instrument Serif, Georgia, serif)",
              color: "var(--text-primary, #e6e8eb)",
              lineHeight: 1.2,
              margin: 0,
              paddingTop: "6px",
            }}
          >
            The Strategic Moment &mdash; Why We Must Build Now
          </h2>
        </div>
        <p>
          The window between &ldquo;frontier AI can break things&rdquo; and
          &ldquo;frontier AI defends everything&rdquo; is where the
          opportunity lives. That window is open right now, and it won&apos;t
          stay open forever.
        </p>
        <p>Here&apos;s why timing matters:</p>
        <div
          style={{
            margin: "24px 0",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {[
            {
              num: "01",
              title: "Glasswing credits are available now",
              desc: "$100M in API credits means you can build with Mythos-class capabilities at near-zero marginal cost. This won't last.",
            },
            {
              num: "02",
              title: "Defenders have a head start",
              desc: "Mythos Preview is restricted, but defensive access is wide open through Glasswing. Attackers don't get this advantage.",
            },
            {
              num: "03",
              title: "Incumbents are slow",
              desc: "CrowdStrike, Palo Alto, and SentinelOne are integrating AI — but they're bolting it onto legacy architectures. AI-native wins.",
            },
            {
              num: "04",
              title: "The talent pool is exploding",
              desc: "Every security researcher now has a force multiplier. Small teams with AI can outperform large teams without it.",
            },
          ].map((point) => (
            <div
              key={point.num}
              style={{
                padding: "16px 20px",
                borderRadius: "10px",
                border:
                  "1px solid var(--border, rgba(255,255,255,0.08))",
                background:
                  "var(--card-bg, rgba(255,255,255,0.03))",
                display: "flex",
                gap: "14px",
                alignItems: "start",
              }}
            >
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "var(--teal, #86b8a8)",
                  opacity: 0.5,
                  lineHeight: 1,
                  flexShrink: 0,
                  marginTop: "2px",
                  fontFamily: "var(--font-mono, monospace)",
                }}
              >
                {point.num}
              </span>
              <div>
                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "var(--text-primary, #e6e8eb)",
                    marginBottom: "4px",
                  }}
                >
                  {point.title}
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    lineHeight: 1.6,
                    color: "var(--text-secondary, #abb2bc)",
                  }}
                >
                  {point.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Section 7: CTA */}
        <div
          style={{
            display: "flex",
            alignItems: "start",
            gap: "14px",
            marginBottom: "16px",
            marginTop: "48px",
          }}
        >
          <SectionIcon icon={Flame} color="var(--orange, #d6a261)" />
          <h2
            style={{
              fontSize: "24px",
              fontWeight: 400,
              fontFamily:
                "var(--font-heading, Instrument Serif, Georgia, serif)",
              color: "var(--text-primary, #e6e8eb)",
              lineHeight: 1.2,
              margin: 0,
              paddingTop: "6px",
            }}
          >
            The Moment to Build Is Now
          </h2>
        </div>
        <p>
          We are at an inflection point that happens maybe once a decade in
          technology. The equivalent of the cloud transition in 2010, the
          mobile explosion in 2008, the internet itself in 1995. Frontier AI
          has made cybersecurity simultaneously more dangerous and more
          defensible &mdash; and the builders who move first will define the
          next generation of security infrastructure.
        </p>
        <p>
          The question isn&apos;t whether AI-native security tools will
          replace the current stack. The question is who builds them, and
          how fast.
        </p>
        <div
          style={{
            padding: "28px 24px",
            borderRadius: "12px",
            border:
              "1px solid color-mix(in srgb, var(--teal, #86b8a8) 25%, transparent)",
            background:
              "linear-gradient(135deg, rgba(134, 184, 168, 0.08), rgba(8, 10, 16, 0.96))",
            margin: "32px 0",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "17px",
              color: "var(--text-primary, #e6e8eb)",
              marginBottom: "16px",
              lineHeight: 1.6,
            }}
          >
            If you&apos;re building at the intersection of AI and
            cybersecurity &mdash; or want to start &mdash; the resources,
            the funding, and the compute are all available right now.
            The only thing missing is builders.
          </p>
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <a
              href="https://www.anthropic.com/glasswing"
              target="_blank"
              rel="noopener noreferrer"
              className="vf-button-primary vf-landing-cta-glow"
            >
              <ShieldCheck size={14} />
              Explore Project Glasswing
            </a>
            <Link href="/cybersecurity" className="vf-button-secondary">
              More Research
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Divider */}
        <hr
          style={{
            border: "none",
            borderTop:
              "1px solid var(--border, rgba(255,255,255,0.08))",
            margin: "48px 0 32px",
          }}
        />

        {/* Share */}
        <div style={{ marginBottom: "48px" }}>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--text-muted, #7d8692)",
              marginBottom: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Share this article
          </div>
          <ShareButtons url={articleUrl} title={articleTitle} />
        </div>

        {/* Sources */}
        <div
          style={{
            padding: "20px 24px",
            borderRadius: "12px",
            border:
              "1px solid var(--border, rgba(255,255,255,0.08))",
            background:
              "var(--card-bg, rgba(255,255,255,0.03))",
            marginBottom: "48px",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--text-muted, #7d8692)",
              marginBottom: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Sources &amp; Further Reading
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              fontSize: "13px",
            }}
          >
            <a
              href="https://red.anthropic.com/2026/mythos-preview/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "var(--teal, #86b8a8)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              Anthropic Red Team Report: Mythos Preview Cybersecurity
              Evaluation
              <ExternalLink size={10} />
            </a>
            <a
              href="https://www.anthropic.com/glasswing"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "var(--teal, #86b8a8)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              Project Glasswing: Anthropic&apos;s Defensive AI Initiative
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </article>

      {/* ═══ Related Articles ═══ */}
      <section
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "0 24px 80px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 400,
            fontFamily:
              "var(--font-heading, Instrument Serif, Georgia, serif)",
            color: "var(--text-primary, #e6e8eb)",
            marginBottom: "16px",
          }}
        >
          Related Research
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "12px",
          }}
        >
          {RELATED_ARTICLES.map((article) => (
            <Link
              key={article.title}
              href={article.href}
              style={{
                padding: "20px",
                borderRadius: "12px",
                border:
                  "1px solid var(--border, rgba(255,255,255,0.08))",
                background:
                  "var(--card-bg, rgba(255,255,255,0.03))",
                textDecoration: "none",
                transition: "border-color 0.15s",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--teal, #86b8a8)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontWeight: 600,
                }}
              >
                {article.tag}
              </span>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--text-primary, #e6e8eb)",
                  marginTop: "6px",
                  lineHeight: 1.4,
                }}
              >
                {article.title}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
