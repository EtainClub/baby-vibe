import type { Metadata } from "next";
import PeopleClient from "@/components/people-client";
import PeoplePage from "@/components/people-page";
import { getSessionUser } from "@/lib/auth/session";
import { demoCreators } from "@/lib/demo-creators";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { IS_TOSS_APP } from "@/lib/platform";
import { listRecentPublicApps } from "@/lib/repositories/app-repository";
import {
  getUserProfileByUid,
  listPublicProfiles,
} from "@/lib/repositories/user-repository";

export const metadata: Metadata = {
  title: "메이커 둘러보기",
  description: "다른 메이커들과 그들이 만든 앱을 둘러보세요.",
};

export default async function PeopleRoute() {
  if (IS_TOSS_APP) return <PeopleClient />;

  if (!isFirebaseAdminConfigured()) {
    return (
      <PeoplePage
        people={demoCreators.map((creator) => creator.profile)}
        viewerUsername={null}
      />
    );
  }

  const [page, recentApps, user] = await Promise.all([
    listPublicProfiles(),
    listRecentPublicApps(),
    getSessionUser(),
  ]);
  const viewerProfile = user ? await getUserProfileByUid(user.uid) : null;

  return (
    <PeoplePage
      people={page.people}
      nextCursor={page.nextCursor}
      recentApps={recentApps}
      viewerUsername={viewerProfile?.username ?? null}
    />
  );
}
