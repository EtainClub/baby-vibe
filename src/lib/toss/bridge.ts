"use client";

import { IS_TOSS_APP } from "@/lib/platform";

/**
 * Thin wrapper over the Apps in Toss native bridge.
 *
 * The SDK is loaded with a dynamic `import()` so it lands in its own chunk and
 * the web bundle never pays for it. Every call falls back to the web API when
 * the bridge is unavailable — a Toss build still runs in a plain browser during
 * `pnpm dev:toss`, and a bridge call can fail on an old Toss app version.
 */
async function loadBridge() {
  if (!IS_TOSS_APP) return null;
  try {
    return await import("@apps-in-toss/web-framework");
  } catch {
    return null;
  }
}

/** Copies text, preferring the native clipboard bridge inside Toss. */
export async function copyText(text: string) {
  const bridge = await loadBridge();
  if (bridge) {
    try {
      await bridge.Clipboard.setText(text);
      return true;
    } catch {
      // Permission denied or an older Toss app — fall through to the web API.
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Opens the native share sheet.
 *
 * Toss only accepts a single message string, so the URL is folded into the
 * text. Returns false when nothing could be opened and the caller should fall
 * back to copying the link.
 */
export async function shareMessage({
  text,
  url,
}: {
  text: string;
  url: string;
}) {
  const bridge = await loadBridge();
  if (bridge) {
    try {
      await bridge.Share.sendMessage({ message: `${text}\n${url}` });
      return true;
    } catch {
      return false;
    }
  }

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ text, url });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Opens an external URL.
 *
 * `target="_blank"` does nothing in the Toss webview — the native bridge has to
 * hand the URL to the system browser.
 */
export async function openExternalUrl(url: string) {
  const bridge = await loadBridge();
  if (bridge) {
    try {
      await bridge.openURL(url);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/** True when the device reports no connectivity. Only meaningful inside Toss. */
export async function isOffline() {
  const bridge = await loadBridge();
  if (bridge) {
    try {
      return (await bridge.Environment.getNetworkStatus()) === "OFFLINE";
    } catch {
      return false;
    }
  }
  return typeof navigator !== "undefined" && navigator.onLine === false;
}
