import type { Metadata } from "next";
import { redirect } from "next/navigation";
import DashboardPage from "@/components/dashboard-page";
import { getSessionUser } from "@/lib/auth/session";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { getUserProfileByUid } from "@/lib/repositories/user-repository";

export const metadata: Metadata = {
  title: "내 홈",
};

export default async function HomePage() {
  if (isFirebaseAdminConfigured()) {
    const user = await getSessionUser();
    if (!user) redirect("/login");

    const profile = await getUserProfileByUid(user.uid);
    if (!profile?.onboardingCompleted) redirect("/start");
  }
  return <DashboardPage />;
}
