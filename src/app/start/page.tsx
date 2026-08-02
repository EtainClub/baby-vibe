import type { Metadata } from "next";
import { redirect } from "next/navigation";
import OnboardingPage from "@/components/onboarding-page";
import { getSessionUser } from "@/lib/auth/session";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { getUserProfileByUid } from "@/lib/repositories/user-repository";

export const metadata: Metadata = {
  title: "내 앱 페이지 만들기",
};

export default async function StartPage() {
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
