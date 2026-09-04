"use client";

import { useCallback, useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import PeoplePage from "@/components/people-page";
import {
  LoadError,
  Skeleton,
  useLoadStatus,
} from "@/components/ui/load-state";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { apiFetch } from "@/lib/api/client";
import type { PublicUserProfile } from "@/types/user";
import type { RecentPublicApp } from "@/types/app";

interface PeoplePayload {
  people: PublicUserProfile[];
  nextCursor: string | null;
  recentApps: RecentPublicApp[];
  viewerUsername: string | null;
}

/** Client-side `/people` for the Apps in Toss bundle, which has no server to
 * render the maker directory. */
export default function PeopleClient() {
  const [data, setData] = useState<PeoplePayload | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [status, setStatus] = useLoadStatus(reloadToken);

  const retry = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const response = await apiFetch("/api/people", {
        cache: "no-store",
      }).catch(() => null);
      if (cancelled) return;

      if (!response?.ok) {
        setStatus("error");
        return;
      }
      const result = (await response.json()) as { data?: PeoplePayload };
      if (cancelled) return;
      if (!result.data) {
        setStatus("error");
        return;
      }
      setData(result.data);
      setStatus("ready");
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [reloadToken, setStatus]);

  if (status !== "ready" || !data) {
    return (
      <div className="people-shell">
        <header className="people-topbar">
          <BrandLogo compact />
        </header>
        <main className="people-main">
          {status === "error" ? (
            <LoadError
              title="메이커 목록을 불러오지 못했어요"
              onRetry={retry}
            />
          ) : (
            <div className="people-grid">
              <Skeleton className="skeleton-person-card" count={4} />
            </div>
          )}
        </main>
        <MobileBottomNav active="people" username={null} />
      </div>
    );
  }

  return (
    <PeoplePage
      people={data.people}
      nextCursor={data.nextCursor}
      recentApps={data.recentApps}
      viewerUsername={data.viewerUsername}
    />
  );
}
