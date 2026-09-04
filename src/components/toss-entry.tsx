"use client";

import { TossAuthGate, TossRedirect } from "@/components/auth/toss-auth-gate";
import LandingPage from "@/components/landing-page";

/**
 * `/` for the Apps in Toss bundle.
 *
 * A first-time visitor gets the same landing page the web does — dropping
 * someone straight into the app form gave them nothing to opt out of. A maker
 * who already has a profile skips it and goes to the dashboard, so the header
 * logo (which links to `/`) works as a way home.
 */
export default function TossEntry() {
  return (
    <TossAuthGate require="any">
      {(profile) =>
        profile ? <TossRedirect href="/home" /> : <LandingPage />
      }
    </TossAuthGate>
  );
}
