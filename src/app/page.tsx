import { redirect } from "next/navigation";
import LandingPage from "@/components/landing-page";
import { getSessionUser } from "@/lib/auth/session";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";

export default async function Home() {
  if (isFirebaseAdminConfigured() && (await getSessionUser())) {
    redirect("/home");
  }
  return <LandingPage />;
}
