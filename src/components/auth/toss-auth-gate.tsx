"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/brand-logo";
import { apiFetch } from "@/lib/api/client";
import { ensureAnonymousUser } from "@/lib/firebase/auth";

export interface GateProfile {
  username: string;
  displayName: string;
  bio: string;
  photoURL: string | null;
  onboardingCompleted: boolean;
}

/**
 * `registered` means "has a profile", not "has finished onboarding" — a maker
 * who created a profile and then skipped the first app still belongs on the
 * dashboard, which can add apps on its own.
 */
type Requirement = "registered" | "onboarding" | "any";

/**
 * Client-side session gate for the Apps in Toss build.
 *
 * The Toss bundle is a static export, so the redirects the server components do
 * on the web (`getSessionUser()` → `redirect()`) have to happen here instead,
 * after signing in anonymously and reading the profile over the API.
 */
export function TossAuthGate({
  require,
  children,
}: {
  require: Requirement;
  children: ReactNode | ((profile: GateProfile | null) => ReactNode);
}) {
  const router = useRouter();
  const [state, setState] = useState<
    { status: "loading" } | { status: "ready"; profile: GateProfile | null }
  >({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function resolveSession() {
      await ensureAnonymousUser();
      const response = await apiFetch("/api/profile", {
        cache: "no-store",
      }).catch(() => null);
      if (cancelled) return;

      const profile =
        response?.ok === true
          ? ((await response.json()) as { data?: GateProfile | null }).data ??
            null
          : null;
      if (cancelled) return;

      if (require === "registered" && !profile) {
        router.replace("/start");
        return;
      }
      if (require === "onboarding" && profile?.onboardingCompleted) {
        router.replace("/home");
        return;
      }

      setState({ status: "ready", profile });
    }

    void resolveSession();
    return () => {
      cancelled = true;
    };
  }, [require, router]);

  if (state.status === "loading") {
    return (
      <div className="toss-splash" role="status" aria-live="polite">
        <BrandMark />
        <span>불러오는 중이에요…</span>
      </div>
    );
  }

  return (
    <>{typeof children === "function" ? children(state.profile) : children}</>
  );
}

/** Sends the viewer somewhere else as soon as it mounts. */
export function TossRedirect({ href }: { href: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(href);
  }, [href, router]);

  return (
    <div className="toss-splash" role="status" aria-live="polite">
      <BrandMark />
      <span>불러오는 중이에요…</span>
    </div>
  );
}
