"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

export default function ResetPasswordPage() {
  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("token") ?? "";
  }, []);

  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);

    try {
      if (!token) {
        throw new Error("Missing reset token");
      }

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const text = (data as { error?: string }).error ?? "Failed to reset password";
        throw new Error(text);
      }

      setMessage("Password updated successfully. You can now sign in.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="vf-login-page">
      <div className="vf-public-bg" />
      <section className="vf-login-hero">
        <h1>Reset Password</h1>
        <p>Set a new password for your Venture Factory account.</p>

        <div className="vf-login-panel">
          <form onSubmit={handleSubmit} className="vf-section-stack">
            <label>
              <span className="vf-kicker">New Password</span>
              <input
                className="vf-input"
                type="password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                required
              />
            </label>

            <button className="vf-button-primary" type="submit" disabled={busy}>
              {busy ? "Updating..." : "Update Password"}
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
