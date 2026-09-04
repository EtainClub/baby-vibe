import { API_BASE, IS_TOSS_APP, PUBLIC_APP_URL } from "@/lib/platform";

/**
 * Link to a maker's public page.
 *
 * `/[username]` is a server-rendered dynamic route, which a static export
 * cannot produce, so the Apps in Toss bundle uses the client-rendered `/u`
 * route instead.
 */
export function profileHref(username: string) {
  return IS_TOSS_APP
    ? `/u?u=${encodeURIComponent(username)}`
    : `/${username}`;
}

/** Click-tracking redirect for an app's outbound link. Lives on the server, so
 * the Toss bundle has to reach it absolutely. */
export function outboundHref(appId: string) {
  return `${API_BASE}/go/${encodeURIComponent(appId)}`;
}

/** Absolute, shareable URL for a maker's public page. */
export function publicProfileUrl(username: string) {
  return `${API_BASE || PUBLIC_APP_URL}/${username}`;
}
