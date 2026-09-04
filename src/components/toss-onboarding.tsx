"use client";

import { TossAuthGate } from "@/components/auth/toss-auth-gate";
import OnboardingPage from "@/components/onboarding-page";

/**
 * `/start` for the Apps in Toss bundle. The gate's render prop has to be used
 * from a client module — a function cannot cross the server boundary.
 */
export default function TossOnboarding() {
  return (
    <TossAuthGate require="onboarding">
      {(profile) => (
        <OnboardingPage
          initialProfile={
            profile
              ? {
                  username: profile.username,
                  displayName: profile.displayName,
                  bio: profile.bio,
                  photoURL: profile.photoURL,
                }
              : null
          }
        />
      )}
    </TossAuthGate>
  );
}
