import "server-only";

import { cookies, headers } from "next/headers";
import type { DecodedIdToken } from "firebase-admin/auth";
import { AppError } from "@/lib/errors";
import { getAdminAuth } from "@/lib/firebase/admin";

export const SESSION_COOKIE_NAME = "__session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 5;

export interface SessionUser {
  uid: string;
  email: string | null;
  name: string | null;
  picture: string | null;
  googleLinked: boolean;
}

function toSessionUser(decoded: DecodedIdToken): SessionUser {
  return {
    uid: decoded.uid,
    email: typeof decoded.email === "string" ? decoded.email : null,
    name: typeof decoded.name === "string" ? decoded.name : null,
    picture: typeof decoded.picture === "string" ? decoded.picture : null,
    googleLinked:
      decoded.firebase?.sign_in_provider === "google.com" ||
      Boolean(decoded.firebase?.identities?.["google.com"]?.length),
  };
}

/**
 * The Apps in Toss bundle is cross-origin and cannot use the session cookie, so
 * it sends a Firebase ID token instead. Bearer tokens are checked first because
 * a Toss request never carries a cookie anyway.
 */
async function getBearerUser(): Promise<SessionUser | null> {
  const authorization = (await headers()).get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  const idToken = authorization.slice("Bearer ".length).trim();
  if (!idToken || idToken.length > 10_000) return null;

  try {
    return toSessionUser(await getAdminAuth().verifyIdToken(idToken, true));
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const bearerUser = await getBearerUser();
  if (bearerUser) return bearerUser;

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    return toSessionUser(decoded);
  } catch {
    return null;
  }
}

export async function requireSessionUser() {
  const user = await getSessionUser();
  if (!user) {
    throw new AppError("unauthorized", "로그인이 필요해요.", 401);
  }
  return user;
}
