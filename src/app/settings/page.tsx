import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SettingsPage from "@/components/settings-page";
import { getSessionUser } from "@/lib/auth/session";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";

export const metadata: Metadata = {
  title: "프로필 설정",
};

export default async function SettingsRoute() {
  if (isFirebaseAdminConfigured() && !(await getSessionUser())) {
    redirect("/login");
  }
  return <SettingsPage />;
}
