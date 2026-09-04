import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TossAuthGate } from "@/components/auth/toss-auth-gate";
import SettingsPage from "@/components/settings-page";
import { getSessionUser } from "@/lib/auth/session";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { IS_TOSS_APP } from "@/lib/platform";
import packageInfo from "../../../package.json";

export const metadata: Metadata = {
  title: "프로필 설정",
};

export default async function SettingsRoute() {
  if (IS_TOSS_APP) {
    return (
      <TossAuthGate require="any">
        <SettingsPage appVersion={packageInfo.version} />
      </TossAuthGate>
    );
  }

  if (isFirebaseAdminConfigured() && !(await getSessionUser())) {
    redirect("/login");
  }
  return <SettingsPage appVersion={packageInfo.version} />;
}
