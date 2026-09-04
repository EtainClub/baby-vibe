import { redirect } from "next/navigation";
import TossEntry from "@/components/toss-entry";
import { getSessionUser } from "@/lib/auth/session";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { IS_TOSS_APP } from "@/lib/platform";
import { getUserProfileByUid } from "@/lib/repositories/user-repository";

export default async function Home() {
  // Inside Toss the session can only be resolved on the client (static
  // export), so the same "a registered maker goes home, everyone else sees the
  // landing page" decision is made there instead.
  if (IS_TOSS_APP) return <TossEntry />;

  if (isFirebaseAdminConfigured()) {
    const user = await getSessionUser();
    if (user) {
      // Having a profile is enough to belong on the dashboard — someone who
      // skipped the first app should not be pushed back into onboarding.
      const profile = await getUserProfileByUid(user.uid);
      redirect(profile ? "/home" : "/start");
    }
  }

  const { default: LandingPage } = await import("@/components/landing-page");
  return <LandingPage />;
}
