import { assertSameOrigin, jsonError, readJson } from "@/lib/api/response";
import { requireSessionUser } from "@/lib/auth/session";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { inspectUrl } from "@/lib/metadata/inspect-url";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    if (isFirebaseAdminConfigured()) await requireSessionUser();
    const body = (await readJson(request)) as Record<string, unknown>;
    const metadata = await inspectUrl(body.url);
    return Response.json({ ok: true, data: metadata });
  } catch (error) {
    return jsonError(error);
  }
}
