import type { Metadata } from "next";
import PeoplePage from "@/components/people-page";
import { getSessionUser } from "@/lib/auth/session";
import { demoCreators } from "@/lib/demo-creators";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import {
  getUserProfileByUid,
  listPublicProfiles,
} from "@/lib/repositories/user-repository";

export const metadata: Metadata = {
  title: "메이커 둘러보기",
  description: "다른 메이커들과 그들이 만든 앱을 둘러보세요.",
};

export default async function PeopleRoute() {
  if (!isFirebaseAdminConfigured()) {
    return (
      <PeoplePage
        people={demoCreators.map((creator) => creator.profile)}
        viewerUsername={null}
      />
    );
  }

  const [people, user] = await Promise.all([
    listPublicProfiles(),
    getSessionUser(),
  ]);
  const viewerProfile = user ? await getUserProfileByUid(user.uid) : null;

  return (
    <PeoplePage people={people} viewerUsername={viewerProfile?.username ?? null} />
  );
}
