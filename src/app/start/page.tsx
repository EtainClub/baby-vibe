import type { Metadata } from "next";
import { redirect } from "next/navigation";
import OnboardingPage from "@/components/onboarding-page";
import { getSessionUser } from "@/lib/auth/session";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";

export const metadata: Metadata = {
  title: "내 앱 페이지 만들기",
};

export default async function StartPage() {
  if (isFirebaseAdminConfigured() && !(await getSessionUser())) {
    redirect("/login");
  }
  return <OnboardingPage />;
}
