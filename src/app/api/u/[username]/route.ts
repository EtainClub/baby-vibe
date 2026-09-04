import { jsonError } from "@/lib/api/response";
import { getSessionUser } from "@/lib/auth/session";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { getPublicProfilePayload } from "@/lib/public-profile";
import { getUserProfileByUid } from "@/lib/repositories/user-repository";

/** Public profile data for the Apps in Toss bundle, which has no server of its
 * own to render `/[username]`. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ username: string }> },
) {
  try {
    const { username } = await context.params;
    const payload = await getPublicProfilePayload(username);
    if (!payload) {
      return Response.json(
        { ok: false, error: { code: "not_found", message: "페이지를 찾을 수 없어요." } },
        { status: 404 },
      );
    }

    let viewerUsername: string | null = null;
    if (!isFirebaseAdminConfigured()) {
      viewerUsername = "etime";
    } else {
      const user = await getSessionUser();
      viewerUsername = user
        ? ((await getUserProfileByUid(user.uid))?.username ?? null)
        : null;
    }

    return Response.json({ ok: true, data: { ...payload, viewerUsername } });
  } catch (error) {
    return jsonError(error);
  }
}
