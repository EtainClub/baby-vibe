import type { Metadata } from "next";
import { redirect } from "next/navigation";
import OnboardingPage from "@/components/onboarding-page";
import TossOnboarding from "@/components/toss-onboarding";
import { getSessionUser } from "@/lib/auth/session";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { IS_TOSS_APP } from "@/lib/platform";
import { getUserProfileByUid } from "@/lib/repositories/user-repository";

export const metadata: Metadata = {
  title: "내 앱 페이지 만들기",
};

export default async function StartPage() {
  // The Apps in Toss bundle is a static export: there is no request to read a
  // session from, so the same gate runs on the client instead.
  if (IS_TOSS_APP) return <TossOnboarding />;

  if (!isFirebaseAdminConfigured()) return <OnboardingPage />;

  const user = await getSessionUser();
  if (!user) redirect("/login");

  const profile = await getUserProfileByUid(user.uid);
  if (profile?.onboardingCompleted) redirect("/home");

  return (
    <OnboardingPage
      initialProfile={
        profile
          ? {
              username: profile.username,
              displayName: profile.displayName,
              bio: profile.bio,
              photoURL: profile.photoURL,
            }
          : null
      }
    />
  );
}
