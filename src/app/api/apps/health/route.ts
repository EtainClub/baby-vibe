import { assertSameOrigin, jsonError } from "@/lib/api/response";
import { requireSessionUser } from "@/lib/auth/session";
import { checkUrlHealth } from "@/lib/metadata/check-url";
import {
  listAppsNeedingHealthCheck,
  recordAppHealth,
} from "@/lib/repositories/app-repository";

export const runtime = "nodejs";

// Vibe-coded apps get un-deployed a lot, and a profile full of dead links is
// the opposite of a portfolio. Probing once a day per app is enough to catch
// that without hammering anyone's host.
const STALE_AFTER_MS = 1000 * 60 * 60 * 24;

/**
 * Re-probes the caller's stalest app links.
 *
 * Called opportunistically when the dashboard loads, so the work is spread
 * across real visits instead of needing a scheduler.
 */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireSessionUser();
    const stale = await listAppsNeedingHealthCheck(
      user.uid,
      new Date(Date.now() - STALE_AFTER_MS),
    );

    const results = await Promise.all(
      stale.map(async (app) => {
        const health = await checkUrlHealth(app.url);
        await recordAppHealth(app.id, health).catch(() => undefined);
        return [app.id, health] as const;
      }),
    );

    return Response.json({ ok: true, data: Object.fromEntries(results) });
  } catch (error) {
    return jsonError(error);
  }
}
