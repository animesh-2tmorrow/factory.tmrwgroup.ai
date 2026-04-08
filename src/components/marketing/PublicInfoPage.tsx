"use client";

import Link from "next/link";

interface PublicInfoPageProps {
  title: string;
  description: string;
  badge: string;
}

export default function PublicInfoPage({ title, description, badge }: PublicInfoPageProps) {
  return (
    <main className="vf-login-shell" style={{ padding: "var(--space-6)" }}>
      <section className="vf-login-card" style={{ maxWidth: 760, textAlign: "left" }}>
        <p className="vf-kicker" style={{ marginBottom: "var(--space-3)" }}>
          {badge}
        </p>
        <h1 className="vf-title" style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--space-3)" }}>
          {title}
        </h1>
        <p className="vf-muted" style={{ marginBottom: "var(--space-5)", lineHeight: 1.7 }}>
          {description}
        </p>
        <div className="vf-row" style={{ flexWrap: "wrap" }}>
          <Link href="/agents" className="vf-button-primary">
            Open Factory Workspace
          </Link>
          <Link href="https://tmrwgroup.ai" className="vf-button-secondary">
            Go to TMRW Group
          </Link>
        </div>
      </section>
    </main>
  );
}
