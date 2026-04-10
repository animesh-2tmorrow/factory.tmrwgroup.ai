"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const text = (data as { error?: string }).error ?? "Failed to process request";
        throw new Error(text);
      }

      setMessage("If the account exists, a reset link has been sent.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Request failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="vf-login-page">
      <div className="vf-public-bg" />
      <section className="vf-login-hero">
        <h1>Forgot Password</h1>
        <p>Enter your email and we will send a password reset link.</p>

        <div className="vf-login-panel">
          <form onSubmit={handleSubmit} className="vf-section-stack">
            <label>
              <span className="vf-kicker">Email</span>
              <input
                className="vf-input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <button className="vf-button-primary" type="submit" disabled={busy}>
              {busy ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          {message ? <p style={{ marginTop: 12, color: "var(--teal)" }}>{message}</p> : null}
          {error ? <p style={{ marginTop: 12, color: "var(--error)" }}>{error}</p> : null}

          <div style={{ marginTop: 12 }}>
            <Link href="/login" className="vf-button-secondary">
              Back to Login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
