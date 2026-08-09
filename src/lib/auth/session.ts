import "server-only";

import { cookies } from "next/headers";
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

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    return {
      uid: decoded.uid,
      email: typeof decoded.email === "string" ? decoded.email : null,
      name: typeof decoded.name === "string" ? decoded.name : null,
      picture: typeof decoded.picture === "string" ? decoded.picture : null,
      googleLinked:
        decoded.firebase?.sign_in_provider === "google.com" ||
        Boolean(decoded.firebase?.identities?.["google.com"]?.length),
    };
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
