import type { Metadata } from "next";
import { redirect } from "next/navigation";
import DashboardPage from "@/components/dashboard-page";
import { getSessionUser } from "@/lib/auth/session";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";

export const metadata: Metadata = {
  title: "내 홈",
};

export default async function HomePage() {
  if (isFirebaseAdminConfigured() && !(await getSessionUser())) {
    redirect("/login");
  }
  return <DashboardPage />;
}
