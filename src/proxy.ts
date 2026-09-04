import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isTossAppOrigin } from "@/lib/platform";

/**
 * CORS for the Apps in Toss bundle.
 *
 * The Toss mini app is a static export served by Toss's webview shell, so it
 * calls this API cross-origin. Those calls authenticate with a Firebase ID
 * token in the `Authorization` header and never send the session cookie, so
 * opening CORS for them carries no CSRF risk — cookie-authenticated requests
 * get no CORS headers at all and stay same-origin only.
 */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization,Content-Type",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
};

/** Endpoints that serve data anyone can already read from a public page. */
const PUBLIC_READ_PATHS = [
  /^\/api\/u\//,
  /^\/api\/people$/,
  /^\/api\/username\//,
  /^\/api\/cheer/,
];

function wantsCors(request: NextRequest) {
  // The mini app's own origin. Anonymous sign-in can fail (offline, blocked
  // storage), and without this the token-less retry would be refused by the
  // browser before it ever reached the origin check.
  if (isTossAppOrigin(request.headers.get("origin"))) return true;
  if (request.headers.get("authorization")?.startsWith("Bearer ")) return true;
  if (
    request.method === "GET" &&
    PUBLIC_READ_PATHS.some((pattern) => pattern.test(request.nextUrl.pathname))
  ) {
    return true;
  }
  // Preflights carry no Authorization header — check what they intend to send.
  return Boolean(
    request.headers
      .get("access-control-request-headers")
      ?.toLowerCase()
      .includes("authorization"),
  );
}

export function proxy(request: NextRequest) {
  if (!wantsCors(request)) return NextResponse.next();

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
