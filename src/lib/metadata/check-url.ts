import "server-only";

import { Agent, fetch } from "undici";
import { validateInspectableUrl } from "@/lib/metadata/validate-url";

const REQUEST_TIMEOUT_MS = 5_000;
const MAX_REDIRECTS = 3;

export type UrlHealth = "ok" | "unreachable";

/**
 * Is this app still up?
 *
 * Deliberately much cheaper than `inspectUrl()`: it wants a status code, not a
 * parsed document, so it never reads the body. Goes through the same
 * `validateInspectableUrl()` pinning so a saved URL cannot be used to probe
 * the internal network after the fact.
 */
export async function checkUrlHealth(value: unknown): Promise<UrlHealth> {
  let current;
  try {
    current = await validateInspectableUrl(value);
  } catch {
    return "unreachable";
  }

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const pinned = current;
    const dispatcher = new Agent({
      connect: {
        lookup: (_hostname, options, callback) => {
          if (options.all) {
            callback(null, [{ address: pinned.address, family: pinned.family }]);
            return;
          }
          callback(null, pinned.address, pinned.family);
        },
      },
      headersTimeout: REQUEST_TIMEOUT_MS,
      bodyTimeout: REQUEST_TIMEOUT_MS,
    });

    try {
      const response = await fetch(pinned.url, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": "BabyVibe-HealthCheck/1.0",
        },
        cache: "no-store",
        dispatcher,
      });
      await response.body?.cancel();

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location || redirects === MAX_REDIRECTS) return "unreachable";
        try {
          current = await validateInspectableUrl(
            new URL(location, pinned.url).toString(),
          );
        } catch {
          return "unreachable";
        }
        continue;
      }

      // 401/403 still means something is serving the address — a private beta
      // is not a dead link.
      return response.status < 500 ? "ok" : "unreachable";
    } catch {
      return "unreachable";
    } finally {
      clearTimeout(timeout);
      await dispatcher.close().catch(() => undefined);
    }
  }

  return "unreachable";
}
