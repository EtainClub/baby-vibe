"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PublicProfilePage from "@/components/public-profile-page";
import { BrandMark } from "@/components/brand-logo";
import { LoadError, Skeleton, useLoadStatus } from "@/components/ui/load-state";
import { apiFetch } from "@/lib/api/client";
import { ensureAnonymousUser } from "@/lib/firebase/auth";
import { IS_TOSS_APP } from "@/lib/platform";
import type { DemoApp } from "@/lib/mock-data";
import type { PublicAppNote } from "@/types/app-note";

interface ProfilePayload {
  profile: {
    username: string;
    displayName: string;
    bio: string;
    photoURL: string | null;
  };
  apps: DemoApp[];
  notesByAppId: Record<string, PublicAppNote[]>;
  notesEnabled: boolean;
  viewerUsername: string | null;
}

/** Fetches a public profile by `?u=<username>` — see src/app/u/page.tsx. */
export default function PublicProfileClient() {
  const username = useSearchParams().get("u") ?? "";
  const [reloadToken, setReloadToken] = useState(0);
  const [status, setStatus] = useLoadStatus(reloadToken);
  const [payload, setPayload] = useState<ProfilePayload | null>(null);
  const [missing, setMissing] = useState(!username);

  const retry = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;

    async function load() {
      // Reachable straight from a shared link, so it has to establish the
      // anonymous identity itself — cheering and notes both need one.
      if (IS_TOSS_APP) await ensureAnonymousUser();

      const response = await apiFetch(
        `/api/u/${encodeURIComponent(username)}`,
        { cache: "no-store" },
      ).catch(() => null);
      if (cancelled) return;

      // A missing maker and a dropped connection are different problems and
      // need different answers — one is final, the other is worth retrying.
      if (response?.status === 404) {
        setMissing(true);
        setStatus("ready");
        return;
      }
      if (!response?.ok) {
        setStatus("error");
        return;
      }

      const result = (await response.json()) as { data?: ProfilePayload };
      if (cancelled) return;
      if (!result.data) {
        setMissing(true);
        setStatus("ready");
        return;
      }
      setPayload(result.data);
      setMissing(false);
      setStatus("ready");
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [username, reloadToken, setStatus]);

  if (status === "error") {
    return (
      <div className="toss-splash">
        <BrandMark />
        <LoadError
          title="페이지를 불러오지 못했어요"
          onRetry={retry}
          retrying={false}
        />
      </div>
    );
  }

  if (status === "loading" && username) {
    return (
      <div className="public-profile-skeleton" role="status" aria-live="polite">
        <Skeleton className="skeleton-stat" />
        <Skeleton className="skeleton-app-card" count={2} />
        <span className="sr-only">메이커 페이지를 불러오는 중이에요</span>
      </div>
    );
  }

  if (missing || !payload) {
    return (
      <div className="toss-splash">
        <BrandMark />
        <p>이 주소의 페이지를 찾을 수 없어요.</p>
        <Link className="button button-quiet" href="/people">
          다른 메이커 둘러보기
        </Link>
      </div>
    );
  }

  return (
    <PublicProfilePage
      profile={payload.profile}
      apps={payload.apps}
      notesByAppId={payload.notesByAppId}
      notesEnabled={payload.notesEnabled}
      viewerUsername={payload.viewerUsername}
    />
  );
}
