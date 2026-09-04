import type { Metadata } from "next";
import { redirect } from "next/navigation";
import TossWelcomePage from "@/components/toss-welcome-page";
import { getSessionUser } from "@/lib/auth/session";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { IS_TOSS_APP } from "@/lib/platform";
import { getUserProfileByUid } from "@/lib/repositories/user-repository";

export const metadata: Metadata = {
  title: IS_TOSS_APP ? "시작하기" : "Google로 시작하기",
};

export default async function LoginRoute() {
  // Google sign-in needs a popup or redirect, neither of which the Toss webview
  // allows — the Toss build gets an anonymous start plus recovery-key restore,
  // and never loads the Google button's code.
  if (IS_TOSS_APP) return <TossWelcomePage />;

  if (isFirebaseAdminConfigured()) {
    const user = await getSessionUser();
    if (user) {
      const profile = await getUserProfileByUid(user.uid);
      redirect(profile ? "/home" : "/start");
    }
  }

  const { default: LoginPage } = await import("@/components/login-page");
  return <LoginPage />;
}
