import { jsonError } from "@/lib/api/response";
import { getSessionUser } from "@/lib/auth/session";
import { demoCreators } from "@/lib/demo-creators";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { listRecentPublicApps } from "@/lib/repositories/app-repository";
import {
  getUserProfileByUid,
  listPublicProfiles,
} from "@/lib/repositories/user-repository";

/**
 * Maker directory: one page of makers, the latest published apps, and who is
 * viewing. Also serves the "더 보기" cursor for the web build.
 */
export async function GET(request: Request) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return Response.json({
        ok: true,
        data: {
          people: demoCreators.map((creator) => creator.profile),
          nextCursor: null,
          recentApps: [],
          viewerUsername: null,
        },
      });
    }

    const cursor = new URL(request.url).searchParams.get("cursor");
    const [page, recentApps, user] = await Promise.all([
      listPublicProfiles({ cursor }),
      // Only the first page needs the timeline; "더 보기" just extends the list.
      cursor ? Promise.resolve([]) : listRecentPublicApps(),
      getSessionUser(),
    ]);
    const viewerUsername = user
      ? ((await getUserProfileByUid(user.uid))?.username ?? null)
      : null;

    return Response.json({
      ok: true,
      data: { ...page, recentApps, viewerUsername },
    });
  } catch (error) {
    return jsonError(error);
  }
}
