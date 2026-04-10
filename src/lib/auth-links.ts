import { createHash, randomBytes } from "node:crypto";
import prisma from "@/lib/db";

type AuthTokenKind = "verify" | "reset";

interface ConsumedTokenSuccess {
  ok: true;
  userId: string;
}

interface ConsumedTokenFailure {
  ok: false;
  reason: "invalid" | "expired";
}

type ConsumedTokenResult = ConsumedTokenSuccess | ConsumedTokenFailure;

const VERIFY_TOKEN_TTL_HOURS = 24;
const RESET_TOKEN_TTL_MINUTES = 60;

function tokenIdentifier(kind: AuthTokenKind, userId: string): string {
  return `${kind}:${userId}`;
}

function hashRawToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

function nowPlusHours(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function nowPlusMinutes(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export function getAppUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000";
  return appUrl.replace(/\/$/, "");
}

export async function issueEmailVerificationToken(userId: string): Promise<string> {
  const rawToken = randomBytes(32).toString("base64url");
  const hashedToken = hashRawToken(rawToken);
  const identifier = tokenIdentifier("verify", userId);

  await prisma.verificationToken.deleteMany({
    where: {
      identifier,
    },
  });

  await prisma.verificationToken.create({
    data: {
      identifier,
      token: hashedToken,
      expires: nowPlusHours(VERIFY_TOKEN_TTL_HOURS),
    },
  });

  return rawToken;
}

export async function issuePasswordResetToken(userId: string): Promise<string> {
  const rawToken = randomBytes(32).toString("base64url");
  const hashedToken = hashRawToken(rawToken);
  const identifier = tokenIdentifier("reset", userId);

  await prisma.verificationToken.deleteMany({
    where: {
      identifier,
    },
  });

  await prisma.verificationToken.create({
    data: {
      identifier,
      token: hashedToken,
      expires: nowPlusMinutes(RESET_TOKEN_TTL_MINUTES),
    },
  });

  return rawToken;
}

export async function consumeAuthToken(rawToken: string, kind: AuthTokenKind): Promise<ConsumedTokenResult> {
  const hashedToken = hashRawToken(rawToken.trim());
  const match = await prisma.verificationToken.findFirst({
    where: {
      token: hashedToken,
      identifier: {
        startsWith: `${kind}:`,
      },
    },
  });

  if (!match) {
    return { ok: false, reason: "invalid" };
  }

  if (match.expires.getTime() <= Date.now()) {
    await prisma.verificationToken.delete({
      where: { token: match.token },
    });
    return { ok: false, reason: "expired" };
  }

  await prisma.verificationToken.delete({
    where: { token: match.token },
  });

  const [, userId] = match.identifier.split(":");
  if (!userId) {
    return { ok: false, reason: "invalid" };
  }

  return { ok: true, userId };
}

export async function notifyAuthLink(kind: AuthTokenKind, email: string, link: string): Promise<void> {
  const subject =
    kind === "verify" ? "Verify your Venture Factory account" : "Reset your Venture Factory password";
  const text =
    kind === "verify"
      ? `Verify your account by opening this link:\n${link}`
      : `Reset your password by opening this link:\n${link}`;

  const webhookUrl = process.env.AUTH_EMAIL_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: email,
          subject,
          text,
        }),
      });
    } catch (error) {
      console.warn(
        `[auth] Failed to call AUTH_EMAIL_WEBHOOK_URL: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  console.info(`[auth] ${kind} link for ${email}: ${link}`);
}
