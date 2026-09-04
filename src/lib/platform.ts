/**
 * Build-time platform flags.
 *
 * These are baked in by the `:toss` build scripts (see package.json), never
 * detected at runtime — a Toss bundle only ever runs inside the Toss webview,
 * so there is nothing to sniff for.
 */
export const IS_TOSS_APP = process.env.NEXT_PUBLIC_TOSS_APP === "1";

/**
 * Origins the Apps in Toss webview serves the mini app from.
 *
 * Toss hosts the static bundle itself, so the webview's own origin is one of
 * these two — `apps` for the released app, `private-apps` for the console's
 * private build — and every call it makes to this API is cross-origin from
 * there. `baby-vibe` is the `appName` in apps-in-toss.config.ts; if that is
 * ever renamed, both have to move with it.
 */
export const TOSS_APP_ORIGINS = [
  "https://baby-vibe.apps.tossmini.com",
  "https://baby-vibe.private-apps.tossmini.com",
];

export function isTossAppOrigin(origin: string | null | undefined) {
  return Boolean(origin) && TOSS_APP_ORIGINS.includes(origin as string);
}

/**
 * Where the app is served from in production.
 *
 * Deterministic on both the server and the client so it can be rendered
 * directly — reading `window.location` during render would desync hydration.
 */
export const PUBLIC_APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://baby.etain.club"
).replace(/\/$/, "");

/** Host only, for the `<host>/<username>` labels shown throughout the UI. */
export const PUBLIC_APP_HOST = PUBLIC_APP_URL.replace(/^https?:\/\//, "");

/**
 * Origin the JSON API lives on.
 *
 * The Toss bundle is a static export with no server of its own, so it talks to
 * the deployed Next.js server cross-origin. Everywhere else this stays "" and
 * requests go same-origin, exactly as before.
 */
export const API_BASE = IS_TOSS_APP
  ? (process.env.NEXT_PUBLIC_API_BASE_URL || PUBLIC_APP_URL).replace(/\/$/, "")
  : "";
