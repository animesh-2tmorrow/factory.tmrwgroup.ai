"use client";

import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { FormEvent, useEffect, useMemo, useState } from "react";

interface AuthUserPayload {
  id: string;
  email: string | null;
  name: string | null;
  planId: string;
  planStatus: string;
}

interface TokenPayload {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: AuthUserPayload;
}

interface ExtensionRegisterResponse {
  agentId: string;
  plan: string;
  planStatus: string;
  config: Record<string, unknown>;
}

declare global {
  interface Window {
    chrome?: {
      runtime?: {
        sendMessage?: (
          extensionId: string,
          message: Record<string, unknown>,
          callback: (response?: { success?: boolean }) => void
        ) => void;
        lastError?: { message?: string };
      };
    };
  }
}

function detectBrowser(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes("edg/")) return "Edge";
  if (ua.includes("opr/") || ua.includes("opera")) return "Opera";
  if (ua.includes("chrome/")) return "Chrome";
  if (ua.includes("firefox/")) return "Firefox";
  if (ua.includes("safari/")) return "Safari";
  return "Unknown";
}

function detectOs(platform: string): string {
  const value = platform.toLowerCase();
  if (value.includes("win")) return "Windows";
  if (value.includes("mac")) return "macOS";
  if (value.includes("linux")) return "Linux";
  if (value.includes("iphone") || value.includes("ipad")) return "iOS";
  if (value.includes("android")) return "Android";
  return "Unknown";
}

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      (data as { error?: string; message?: string })?.error ??
      (data as { error?: string; message?: string })?.message ??
      "Request failed";
    throw new Error(message);
  }
  return data as T;
}

async function sendProvisionMessage(
  extensionId: string,
  payload: Record<string, unknown>
): Promise<boolean> {
  const sendMessage = window.chrome?.runtime?.sendMessage;
  if (!sendMessage) return false;

  return new Promise((resolve) => {
    sendMessage(extensionId, payload, (response) => {
      const runtimeError = window.chrome?.runtime?.lastError;
      if (runtimeError?.message) {
        resolve(false);
        return;
      }
      resolve(response?.success === true);
    });
  });
}

function buildAuthCallbackUrl(
  extensionId: string,
  payload: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    agentId: string;
    userId: string;
    plan: string;
  }
): string {
  const query = new URLSearchParams({
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    expiresAt: String(payload.expiresAt),
    agentId: payload.agentId,
    userId: payload.userId,
    plan: payload.plan,
  });

  return `chrome-extension://${extensionId}/dist/auth-callback.html?${query.toString()}`;
}

export default function ExtensionConnectPage() {
  const { status } = useSession();

  const source = useMemo(() => {
    if (typeof window === "undefined") return "webster";
    return new URLSearchParams(window.location.search).get("source") ?? "webster";
  }, []);

  const version = useMemo(() => {
    if (typeof window === "undefined") return "1.0.0";
    return new URLSearchParams(window.location.search).get("version") ?? "1.0.0";
  }, []);

  const extensionId = useMemo(
    () =>
      process.env.NEXT_PUBLIC_WEBSTER_EXTENSION_ID ??
      process.env.NEXT_PUBLIC_EXTENSION_ID ??
      "",
    []
  );

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const connectUsingTokenPair = async (tokens: TokenPayload) => {
    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokens.accessToken}`,
    };

    const agentResult = await parseJson<{ agentId: string; model: string }>(
      await fetch("/api/user/agent", {
        method: "GET",
        headers: authHeaders,
      })
    );

    const extensionRegistration = await parseJson<ExtensionRegisterResponse>(
      await fetch("/api/extension/register", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          extensionVersion: version,
          browser: detectBrowser(navigator.userAgent),
          os: detectOs(navigator.platform),
          installReason: "install",
        }),
      })
    );

    const payload = {
      type: "WEBSTER_PROVISION",
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      agentId: extensionRegistration.agentId || agentResult.agentId,
      userId: tokens.user.id,
      plan: extensionRegistration.plan || tokens.user.planId,
      source,
      version,
    };

    if (extensionId) {
      const delivered = await sendProvisionMessage(extensionId, payload);
      if (delivered) {
        setConnected(true);
        setStatusMessage("Webster is connected. You can close this tab.");
        return;
      }

      window.location.href = buildAuthCallbackUrl(extensionId, {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        agentId: extensionRegistration.agentId || agentResult.agentId,
        userId: tokens.user.id,
        plan: extensionRegistration.plan || tokens.user.planId,
      });
      return;
    }

    setStatusMessage(
      "Extension ID is not configured on this portal environment. Set NEXT_PUBLIC_WEBSTER_EXTENSION_ID and reload."
    );
  };

  const connectFromSessionCookie = async () => {
    setBusy(true);
    setError(null);
    setStatusMessage("Creating extension tokens from your active portal session...");
    try {
      const tokens = await parseJson<TokenPayload>(
        await fetch("/api/auth/extension-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
      await connectUsingTokenPair(tokens);
    } catch (sessionError) {
      setError(sessionError instanceof Error ? sessionError.message : "Failed to create extension token");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && !connected && !busy) {
      connectFromSessionCookie().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setStatusMessage(null);
    setVerificationUrl(null);

    try {
      if (mode === "register") {
        const registerResult = await parseJson<{
          verificationSent: boolean;
          verificationUrl?: string;
        }>(
          await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: email.trim(),
              password,
              name: name.trim(),
            }),
          })
        );

        if (registerResult.verificationUrl) {
          setVerificationUrl(registerResult.verificationUrl);
        }
      }

      setStatusMessage("Signing in and connecting your extension...");

      const tokens = await parseJson<TokenPayload>(
        await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        })
      );

      await connectUsingTokenPair(tokens);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to connect extension");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="vf-login-page">
      <div className="vf-public-bg" />
      <header className="vf-login-nav">
        <Link href="/" className="vf-public-brand">
          <span>Venture Factory</span>
          <small>Webster Setup</small>
        </Link>
      </header>

      <section className="vf-login-hero">
        <h1>Connect Webster Extension</h1>
        <p>Sign in to provision Webster and sync your agent automatically.</p>

        <div className="vf-login-panel">
          <div className="vf-login-panel-head">
            <strong>Setup</strong>
            <span>
              Source: {source} | Version: {version}
            </span>
          </div>

          <div className="vf-login-provider-stack">
            <button
              type="button"
              className="vf-login-provider"
              onClick={() =>
                signIn("google", {
                  callbackUrl: `/auth/extension-connect?source=${encodeURIComponent(source)}&version=${encodeURIComponent(version)}`,
                })
              }
              disabled={busy}
            >
              Continue with Google
            </button>
          </div>

          <div className="vf-row" style={{ marginTop: 12 }}>
            <button
              type="button"
              className={mode === "login" ? "vf-button-primary" : "vf-button-secondary"}
              onClick={() => setMode("login")}
              disabled={busy}
            >
              Sign In
            </button>
            <button
              type="button"
              className={mode === "register" ? "vf-button-primary" : "vf-button-secondary"}
              onClick={() => setMode("register")}
              disabled={busy}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="vf-section-stack" style={{ marginTop: 14 }}>
            {mode === "register" ? (
              <label>
                <span className="vf-kicker">Name</span>
                <input
                  className="vf-input"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  required
                />
              </label>
            ) : null}

            <label>
              <span className="vf-kicker">Email</span>
              <input
                className="vf-input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                required
              />
            </label>

            <label>
              <span className="vf-kicker">Password</span>
              <input
                className="vf-input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
              />
            </label>

            <button type="submit" className="vf-button-primary" disabled={busy}>
              {busy ? "Working..." : mode === "register" ? "Create & Connect" : "Sign In & Connect"}
            </button>
          </form>

          {verificationUrl ? (
            <p className="vf-muted" style={{ marginTop: 10 }}>
              Verification link generated:{" "}
              <a href={verificationUrl} target="_blank" rel="noreferrer" style={{ color: "var(--teal)" }}>
                open verification
              </a>
            </p>
          ) : null}

          {statusMessage ? <p className="vf-muted" style={{ marginTop: 10 }}>{statusMessage}</p> : null}
          {connected ? (
            <p style={{ marginTop: 10, color: "var(--teal)" }}>
              Webster connected successfully. You can close this tab.
            </p>
          ) : null}
          {error ? <p style={{ marginTop: 10, color: "var(--error)" }}>{error}</p> : null}
        </div>
      </section>
    </main>
  );
}
