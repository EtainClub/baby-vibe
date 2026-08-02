import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginPage from "@/components/login-page";
import { getSessionUser } from "@/lib/auth/session";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { getUserProfileByUid } from "@/lib/repositories/user-repository";

export const metadata: Metadata = {
  title: "Google로 시작하기",
};

export default async function LoginRoute() {
  if (isFirebaseAdminConfigured()) {
    const user = await getSessionUser();
    if (user) {
      const profile = await getUserProfileByUid(user.uid);
      redirect(profile?.onboardingCompleted ? "/home" : "/start");
    }
  }
  return <LoginPage />;
}
