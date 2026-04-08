"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "getting-started", label: "Getting Started" },
  { id: "webster", label: "Webster" },
  { id: "dashboard", label: "Dashboard" },
  { id: "agents", label: "Agents" },
  { id: "new-agent", label: "New Agent" },
  { id: "public-links", label: "Public Links" },
  { id: "faq", label: "FAQ" },
];

function SectionNav({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="vf-tabs" style={{ marginBottom: "var(--space-6)" }}>
      {SECTIONS.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          className={`vf-button-ghost vf-tab-button ${active === s.id ? "active" : ""}`}
          style={{ fontSize: "var(--text-xs)", padding: "0.4rem 0.75rem" }}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="vf-title" style={{ marginBottom: "var(--space-4)" }}>
      {children}
    </h2>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontSize: "var(--text-md)",
        fontWeight: 600,
        marginBottom: "var(--space-3)",
        marginTop: "var(--space-5)",
        color: "var(--teal)",
      }}
    >
      {children}
    </h3>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        color: "var(--text-secondary)",
        fontSize: "var(--text-sm)",
        lineHeight: 1.7,
        marginBottom: "var(--space-4)",
      }}
    >
      {children}
    </p>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="vf-card vf-card-pad" style={{ marginBottom: "var(--space-5)" }}>{children}</div>;
}

function Code({ children }: { children: string }) {
  return <code className="vf-code-inline">{children}</code>;
}

function TableRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <tr style={{ borderBottom: "1px solid var(--border)" }}>
      <td
        style={{
          padding: "var(--space-2) var(--space-3)",
          fontSize: "var(--text-sm)",
          fontWeight: 500,
          color: "var(--text-muted)",
          width: "32%",
          verticalAlign: "top",
        }}
      >
        {label}
      </td>
      <td
        style={{
          padding: "var(--space-2) var(--space-3)",
          fontSize: "var(--text-sm)",
          color: "var(--text-primary)",
        }}
      >
        {value}
      </td>
    </tr>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        borderBottom: "1px solid var(--border)",
        padding: "var(--space-3) 0",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          textAlign: "left",
          background: "none",
          border: "none",
          color: "var(--text-primary)",
          fontSize: "var(--text-sm)",
          fontWeight: 500,
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "var(--space-1) 0",
        }}
      >
        {q}
        <span
          style={{
            color: "var(--teal)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            fontSize: 12,
          }}
        >
          v
        </span>
      </button>
      {open && (
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "var(--text-sm)",
            lineHeight: 1.7,
            marginTop: "var(--space-2)",
            paddingLeft: "var(--space-2)",
          }}
        >
          {a}
        </p>
      )}
    </div>
  );
}

export default function DocsPage() {
  const [section, setSection] = useState("overview");

  return (
    <>
      <Header title="Documentation" description="Current guide for Venture Factory" />
      <div className="page-container">
        <SectionNav active={section} onSelect={setSection} />

        {section === "overview" && (
          <>
            <Heading>Current Product Surface</Heading>
            <Paragraph>
              This documentation reflects the current live app. The authenticated workspace now focuses on
              Dashboard, Agents, New Agent, and Docs, with public pages exposed separately.
            </Paragraph>
            <Card>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <TableRow label="Base URL" value={<Code>https://factory.tmrwgroup.ai</Code>} />
                  <TableRow label="Public Home" value={<Code>/</Code>} />
                  <TableRow label="Dashboard (auth)" value={<Code>/dashboard</Code>} />
                  <TableRow label="Core Nav" value="Dashboard, Agents, New Agent, Docs" />
                  <TableRow label="Public Links" value="District, Collective, Watch, TMRW Home" />
                  <TableRow label="Access" value="Google OAuth with allowlist" />
                  <TableRow label="Stack" value="Next.js 16, React 19, TypeScript, Prisma, PostgreSQL" />
                </tbody>
              </table>
            </Card>
          </>
        )}

        {section === "getting-started" && (
          <>
            <Heading>Getting Started</Heading>
            <Paragraph>Use this flow for day-to-day operations.</Paragraph>
            <Card>
              <ol style={{ margin: 0, paddingLeft: "1.2rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
                <li>Open <Code>https://factory.tmrwgroup.ai</Code>.</li>
                <li>Click <strong style={{ color: "var(--text-primary)" }}>Login to Dashboard</strong>.</li>
                <li>Authenticate with your whitelisted Google account.</li>
                <li>You will be redirected to <Code>/billing</Code> if no callback URL is supplied.</li>
                <li>Use <Code>New Agent</Code> to begin a deployment workflow.</li>
              </ol>
            </Card>
          </>
        )}

        {section === "webster" && (
          <>
            <Heading>Webster Chrome Extension</Heading>
            <Paragraph>
              Webster is an AI-powered Chrome extension for natural language configuration of marketing operations tools.
              It connects to Venture Factory agents to execute commands in Marketo, HubSpot, Segment, and Salesforce.
            </Paragraph>

            <SubHeading>1. Create a Webster Agent</SubHeading>
            <Card>
              <ol style={{ margin: 0, paddingLeft: "1.2rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
                <li>Go to <strong style={{ color: "var(--text-primary)" }}>New Agent</strong> in the sidebar.</li>
                <li>Enter agent name: <Code>webster-[your-name]</Code></li>
                <li>Paste the Runtime Instructions (see below).</li>
                <li>Select <strong style={{ color: "var(--text-primary)" }}>Webster Chrome Runtime</strong> on the Runtime tab.</li>
                <li>Click <strong style={{ color: "var(--text-primary)" }}>Create and Deploy Agent</strong>.</li>
                <li>Wait for status to change from &quot;Provisioning&quot; to &quot;Running&quot;.</li>
              </ol>
            </Card>

            <SubHeading>2. Recommended Runtime Instructions</SubHeading>
            <Card>
              <pre style={{
                margin: 0,
                padding: "var(--space-3)",
                background: "var(--surface-2)",
                borderRadius: "var(--radius-sm)",
                fontSize: "var(--text-xs)",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                color: "var(--text-secondary)"
              }}>
{`You are Webster, an AI assistant specialized in Adobe Marketo Engage configuration and marketing operations. You help users manage their Marketo instance through natural language commands.

Your capabilities include:
- Listing and searching programs, smart campaigns, emails, forms, and landing pages
- Creating, cloning, and managing marketing assets
- Activating and deactivating smart campaigns
- Managing program tokens
- Navigating folder structures

Always be helpful, precise, and confirm destructive actions before executing them. When listing assets, provide clear summaries. When creating or modifying assets, confirm the details before proceeding.`}
              </pre>
            </Card>

            <SubHeading>3. Get Your Agent ID</SubHeading>
            <Card>
              <ol style={{ margin: 0, paddingLeft: "1.2rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
                <li>Go to <strong style={{ color: "var(--text-primary)" }}>Agents</strong> in the sidebar.</li>
                <li>Find your agent and click <strong style={{ color: "var(--text-primary)" }}>Open Chat</strong>.</li>
                <li>Copy the Agent ID from the URL: <Code>/agents/[AGENT-ID]/chat</Code></li>
              </ol>
            </Card>

            <SubHeading>4. Install Chrome Extension</SubHeading>
            <Card>
              <ol style={{ margin: 0, paddingLeft: "1.2rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
                <li>Extract <Code>webster-extension-v0.1.0.zip</Code> to a permanent folder.</li>
                <li>Open Chrome and go to <Code>chrome://extensions/</Code></li>
                <li>Enable <strong style={{ color: "var(--text-primary)" }}>Developer mode</strong> (top-right toggle).</li>
                <li>Click <strong style={{ color: "var(--text-primary)" }}>Load unpacked</strong> and select the extracted folder.</li>
                <li>Pin the Webster extension for easy access.</li>
              </ol>
            </Card>

            <SubHeading>5. Connect Extension to Agent</SubHeading>
            <Card>
              <ol style={{ margin: 0, paddingLeft: "1.2rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
                <li>Navigate to your Marketo instance.</li>
                <li>Click the Webster extension icon to open the sidebar.</li>
                <li>Click the <strong style={{ color: "var(--text-primary)" }}>Settings</strong> gear icon.</li>
                <li>Enter your <strong style={{ color: "var(--text-primary)" }}>Agent ID</strong> from step 3.</li>
                <li>Set Backend URL to <Code>https://factory.tmrwgroup.ai</Code></li>
                <li>Click <strong style={{ color: "var(--text-primary)" }}>Connect Agent</strong>.</li>
              </ol>
            </Card>

            <SubHeading>6. Example Commands</SubHeading>
            <Card>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <TableRow label="List assets" value={<><Code>List all my programs</Code> / <Code>Show smart campaigns</Code></>} />
                  <TableRow label="Search" value={<><Code>Find emails containing &apos;Welcome&apos;</Code></>} />
                  <TableRow label="Create" value={<><Code>Create a program called &apos;Q2 Webinar&apos; in Events folder</Code></>} />
                  <TableRow label="Clone" value={<><Code>Clone the Welcome Email as &apos;Welcome v2&apos;</Code></>} />
                  <TableRow label="Manage" value={<><Code>Activate the Lead Scoring campaign</Code></>} />
                  <TableRow label="Tokens" value={<><Code>What tokens are on program ID 1234?</Code></>} />
                  <TableRow label="Analyze" value={<><Code>Analyze campaign performance metrics</Code></>} />
                </tbody>
              </table>
            </Card>

            <SubHeading>Supported Platforms</SubHeading>
            <Card>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <TableRow label="Marketo" value="40+ tools (Primary)" />
                  <TableRow label="HubSpot" value="28 tools" />
                  <TableRow label="Segment" value="16 tools" />
                  <TableRow label="Salesforce" value="28 tools" />
                </tbody>
              </table>
            </Card>

            <SubHeading>Troubleshooting</SubHeading>
            <Card>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <TableRow label="Extension not loading" value="Check chrome://extensions/ is enabled, reload extension" />
                  <TableRow label="Agent not responding" value="Verify Agent status is 'Running' in /agents" />
                  <TableRow label="Tools not executing" value="Ensure you're logged into Marketo in the same browser" />
                  <TableRow label="Session expired" value="Refresh Marketo page and re-login" />
                </tbody>
              </table>
            </Card>
          </>
        )}

        {section === "dashboard" && (
          <>
            <Heading>Dashboard</Heading>
            <Paragraph>
              Dashboard provides the control view: plan status, billing state, runtime counts, and quick actions.
            </Paragraph>
            <Card>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <TableRow label="Route" value={<Code>/dashboard</Code>} />
                  <TableRow label="Top-right links" value="Collective, District, Watch, TMRW Home" />
                  <TableRow label="Main CTA" value="Create Agent" />
                  <TableRow label="Quick actions" value="New Agent, Agents, District, Collective" />
                </tbody>
              </table>
            </Card>
          </>
        )}

        {section === "agents" && (
          <>
            <Heading>Agents</Heading>
            <Paragraph>
              Agents is the runtime status page for deployed workloads. It is used to confirm provisioning,
              running state, and failure conditions.
            </Paragraph>
            <Card>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <TableRow label="Route" value={<Code>/agents</Code>} />
                  <TableRow label="Purpose" value="Monitor status and runtime health" />
                  <TableRow label="Typical statuses" value="QUEUED, PROVISIONING, RUNNING, FAILED, STOPPED" />
                </tbody>
              </table>
            </Card>
          </>
        )}

        {section === "new-agent" && (
          <>
            <Heading>New Agent</Heading>
            <Paragraph>
              New Agent is the creation flow for launching Cloud Agent runtimes on ECS. Billing must be active
              before creation is enabled.
            </Paragraph>
            <Card>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <TableRow label="Route" value={<Code>/create</Code>} />
                  <TableRow label="Prerequisite" value="Active billing plan" />
                  <TableRow label="Output" value="New cloud agent record and ECS task provisioning" />
                </tbody>
              </table>
            </Card>
          </>
        )}

        {section === "public-links" && (
          <>
            <Heading>Public Links</Heading>
            <Paragraph>
              These routes are intentionally accessible without dashboard login.
            </Paragraph>
            <Card>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <TableRow label="Home" value={<Code>/</Code>} />
                  <TableRow label="District" value={<Code>/district</Code>} />
                  <TableRow label="Collective" value={<Code>/collective</Code>} />
                  <TableRow label="Watch" value={<Code>/watch</Code>} />
                  <TableRow label="Login" value={<Code>/login</Code>} />
                </tbody>
              </table>
            </Card>
            <SubHeading>Auth behavior</SubHeading>
            <Paragraph>
              Private routes redirect to <Code>/login?callbackUrl=...</Code>. After successful login, users are
              redirected to the requested page, defaulting to <Code>/billing</Code>.
            </Paragraph>
          </>
        )}

        {section === "faq" && (
          <>
            <Heading>Frequently Asked Questions</Heading>
            <Card>
              <FAQItem
                q="Why do I land on /billing after login?"
                a="The default callback now routes to /billing so new users can select a plan before entering private workspace routes."
              />
              <FAQItem
                q="Why are Templates/Pipeline/Context/Infrastructure missing from sidebar?"
                a="The sidebar was intentionally simplified to Dashboard, Agents, New Agent, and Docs."
              />
              <FAQItem
                q="Are District and Collective private?"
                a="No. District, Collective, and Watch are configured as public routes on this app."
              />
              <FAQItem
                q="Where should issues be reported?"
                a="Report app/runtime issues to the platform team. Include URL, timestamp, and expected vs actual behavior."
              />
              <FAQItem
                q="How do I set up Webster for Marketo?"
                a="See the Webster tab in this documentation. You need to: 1) Create a Webster agent with the recommended prompt, 2) Install the Chrome extension, 3) Connect using your Agent ID and the backend URL https://factory.tmrwgroup.ai."
              />
              <FAQItem
                q="What runtime should I use for Webster?"
                a="Select 'Webster Chrome Runtime' when creating your agent. This preloads the Webster workspace and optimizes for browser-based tool execution."
              />
            </Card>
          </>
        )}
      </div>
    </>
  );
}
