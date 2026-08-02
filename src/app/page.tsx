import { redirect } from "next/navigation";
import LandingPage from "@/components/landing-page";
import { getSessionUser } from "@/lib/auth/session";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { getUserProfileByUid } from "@/lib/repositories/user-repository";

export default async function Home() {
  if (isFirebaseAdminConfigured()) {
    const user = await getSessionUser();
    if (user) {
      const profile = await getUserProfileByUid(user.uid);
      redirect(profile?.onboardingCompleted ? "/home" : "/start");
    }
  }
  return <LandingPage />;
}
