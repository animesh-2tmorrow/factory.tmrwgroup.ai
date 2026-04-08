"use client";

import { useState } from "react";

export default function WatchPage() {
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
        <a
          href="https://tmrwgroup.ai"
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
              background: "#FF6B35",
              display: "inline-block",
            }}
          />
          TMRW Group
        </a>

        {/* Desktop links */}
        <div
          style={{ display: "flex", alignItems: "center", gap: "32px" }}
          className="watch-desktop-nav"
        >
          <a
            href="https://tmrwgroup.ai"
            style={{
              fontSize: "14px",
              color: "#6B6560",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Home
          </a>
          <a
            href="/district"
            style={{
              fontSize: "14px",
              color: "#6B6560",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Factory
          </a>
          <a
            href="/collective"
            style={{
              fontSize: "14px",
              color: "#6B6560",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Hire
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="watch-mobile-btn"
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
          <a
            href="https://tmrwgroup.ai"
            style={{
              fontSize: "16px",
              color: "#1A1814",
              textDecoration: "none",
              fontWeight: 500,
              padding: "8px 0",
            }}
          >
            Home
          </a>
          <a
            href="/district"
            style={{
              fontSize: "16px",
              color: "#1A1814",
              textDecoration: "none",
              fontWeight: 500,
              padding: "8px 0",
            }}
          >
            Factory
          </a>
          <a
            href="/collective"
            style={{
              fontSize: "16px",
              color: "#1A1814",
              textDecoration: "none",
              fontWeight: 500,
              padding: "8px 0",
            }}
          >
            Hire
          </a>
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
          The Autonomous Agent Factory
        </h1>
        <p
          style={{
            fontSize: "16px",
            color: "#6B6560",
            marginBottom: "32px",
            lineHeight: 1.6,
          }}
        >
          How TMRW Group built an autonomous agentic factory in one week. Jobs
          go in, agents execute, results come back.
        </p>

        {/* Video Player */}
        <div
          style={{
            borderRadius: "12px",
            overflow: "hidden",
            border: "1px solid #E8E4DE",
            marginBottom: "32px",
            background: "#000",
          }}
        >
          <video
            controls
            preload="metadata"
            playsInline
            style={{ width: "100%", display: "block" }}
          >
            <source
              src="/videos/webster-demo.mp4"
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>
        </div>

        {/* CTAs */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "48px",
            flexWrap: "wrap",
          }}
        >
          <a
            href="/district"
            style={{
              padding: "12px 24px",
              background: "#1A1814",
              color: "#fff",
              borderRadius: "100px",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Visit Factory District &rarr;
          </a>
          <a
            href="/collective"
            style={{
              padding: "12px 24px",
              background: "transparent",
              color: "#1A1814",
              border: "1px solid #1A1814",
              borderRadius: "100px",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Hire a Builder &rarr;
          </a>
        </div>

        <p style={{ fontSize: "13px", color: "#9B9590" }}>
          Built by TMRW Group &middot; Tomorrow, Inc &middot; 2026
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
        TMRW Group &middot; Tomorrow, Inc &middot; 2026
      </footer>

      <style>{`
        @media (max-width: 640px) {
          .watch-desktop-nav { display: none !important; }
          .watch-mobile-btn { display: block !important; }
          h1 { font-size: 28px !important; }
          main { padding: 32px 16px !important; }
        }
      `}</style>
    </div>
  );
}
