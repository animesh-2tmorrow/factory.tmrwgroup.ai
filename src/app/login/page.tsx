"use client";

import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

function getSafeCallbackUrl(raw: string | null): string {
  if (!raw) return "/billing";
  if (!raw.startsWith("/")) return "/billing";
  if (raw.startsWith("//")) return "/billing";
  return raw;
}

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const callbackUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return "/billing";
    }
    const params = new URLSearchParams(window.location.search);
    return getSafeCallbackUrl(params.get("callbackUrl"));
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  if (status === "loading") {
    return <div className="vf-login-shell vf-muted">Loading...</div>;
  }

  if (session) return null;

  return (
    <main className="vf-login-page">
      <div className="vf-public-bg" />
      <header className="vf-login-nav">
        <Link href="/" className="vf-public-brand">
          <span>Venture Factory</span>
          <small>TMRW Group</small>
        </Link>
        <nav className="vf-public-links">
          <Link href="/">Overview</Link>
          <Link href="/billing">Pricing</Link>
          <Link href="/docs">Docs</Link>
          <Link href="/dashboard">Admin</Link>
        </nav>
        <span className="vf-button-primary" aria-hidden>
          Login
        </span>
      </header>

      <section className="vf-login-hero">
        <h1>Sign In</h1>
        <p>Access your Venture Factory control plane.</p>

        <div className="vf-login-panel">
          <div className="vf-login-panel-head">
            <strong>Venture Factory</strong>
            <span>Sign in to your account</span>
          </div>

          <div className="vf-login-provider-stack">
            <button
              onClick={() => signIn("google", { callbackUrl })}
              className="vf-login-provider"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>
            <button className="vf-login-provider is-disabled" disabled>
              Continue with Discord (Soon)
            </button>
            <button className="vf-login-provider is-disabled" disabled>
              Continue with GitHub (Soon)
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
