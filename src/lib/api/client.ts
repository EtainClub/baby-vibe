"use client";

import { getFirebaseClientServices } from "@/lib/firebase/client";
import { API_BASE, IS_TOSS_APP } from "@/lib/platform";

/**
 * Calls the JSON API.
 *
 * On the web the API is same-origin and authenticated by the `__session`
 * cookie, so this is a plain `fetch`. Inside Apps in Toss the bundle is static
 * and served from Toss's own origin, so requests go to the deployed API with a
 * Firebase ID token instead — cookies would be cross-site there and are not
 * sent at all.
 */
export async function apiFetch(path: string, init: RequestInit = {}) {
  const url = path.startsWith("/") ? `${API_BASE}${path}` : path;
  if (!IS_TOSS_APP) return fetch(url, init);

  const headers = new Headers(init.headers);
  const user = getFirebaseClientServices()?.auth.currentUser;
  if (user) {
    headers.set("Authorization", `Bearer ${await user.getIdToken()}`);
  }

  return fetch(url, {
    ...init,
    headers,
    credentials: "omit",
    mode: "cors",
  });
}

/** Absolute URL for a public page, for sharing and QR codes. */
export function publicUrl(path: string) {
  const base =
    API_BASE ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window === "undefined" ? "" : window.location.origin);
  return `${base.replace(/\/$/, "")}${path}`;
}
