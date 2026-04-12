import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DEFAULT_AUTH_REDIRECT = "/billing";
const PUBLIC_EXACT_PATHS = new Set([
  "/",
  "/login",
  "/auth/extension-connect",
  "/auth/verify-error",
  "/forgot-password",
  "/reset-password",
]);
const PUBLIC_PATH_PREFIXES = [
  "/collective",
  "/district",
  "/watch",
  "/webster", // Webster product page
  "/cybersecurity", // Public research blog
  "/download", // Extension download page
  "/downloads", // Static download files
  "/api/downloads", // Download API with Content-Disposition
  "/videos", // Public video assets
  "/api/collective",
  "/api/district",
  "/api/mcp",
  "/api/agents", // Extension requests handled with CORS
  "/api/user/agent", // Extension bearer auth endpoint
  "/api/extension/register", // Extension bearer auth endpoint
];

// Allow Chrome extension origins for CORS
const ALLOWED_ORIGINS = [
  "https://factory.tmrwgroup.ai",
  "http://localhost:3000",
  "http://localhost:3001",
];

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (origin.startsWith("chrome-extension://")) return true;
  if (origin.startsWith("moz-extension://")) return true;
  if (origin.startsWith("safari-extension://")) return true;
  return false;
}

function isExtensionApiPath(pathname: string): boolean {
  return (
    pathname.startsWith("/api/agents/") ||
    pathname === "/api/user/agent" ||
    pathname === "/api/extension/register"
  );
}

function handleCorsForExtensionApi(req: NextRequest): NextResponse | null {
  const { pathname } = req.nextUrl;
  if (!isExtensionApiPath(pathname)) return null;

  const origin = req.headers.get("origin");
  const isPreflight = req.method === "OPTIONS";

  if (isPreflight) {
    const response = new NextResponse(null, { status: 204 });
    if (isAllowedOrigin(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin!);
      response.headers.set("Access-Control-Allow-Credentials", "true");
    }
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Webster-Token");
    response.headers.set("Access-Control-Max-Age", "86400");
    return response;
  }

  return null;
}

function getSafeCallbackPath(raw: string | null): string {
  if (!raw) return DEFAULT_AUTH_REDIRECT;
  if (!raw.startsWith("/")) return DEFAULT_AUTH_REDIRECT;
  if (raw.startsWith("//")) return DEFAULT_AUTH_REDIRECT;
  return raw;
}

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT_PATHS.has(pathname)) {
    return true;
  }
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Handle CORS preflight for extension API routes.
  const corsResponse = handleCorsForExtensionApi(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get("origin");
  const allowPublic = isPublicPath(pathname);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set("x-search", req.nextUrl.search);

  const hasSessionCookie = req.cookies
    .getAll()
    .some(
      (cookie) =>
        cookie.name.startsWith("authjs.session-token") ||
        cookie.name.startsWith("__Secure-authjs.session-token")
    );

  const isLoggedIn = hasSessionCookie;
  const isLoginPage = pathname === "/login";

  if (!isLoggedIn && !allowPublic) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    const callbackPath = `${pathname}${req.nextUrl.search}`;
    loginUrl.searchParams.set("callbackUrl", getSafeCallbackPath(callbackPath));
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isLoginPage) {
    const callbackUrl = getSafeCallbackPath(req.nextUrl.searchParams.get("callbackUrl"));
    return NextResponse.redirect(new URL(callbackUrl, req.nextUrl.origin));
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Add CORS headers for API requests from extensions
  if (isExtensionApiPath(pathname) && isAllowedOrigin(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin!);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api/health|api/auth|_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)",
  ],
};
