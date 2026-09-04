import type { Metadata } from "next";
import TossWelcomePage from "@/components/toss-welcome-page";

export const metadata: Metadata = {
  title: "시작하기",
};

/**
 * `/login` for the Apps in Toss bundle.
 *
 * Swapped in by scripts/build-toss.mjs so the Google sign-in button — which
 * cannot work in the Toss webview — never reaches the bundle. See
 * toss-overrides/app/page.tsx for why a dynamic import isn't sufficient.
 */
export default function TossLoginRoute() {
  return <TossWelcomePage />;
}
