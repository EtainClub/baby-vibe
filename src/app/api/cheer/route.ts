import { jsonError } from "@/lib/api/response";
import { resolveCheerIdentity } from "@/lib/cheer-identity";
import { AppError } from "@/lib/errors";
import { listAppCheerStates } from "@/lib/repositories/stats-repository";

const MAX_APP_IDS = 50;

/**
 * Cheer state for a whole profile in one request.
 *
 * A profile page used to fire one request per app, so opening a maker with 20
 * apps meant 20 round trips before anything settled.
 */
export async function GET(request: Request) {
  try {
    const appIds = (new URL(request.url).searchParams.get("appIds") ?? "")
      .split(",")
      .map((appId) => appId.trim())
      .filter(Boolean);

    if (appIds.length > MAX_APP_IDS) {
      throw new AppError("too_many_apps", "한 번에 확인할 수 있는 앱 수를 넘었어요.", 400);
    }
    if (!appIds.length) return Response.json({ ok: true, data: {} });

    const { key } = await resolveCheerIdentity(request);
    return Response.json({
      ok: true,
      data: await listAppCheerStates(appIds, key),
    });
  } catch (error) {
    return jsonError(error);
  }
}
