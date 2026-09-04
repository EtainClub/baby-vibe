import TossEntry from "@/components/toss-entry";

/**
 * `/` for the Apps in Toss bundle.
 *
 * Swapped in for src/app/page.tsx by scripts/build-toss.mjs, so the entry
 * screen never pulls in the Google sign-in button that the Toss webview
 * cannot run. The landing page itself does ship here — it is what a
 * first-time visitor sees.
 */
export default function TossHome() {
  return <TossEntry />;
}
