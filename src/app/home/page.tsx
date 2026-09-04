import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TossAuthGate } from "@/components/auth/toss-auth-gate";
import DashboardPage from "@/components/dashboard-page";
import { getSessionUser } from "@/lib/auth/session";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { IS_TOSS_APP } from "@/lib/platform";
import { getUserProfileByUid } from "@/lib/repositories/user-repository";

export const metadata: Metadata = {
  title: "내 홈",
};

export default async function HomePage() {
  // The Apps in Toss bundle is a static export: there is no request to read a
  // session from, so the same gate runs on the client instead.
  if (IS_TOSS_APP) {
    return (
      <TossAuthGate require="registered">
        <DashboardPage />
      </TossAuthGate>
    );
  }

  if (isFirebaseAdminConfigured()) {
    const user = await getSessionUser();
    if (!user) redirect("/login");

    // Only a missing profile sends someone back to onboarding — the dashboard
    // handles an empty app list itself, and can add the first app.
    const profile = await getUserProfileByUid(user.uid);
    if (!profile) redirect("/start");
  }
  return <DashboardPage />;
}
