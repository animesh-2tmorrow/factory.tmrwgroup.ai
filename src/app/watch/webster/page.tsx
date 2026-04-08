"use client";

import { useState } from "react";
import Link from "next/link";

export default function WebsterDemoPage() {
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
          className="watch-desktop-nav"
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
          <Link
            href="/collective"
            style={{
              fontSize: "14px",
              color: "#6B6560",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Hire
          </Link>
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
          <Link
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
          Webster Demo
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
          Setting Up Webster
        </h1>
        <p
          style={{
            fontSize: "16px",
            color: "#6B6560",
            marginBottom: "32px",
            lineHeight: 1.6,
          }}
        >
          Learn how to configure Webster, your AI-powered marketing operations assistant
          that integrates directly with Marketo. This walkthrough covers installation,
          agent setup, and connecting your Marketo instance.
        </p>

        {/* Video Player */}
        <div
          style={{
            borderRadius: "12px",
            overflow: "hidden",
            border: "1px solid #E8E4DE",
            marginBottom: "32px",
            background: "#000",
            boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
          }}
        >
          <video
            controls
            autoPlay
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
          <Link
            href="/login"
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
            Get Started &rarr;
          </Link>
          <Link
            href="/docs"
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
            Read Docs &rarr;
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
          .watch-desktop-nav { display: none !important; }
          .watch-mobile-btn { display: block !important; }
          h1 { font-size: 28px !important; }
          main { padding: 32px 16px !important; }
        }
      `}</style>
    </div>
  );
}
