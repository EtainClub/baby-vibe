import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginPage from "@/components/login-page";
import { getSessionUser } from "@/lib/auth/session";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";

export const metadata: Metadata = {
  title: "Google로 시작하기",
};

export default async function LoginRoute() {
  if (isFirebaseAdminConfigured() && (await getSessionUser())) {
    redirect("/home");
  }
  return <LoginPage />;
}
