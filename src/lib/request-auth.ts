import { auth } from "@/lib/auth";
import { verifyAccessToken } from "@/lib/jwt-auth";

export interface RequestAuthContext {
  userId: string;
  source: "bearer" | "cookie";
  userName: string | null;
  userEmail: string | null;
}

export function extractBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (!authorization) return null;
  const [scheme, token] = authorization.split(" ");
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== "bearer") return null;
  return token.trim() || null;
}

export async function authenticateRequest(request: Request): Promise<RequestAuthContext | null> {
  const bearerToken = extractBearerToken(request);

  if (bearerToken) {
    try {
      const verified = await verifyAccessToken(bearerToken);
      return {
        userId: verified.userId,
        source: "bearer",
        userName: verified.name,
        userEmail: verified.email,
      };
    } catch {
      // Compatibility window: if bearer fails, fall back to cookie session.
    }
  }

  const session = await auth();
  if (!session?.user?.id) return null;

  return {
    userId: session.user.id,
    source: "cookie",
    userName: session.user.name ?? null,
    userEmail: session.user.email ?? null,
  };
}
