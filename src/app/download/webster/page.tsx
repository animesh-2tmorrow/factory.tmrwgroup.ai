"use client";

import { useState } from "react";
import Link from "next/link";

export default function WebsterDownloadPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAFAF7",
        fontFamily: "DM Sans, system-ui, sans-serif",
        color: "#1A1814",
      }}
    >
      {/* Nav */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 32px",
          maxWidth: "1200px",
          margin: "0 auto",
          borderBottom: "1px solid #E8E4DE",
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            textDecoration: "none",
            color: "#1A1814",
            fontWeight: 700,
            fontSize: "18px",
          }}
        >
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#2DD4BF",
              display: "inline-block",
            }}
          />
          Venture Factory
        </Link>

        {/* Desktop links */}
        <div
          style={{ display: "flex", alignItems: "center", gap: "32px" }}
          className="download-desktop-nav"
        >
          <Link
            href="/"
            style={{
              fontSize: "14px",
              color: "#6B6560",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Home
          </Link>
          <Link
            href="/watch/webster"
            style={{
              fontSize: "14px",
              color: "#6B6560",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Watch Demo
          </Link>
          <Link
            href="/login"
            style={{
              fontSize: "14px",
              color: "#6B6560",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Dashboard
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="download-mobile-btn"
          style={{
            display: "none",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            color: "#1A1814",
            fontSize: "20px",
          }}
        >
          {menuOpen ? "\u2715" : "\u2630"}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            padding: "20px 32px",
            borderBottom: "1px solid #E8E4DE",
          }}
        >
          <Link
            href="/"
            style={{
              fontSize: "16px",
              color: "#1A1814",
              textDecoration: "none",
              fontWeight: 500,
              padding: "8px 0",
            }}
          >
            Home
          </Link>
          <Link
            href="/watch/webster"
            style={{
              fontSize: "16px",
              color: "#1A1814",
              textDecoration: "none",
              fontWeight: 500,
              padding: "8px 0",
            }}
          >
            Watch Demo
          </Link>
          <Link
            href="/login"
            style={{
              fontSize: "16px",
              color: "#1A1814",
              textDecoration: "none",
              fontWeight: 500,
              padding: "8px 0",
            }}
          >
            Dashboard
          </Link>
        </div>
      )}

      {/* Content */}
      <main
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "48px 24px",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#2DD4BF20",
            color: "#0D9488",
            padding: "6px 12px",
            borderRadius: "100px",
            fontSize: "12px",
            fontWeight: 600,
            marginBottom: "16px",
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2DD4BF" }} />
          Chrome Extension
        </div>

        <h1
          style={{
            fontSize: "36px",
            fontWeight: 400,
            color: "#1A1814",
            marginBottom: "8px",
            marginTop: 0,
            fontFamily: "Instrument Serif, Georgia, serif",
          }}
        >
          Download Webster
        </h1>
        <p
          style={{
            fontSize: "16px",
            color: "#6B6560",
            marginBottom: "32px",
            lineHeight: 1.6,
          }}
        >
          Webster is an AI-powered Marketo operations assistant built by TMRW Group.
          It embeds directly in your Marketo instance — configure campaigns, export data,
          and automate marketing ops via natural language. Install the Chrome extension to get started.
        </p>

        {/* Download Card */}
        <div
          style={{
            borderRadius: "12px",
            border: "1px solid #E8E4DE",
            marginBottom: "32px",
            background: "#fff",
            padding: "32px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #2DD4BF 0%, #0D9488 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: "28px",
                fontWeight: 700,
              }}
            >
              W
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 600 }}>
                Webster Chrome Extension
              </h2>
              <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#6B6560" }}>
                Version 1.0.0 &middot; Marketo MVP &middot; 126 KB
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="https://tmrw-webster-downloads.s3.amazonaws.com/webster-v1.0.0.crx"
              download="webster-v1.0.0.crx"
              target="_self"
              rel="noopener"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "14px 28px",
                background: "#1A1814",
                color: "#fff",
                borderRadius: "100px",
                textDecoration: "none",
                fontSize: "15px",
                fontWeight: 600,
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download .crx
            </a>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="https://tmrw-webster-downloads.s3.amazonaws.com/webster-v1.0.0.zip"
              download="webster-v1.0.0.zip"
              target="_self"
              rel="noopener"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "14px 28px",
                background: "#fff",
                color: "#1A1814",
                border: "1px solid #1A1814",
                borderRadius: "100px",
                textDecoration: "none",
                fontSize: "15px",
                fontWeight: 600,
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download .zip (Load Unpacked)
            </a>
          </div>
        </div>

        {/* Installation Steps */}
        <h2
          style={{
            fontSize: "24px",
            fontWeight: 400,
            color: "#1A1814",
            marginBottom: "24px",
            fontFamily: "Instrument Serif, Georgia, serif",
          }}
        >
          Installation Steps
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "48px" }}>
          {[
            {
              step: 1,
              title: "Download & Extract",
              desc: "Click the download button above and extract the ZIP file to a folder on your computer.",
            },
            {
              step: 2,
              title: "Open Chrome Extensions",
              desc: (
                <>
                  Navigate to <code style={{ background: "#F3F2EF", padding: "2px 6px", borderRadius: "4px", fontSize: "13px" }}>chrome://extensions</code> in your Chrome browser.
                </>
              ),
            },
            {
              step: 3,
              title: "Enable Developer Mode",
              desc: "Toggle on \"Developer mode\" in the top right corner of the extensions page.",
            },
            {
              step: 4,
              title: "Load Unpacked",
              desc: "Click \"Load unpacked\" and select the extracted folder containing the manifest.json file.",
            },
            {
              step: 5,
              title: "Pin the Extension",
              desc: "Click the puzzle piece icon in Chrome toolbar and pin Webster for easy access.",
            },
          ].map((item) => (
            <div
              key={item.step}
              style={{
                display: "flex",
                gap: "16px",
                padding: "20px",
                borderRadius: "12px",
                border: "1px solid #E8E4DE",
                background: "#fff",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "#2DD4BF20",
                  color: "#0D9488",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "14px",
                  flexShrink: 0,
                }}
              >
                {item.step}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>
                  {item.title}
                </h3>
                <p style={{ margin: 0, fontSize: "14px", color: "#6B6560", lineHeight: 1.5 }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Full Setup Guide ── */}
        <div style={{ borderTop: "1px solid #E8E4DE", marginTop: "16px", paddingTop: "48px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 400, color: "#1A1814", marginBottom: "8px", fontFamily: "Instrument Serif, Georgia, serif" }}>
            Complete Setup Guide
          </h2>
          <p style={{ fontSize: "14px", color: "#6B6560", marginBottom: "32px" }}>
            Follow these steps to set up your Venture Factory account, create a Webster agent, and connect the Chrome extension.
          </p>

          {/* Part 1 */}
          <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", marginTop: "32px" }}>Part 1: Account Setup &amp; Subscription</h3>
          {[
            { step: 1, title: "Visit Venture Factory", desc: <>Navigate to <a href="https://factory.tmrwgroup.ai" style={{ color: "#0D9488" }}>factory.tmrwgroup.ai</a> and click <strong>&quot;Login to Dashboard&quot;</strong>.</> },
            { step: 2, title: "Sign In with Google", desc: <>Click <strong>&quot;Continue with Google&quot;</strong> and sign in with your Google account.</> },
            { step: 3, title: "Purchase Starter Subscription", desc: <>After logging in, you&apos;ll be redirected to the Billing page. Click <strong>&quot;Buy Starter&quot;</strong> ($49/mo). Includes up to 3 cloud agents, TMRW Cloud Runtime, session chat + usage tracking, and standard ECS provisioning.</> },
            { step: 4, title: "Complete Stripe Checkout", desc: <>Enter your payment details and complete checkout. After payment, click <strong>&quot;New Agent&quot;</strong> to create your Webster agent.</> },
          ].map((item) => (
            <div key={item.step} style={{ display: "flex", gap: "16px", padding: "16px 20px", borderRadius: "12px", border: "1px solid #E8E4DE", background: "#fff", marginBottom: "12px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#2DD4BF20", color: "#0D9488", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "13px", flexShrink: 0 }}>{item.step}</div>
              <div>
                <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 600, marginBottom: "4px" }}>{item.title}</h4>
                <p style={{ margin: 0, fontSize: "14px", color: "#6B6560", lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            </div>
          ))}

          {/* Part 2 */}
          <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", marginTop: "32px" }}>Part 2: Creating Your Webster Agent</h3>
          {[
            { step: 5, title: "Configure Agent", desc: <>On the New Agent page, set <strong>Agent Name</strong> to <code style={{ background: "#F3F2EF", padding: "2px 6px", borderRadius: "4px", fontSize: "13px" }}>webster-marketo</code>. Add runtime instructions describing Webster as a Marketo operations assistant. Click <strong>&quot;Next: Runtime&quot;</strong>.</> },
            { step: 6, title: "Select Runtime", desc: <>Keep <strong>&quot;TMRW Cloud Runtime&quot;</strong> selected (Shell, Read/Write, Web tools on AWS ECS Fargate). Click <strong>&quot;Next: Review&quot;</strong>.</> },
            { step: 7, title: "Review & Deploy", desc: <>Review your agent configuration and click <strong>&quot;Create and Deploy Agent&quot;</strong>. Deployment takes about 1-2 minutes.</> },
            { step: 8, title: "Copy Agent ID", desc: <>Once deployed, your agent appears in the Agents list. <strong>Copy your Agent ID</strong> from the URL or agent card &mdash; you&apos;ll need this for the extension.</> },
          ].map((item) => (
            <div key={item.step} style={{ display: "flex", gap: "16px", padding: "16px 20px", borderRadius: "12px", border: "1px solid #E8E4DE", background: "#fff", marginBottom: "12px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#2DD4BF20", color: "#0D9488", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "13px", flexShrink: 0 }}>{item.step}</div>
              <div>
                <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 600, marginBottom: "4px" }}>{item.title}</h4>
                <p style={{ margin: 0, fontSize: "14px", color: "#6B6560", lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            </div>
          ))}

          {/* Part 3 */}
          <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", marginTop: "32px" }}>Part 3: Connecting Webster to Marketo</h3>
          {[
            { step: 9, title: "Navigate to Marketo", desc: <>Go to <strong>experience.adobe.com</strong>, sign in with your Adobe ID, and navigate to <strong>Marketo Engage</strong>.</> },
            { step: 10, title: "Open Webster Sidebar", desc: <>Press <code style={{ background: "#F3F2EF", padding: "2px 6px", borderRadius: "4px", fontSize: "13px" }}>Ctrl + Shift + W</code> or click the Webster extension icon to open the sidebar.</> },
            { step: 11, title: "Configure Agent Connection", desc: <>Click the <strong>Settings</strong> (gear) icon in the sidebar. Enter your <strong>Agent ID</strong> (from Step 8) and set Backend URL to <code style={{ background: "#F3F2EF", padding: "2px 6px", borderRadius: "4px", fontSize: "13px" }}>https://factory.tmrwgroup.ai</code>. Click <strong>&quot;Connect Agent&quot;</strong>.</> },
            { step: 12, title: "(Optional) Add Marketo API Credentials", desc: <>For direct API access, add your Marketo Instance URL, Client ID, and Client Secret. Find these in Marketo Admin &rarr; Web Services &rarr; REST API Endpoint.</> },
          ].map((item) => (
            <div key={item.step} style={{ display: "flex", gap: "16px", padding: "16px 20px", borderRadius: "12px", border: "1px solid #E8E4DE", background: "#fff", marginBottom: "12px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#2DD4BF20", color: "#0D9488", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "13px", flexShrink: 0 }}>{item.step}</div>
              <div>
                <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 600, marginBottom: "4px" }}>{item.title}</h4>
                <p style={{ margin: 0, fontSize: "14px", color: "#6B6560", lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            </div>
          ))}

          {/* Example Commands */}
          <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", marginTop: "32px" }}>Example Commands</h3>
          <div style={{ borderRadius: "12px", border: "1px solid #E8E4DE", background: "#fff", overflow: "hidden", marginBottom: "32px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #E8E4DE", background: "#FAFAF7" }}>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: "#1A1814" }}>Task</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 600, color: "#1A1814" }}>Example Prompt</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["List programs", "\"List all my programs\""],
                  ["Create campaign", "\"Create a Smart Campaign for lead scoring\""],
                  ["Build nurture", "\"Help me build an email nurture flow\""],
                  ["Audit filters", "\"Audit my Smart List filters for issues\""],
                  ["Route leads", "\"Route MQLs to the right sales team\""],
                  ["Clean data", "\"Clean duplicates from this list\""],
                  ["Instance info", "\"What Marketo instance am I on?\""],
                  ["Export emails", "\"Show me all emails in this instance\""],
                ].map(([task, prompt], i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #E8E4DE" }}>
                    <td style={{ padding: "10px 16px", color: "#1A1814" }}>{task}</td>
                    <td style={{ padding: "10px 16px", color: "#6B6560" }}>{prompt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Troubleshooting */}
          <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", marginTop: "32px" }}>Troubleshooting</h3>
          {[
            { title: "Sidebar doesn't appear", items: ["Ensure you're on a Marketo URL (experience.adobe.com)", "Reload the extension in chrome://extensions/", "Refresh the Marketo page"] },
            { title: "\"Agent not found\" error", items: ["Verify your Agent ID is correct", "Ensure your subscription is active", "Check that the agent status is \"Running\" in Factory"] },
            { title: "Connection error", items: ["Check your internet connection", "Verify Backend URL is https://factory.tmrwgroup.ai", "Try refreshing the page"] },
          ].map((section) => (
            <div key={section.title} style={{ padding: "16px 20px", borderRadius: "12px", border: "1px solid #E8E4DE", background: "#fff", marginBottom: "12px" }}>
              <h4 style={{ margin: "0 0 8px", fontSize: "15px", fontWeight: 600 }}>{section.title}</h4>
              <ul style={{ margin: 0, paddingLeft: "20px" }}>
                {section.items.map((item, i) => (
                  <li key={i} style={{ fontSize: "14px", color: "#6B6560", lineHeight: 1.6 }}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", gap: "12px", marginTop: "32px", marginBottom: "48px", flexWrap: "wrap" }}>
          <Link href="/watch/webster" style={{ padding: "12px 24px", background: "transparent", color: "#1A1814", border: "1px solid #1A1814", borderRadius: "100px", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>
            Watch Setup Video &rarr;
          </Link>
          <Link href="/login" style={{ padding: "12px 24px", background: "transparent", color: "#1A1814", border: "1px solid #E8E4DE", borderRadius: "100px", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>
            Open Dashboard &rarr;
          </Link>
        </div>

        <p style={{ fontSize: "13px", color: "#9B9590" }}>
          Built by TMRW Group &middot; Venture Factory &middot; 2026
        </p>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid #E8E4DE",
          padding: "32px",
          textAlign: "center",
          color: "#6B6560",
          fontSize: "13px",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        TMRW Group &middot; Venture Factory &middot; 2026
      </footer>

      <style>{`
        @media (max-width: 640px) {
          .download-desktop-nav { display: none !important; }
          .download-mobile-btn { display: block !important; }
          h1 { font-size: 28px !important; }
          main { padding: 32px 16px !important; }
        }
      `}</style>
    </div>
  );
}
