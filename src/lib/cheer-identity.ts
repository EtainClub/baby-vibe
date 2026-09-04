import "server-only";

import { randomUUID } from "node:crypto";
import { getSessionUser } from "@/lib/auth/session";

export const VISITOR_COOKIE = "moa_visitor";
export const VISITOR_MAX_AGE = 60 * 60 * 24 * 365;

const VISITOR_PATTERN = /^[a-zA-Z0-9_-]{20,100}$/;

function readVisitorCookie(request: Request) {
  const visitorId = (request.headers.get("cookie") ?? "")
    .split(";")
    .map((part) => part.trim().split("="))
    .find(([name]) => name === VISITOR_COOKIE)?.[1];
  return visitorId && VISITOR_PATTERN.test(visitorId) ? visitorId : null;
}

/**
 * Who a cheer belongs to.
 *
 * A signed-in account is the strongest key available, and it is the only one
 * that works inside Apps in Toss — that bundle is cross-origin and sends no
 * cookies, so a cookie-only identity would mint a fresh "visitor" on every
 * single tap and inflate the counts. Anonymous web visitors keep the existing
 * raw-cookie key so the cheers they already left still resolve.
 */
export async function resolveCheerIdentity(
  request: Request,
  options: { create: true },
): Promise<{ key: string; issueCookie: boolean }>;
export async function resolveCheerIdentity(
  request: Request,
): Promise<{ key: string | null; issueCookie: boolean }>;
export async function resolveCheerIdentity(
  request: Request,
  { create = false }: { create?: boolean } = {},
) {
  const user = await getSessionUser().catch(() => null);
  if (user) return { key: `uid:${user.uid}`, issueCookie: false };

  const existing = readVisitorCookie(request);
  if (existing) return { key: existing, issueCookie: false };
  if (!create) return { key: null, issueCookie: false };

  return { key: randomUUID(), issueCookie: true };
}

export function issueVisitorCookie() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: VISITOR_MAX_AGE,
    path: "/",
  };
}
