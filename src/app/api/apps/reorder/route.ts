import { AppError } from "@/lib/errors";
import { assertSameOrigin, jsonError, readJson } from "@/lib/api/response";
import { requireSessionUser } from "@/lib/auth/session";
import { reorderApps } from "@/lib/repositories/app-repository";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireSessionUser();
    const body = (await readJson(request)) as Record<string, unknown>;
    if (
      !Array.isArray(body.appIds) ||
      body.appIds.some((id) => typeof id !== "string" || id.length > 128)
    ) {
      throw new AppError("invalid_order", "앱 순서를 확인해 주세요.");
    }
    await reorderApps(user.uid, body.appIds as string[]);
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
