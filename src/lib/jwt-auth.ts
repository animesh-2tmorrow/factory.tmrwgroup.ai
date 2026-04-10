import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import prisma from "@/lib/db";

const ACCESS_TOKEN_TTL_MINUTES = Number.parseInt(process.env.JWT_TTL_MINUTES ?? "15", 10) || 15;
const REFRESH_TOKEN_TTL_DAYS = Number.parseInt(process.env.REFRESH_TOKEN_TTL_DAYS ?? "30", 10) || 30;
const BCRYPT_ROUNDS = Number.parseInt(process.env.BCRYPT_ROUNDS ?? "12", 10) || 12;

export interface AccessTokenUser {
  id: string;
  email: string | null;
  name: string | null;
  planId: string;
  planStatus: string;
}

export interface VerifiedAccessToken {
  userId: string;
  email: string | null;
  name: string | null;
  planId: string;
  planStatus: string;
  expiresAt: number;
}

interface AccessTokenClaims extends JWTPayload {
  email?: string | null;
  name?: string | null;
  planId: string;
  planStatus: string;
}

interface RefreshTokenWithUserId {
  id: string;
  userId: string;
  tokenHash: string;
  tokenPrefix: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

function jwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret || secret.trim().length < 16) {
    throw new Error("JWT secret is not configured. Set JWT_SECRET (or NEXTAUTH_SECRET).");
  }
  return new TextEncoder().encode(secret);
}

function nowPlusMinutes(minutes: number): Date {
  return new Date(Date.now() + minutes * 60_000);
}

function nowPlusDays(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60_000);
}

export function currentQuotaPeriod(now = new Date()): { periodStart: Date; periodEnd: Date } {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const periodStart = new Date(Date.UTC(year, month, 1));
  const periodEnd = new Date(Date.UTC(year, month + 1, 0));
  return { periodStart, periodEnd };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function refreshTokenPrefix(rawToken: string): string {
  return rawToken.slice(0, 8);
}

export function createOpaqueRefreshToken(): string {
  return `rt_${randomBytes(48).toString("base64url")}`;
}

async function signAccessToken(user: AccessTokenUser): Promise<{ accessToken: string; expiresAt: number }> {
  const expiresAt = nowPlusMinutes(ACCESS_TOKEN_TTL_MINUTES);
  const accessToken = await new SignJWT({
    email: user.email,
    name: user.name,
    planId: user.planId,
    planStatus: user.planStatus,
  } satisfies AccessTokenClaims)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(jwtSecret());

  return { accessToken, expiresAt: expiresAt.getTime() };
}

export async function verifyAccessToken(token: string): Promise<VerifiedAccessToken> {
  const { payload } = await jwtVerify(token, jwtSecret(), { algorithms: ["HS256"] });
  const userId = typeof payload.sub === "string" ? payload.sub : "";
  if (!userId) {
    throw new Error("Invalid access token subject");
  }

  const expiresAtSeconds = typeof payload.exp === "number" ? payload.exp : 0;
  return {
    userId,
    email: typeof payload.email === "string" ? payload.email : null,
    name: typeof payload.name === "string" ? payload.name : null,
    planId: typeof payload.planId === "string" ? payload.planId : "free_trial",
    planStatus: typeof payload.planStatus === "string" ? payload.planStatus : "trialing",
    expiresAt: expiresAtSeconds * 1000,
  };
}

async function createStoredRefreshToken(
  userId: string,
  rawRefreshToken: string,
  userAgent: string | null,
  expiresAt: Date
) {
  const tokenHash = await bcrypt.hash(rawRefreshToken, BCRYPT_ROUNDS);
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      tokenPrefix: refreshTokenPrefix(rawRefreshToken),
      expiresAt,
      userAgent,
    },
  });
}

export async function issueTokenPair(user: AccessTokenUser, userAgent: string | null) {
  const refreshToken = createOpaqueRefreshToken();
  const refreshExpiresAt = nowPlusDays(REFRESH_TOKEN_TTL_DAYS);
  const [access, _] = await Promise.all([
    signAccessToken(user),
    createStoredRefreshToken(user.id, refreshToken, userAgent, refreshExpiresAt),
  ]);

  return {
    accessToken: access.accessToken,
    refreshToken,
    expiresAt: access.expiresAt,
    refreshExpiresAt: refreshExpiresAt.getTime(),
  };
}

export async function findRefreshTokenRecord(
  rawRefreshToken: string,
  includeRevoked = true
): Promise<RefreshTokenWithUserId | null> {
  const prefix = refreshTokenPrefix(rawRefreshToken);
  if (!prefix) return null;

  const candidates = await prisma.refreshToken.findMany({
    where: includeRevoked
      ? { tokenPrefix: prefix }
      : {
          tokenPrefix: prefix,
          revokedAt: null,
        },
    orderBy: { createdAt: "desc" },
    take: 25,
    select: {
      id: true,
      userId: true,
      tokenHash: true,
      tokenPrefix: true,
      expiresAt: true,
      revokedAt: true,
    },
  });

  for (const candidate of candidates) {
    if (await bcrypt.compare(rawRefreshToken, candidate.tokenHash)) {
      return candidate;
    }
  }

  return null;
}

export async function revokeAllRefreshTokensForUser(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

type RotateResult =
  | {
      ok: true;
      user: AccessTokenUser;
      accessToken: string;
      refreshToken: string;
      expiresAt: number;
      refreshExpiresAt: number;
    }
  | {
      ok: false;
      reason: "invalid" | "expired" | "replayed";
    };

export async function rotateRefreshToken(rawRefreshToken: string, userAgent: string | null): Promise<RotateResult> {
  const tokenRecord = await findRefreshTokenRecord(rawRefreshToken, true);
  if (!tokenRecord) {
    return { ok: false, reason: "invalid" };
  }

  if (tokenRecord.revokedAt) {
    await revokeAllRefreshTokensForUser(tokenRecord.userId);
    return { ok: false, reason: "replayed" };
  }

  if (tokenRecord.expiresAt.getTime() <= Date.now()) {
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });
    return { ok: false, reason: "expired" };
  }

  const user = await prisma.user.findUnique({
    where: { id: tokenRecord.userId },
    select: {
      id: true,
      email: true,
      name: true,
      planId: true,
      planStatus: true,
    },
  });

  if (!user) {
    return { ok: false, reason: "invalid" };
  }

  const newRefreshToken = createOpaqueRefreshToken();
  const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, BCRYPT_ROUNDS);
  const newRefreshExpiresAt = nowPlusDays(REFRESH_TOKEN_TTL_DAYS);

  const revokeAttempt = await prisma.$transaction(async (tx) => {
    const updated = await tx.refreshToken.updateMany({
      where: {
        id: tokenRecord.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        lastUsedAt: new Date(),
      },
    });

    if (updated.count !== 1) {
      await tx.refreshToken.updateMany({
        where: { userId: tokenRecord.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return false;
    }

    await tx.refreshToken.create({
      data: {
        userId: tokenRecord.userId,
        tokenHash: newRefreshTokenHash,
        tokenPrefix: refreshTokenPrefix(newRefreshToken),
        expiresAt: newRefreshExpiresAt,
        userAgent,
      },
    });

    await tx.user.update({
      where: { id: tokenRecord.userId },
      data: { lastSeenAt: new Date() },
    });

    return true;
  });

  if (!revokeAttempt) {
    return { ok: false, reason: "replayed" };
  }

  const access = await signAccessToken({
    id: user.id,
    email: user.email,
    name: user.name,
    planId: user.planId,
    planStatus: user.planStatus,
  });

  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      planId: user.planId,
      planStatus: user.planStatus,
    },
    accessToken: access.accessToken,
    refreshToken: newRefreshToken,
    expiresAt: access.expiresAt,
    refreshExpiresAt: newRefreshExpiresAt.getTime(),
  };
}
