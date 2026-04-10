"use client";

import Link from "next/link";
import { useMemo } from "react";

function reasonCopy(reason: string | null): string {
  if (reason === "expired") {
    return "Your verification link has expired. Request a new verification email and try again.";
  }
  return "Your verification link is invalid. Please request a new verification email.";
}

export default function VerifyErrorPage() {
  const reason = useMemo(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("reason");
  }, []);

  return (
    <main className="vf-login-page">
      <div className="vf-public-bg" />
      <section className="vf-login-hero">
        <h1>Verification Failed</h1>
        <p>{reasonCopy(reason)}</p>
        <div className="vf-login-panel">
          <div className="vf-login-provider-stack">
            <Link href="/auth/extension-connect" className="vf-button-primary">
              Back to Webster Connect
            </Link>
            <Link href="/login" className="vf-button-secondary">
              Go to Login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
