"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppCover } from "@/components/app-cover";
import { AppNotes } from "@/components/app-notes";
import { BrandLogo } from "@/components/brand-logo";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  CheckIcon,
  CopyIcon,
  GitHubIcon,
  HeartIcon,
  ShareIcon,
} from "@/components/icons";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { demoApps, statusLabel, type DemoApp } from "@/lib/mock-data";
import type { PublicAppNote } from "@/types/app-note";

interface ProfileView {
  username: string;
  displayName: string;
  bio: string;
  photoURL: string | null;
}

type NotesByAppId = Record<string, PublicAppNote[]>;

const EMPTY_APP_NOTES: PublicAppNote[] = [];
const EMPTY_NOTES_BY_APP_ID: NotesByAppId = {};

function PublicAppCard({
  app,
  cheerCount,
  cheered,
  cheerPending,
  notes,
  viewerUsername,
  canWriteNotes,
  showNoteLogin,
  onCheer,
}: {
  app: DemoApp;
  cheerCount: number;
  cheered: boolean;
  cheerPending: boolean;
  notes: PublicAppNote[];
  viewerUsername: string | null;
  canWriteNotes: boolean;
  showNoteLogin: boolean;
  onCheer: () => void;
}) {
  const statusTone = `status-${app.status}`;

  return (
    <article className="public-app-card">
      <AppCover kind={app.cover} imageURL={app.imageURL} />
      <div className="public-app-body">
        <div className="public-app-topline">
          <div className="public-app-badges">
            {app.isFirst && <span className="first-app-badge">나의 첫 앱</span>}
            <span className={`tool-badge tool-badge-${app.toolTone}`}>
              {app.tool === "Lovable" ? <HeartIcon /> : <i>✦</i>}
              {app.tool}
            </span>
          </div>
          <span className={`status-pill ${statusTone}`}>
            <i />
            {statusLabel[app.status]}
          </span>
        </div>
        <h2>{app.name}</h2>
        <p>{app.description}</p>
        <div className="public-app-meta">
          <span>{app.clicks}번 열어봤어요</span>
          <span />
          <span>{cheerCount}명이 응원했어요</span>
        </div>
        <div className="public-app-actions">
          {app.url ? (
            <a
              className="button button-dark public-open-button"
              href={
                app.url?.startsWith("/") ? app.url : `/go/${app.id}`
              }
              target="_blank"
              rel="noreferrer"
            >
              {app.status === "paused" ? "그래도 구경하기" : "앱 열기"}
              <ArrowUpRightIcon />
            </a>
          ) : (
            <span className="building-note">
              {app.status === "paused"
                ? "지금은 잠시 쉬고 있어요"
                : "완성되면 다시 와주세요"}
            </span>
          )}
          <button
            className={`button cheer-button${cheered ? " is-cheered" : ""}`}
            type="button"
            onClick={onCheer}
            aria-pressed={cheered}
            disabled={cheerPending}
          >
            <span>{cheered ? "👏" : "♡"}</span>
            {cheerPending ? "저장 중…" : cheered ? "응원했어요" : "응원해요"}
          </button>
        </div>
        <AppNotes
          appId={app.id}
          initialNotes={notes}
          viewerUsername={viewerUsername}
          canWrite={canWriteNotes}
          showLoginPrompt={showNoteLogin}
        />
      </div>
    </article>
  );
}

const demoProfile: ProfileView = {
  username: "etime",
  displayName: "E-time",
  bio: "생활과 호기심을 작은 앱으로 만들고 있어요.",
  photoURL: null,
};

export default function PublicProfilePage({
  profile = demoProfile,
  apps = demoApps,
  notesByAppId = EMPTY_NOTES_BY_APP_ID,
  notesEnabled = false,
  viewerUsername = null,
}: {
  profile?: ProfileView;
  apps?: DemoApp[];
  notesByAppId?: NotesByAppId;
  notesEnabled?: boolean;
  viewerUsername?: string | null;
}) {
  const [cheeredApps, setCheeredApps] = useState<Record<string, boolean>>({});
  const [cheerCounts, setCheerCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(apps.map((app) => [app.id, app.cheers])),
  );
  const [pendingCheers, setPendingCheers] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const isOwnProfile = viewerUsername === profile.username;

  useEffect(() => {
    let cancelled = false;
    void Promise.all(
      apps.map(async (app) => {
        const response = await fetch(`/api/cheer/${encodeURIComponent(app.id)}`, {
          cache: "no-store",
        }).catch(() => null);
        if (!response?.ok) return null;
        const result = (await response.json()) as {
          data?: { cheered?: boolean };
        };
        return [app.id, Boolean(result.data?.cheered)] as const;
      }),
    ).then((states) => {
      if (!cancelled) {
        setCheeredApps((current) => {
          const next = { ...current };
          states.forEach((state) => {
            if (state && !next[state[0]]) next[state[0]] = state[1];
          });
          return next;
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [apps]);

  async function toggleCheer(appId: string) {
    if (cheeredApps[appId] || pendingCheers[appId]) return;
    const app = apps.find((candidate) => candidate.id === appId);
    if (!app) return;

    const previousCount = cheerCounts[appId] ?? app.cheers;
    setCheeredApps((current) => ({ ...current, [appId]: true }));
    setCheerCounts((current) => ({
      ...current,
      [appId]: previousCount + 1,
    }));
    setPendingCheers((current) => ({ ...current, [appId]: true }));

    try {
      const response = await fetch(`/api/cheer/${encodeURIComponent(appId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      }).catch(() => null);
      const result = response?.ok
        ? ((await response.json().catch(() => null)) as {
            data?: { cheers?: number };
          } | null)
        : null;
      const persistedCount = result?.data?.cheers;

      if (typeof persistedCount !== "number" || !Number.isFinite(persistedCount)) {
        setCheeredApps((current) => ({ ...current, [appId]: false }));
        setCheerCounts((current) => ({ ...current, [appId]: previousCount }));
        return;
      }

      setCheerCounts((current) => ({
        ...current,
        [appId]: Math.max(0, persistedCount),
      }));
    } finally {
      setPendingCheers((current) => ({ ...current, [appId]: false }));
    }
  }

  async function shareProfile() {
    const shareData = {
      title: `${profile.displayName}님의 앱들`,
      text: `${profile.displayName}님이 만든 앱들을 한곳에 모아봤어요.`,
      url: window.location.href,
    };

    if (navigator.share) {
      await navigator.share(shareData).catch(() => undefined);
      return;
    }

    await navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  return (
    <div className="public-page-shell">
      <header className="public-topbar">
        <BrandLogo compact />
        <div className="public-topbar-actions">
          <a
            className="public-github-link"
            href="https://github.com/EtainClub/baby-vibe"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Baby Vibe GitHub 저장소 열기"
            title="GitHub"
          >
            <GitHubIcon />
          </a>
          <button className="button public-share-button" type="button" onClick={shareProfile}>
            <ShareIcon />
            공유하기
          </button>
        </div>
      </header>

      <main className="public-profile-main">
        <section className="public-profile-header">
          <div className="profile-avatar-large">
              <span
                style={
                  profile.photoURL
                    ? {
                        backgroundImage: `url("${profile.photoURL.replace(/["\\]/g, "")}")`,
                        backgroundPosition: "center",
                        backgroundSize: "cover",
                        color: "transparent",
                      }
                    : undefined
                }
              >
                {profile.displayName.charAt(0).toUpperCase()}
              </span>
              <i />
            </div>
            <div className="public-profile-copy">
            <span className="profile-handle">@{profile.username}</span>
            <h1>{profile.displayName}</h1>
            <p>{profile.bio}</p>
            <div className="profile-count">
              <strong>{apps.length}</strong>개의 앱을 만들었어요
            </div>
          </div>
          <button
            className="button public-share-button public-share-desktop"
            type="button"
            onClick={shareProfile}
          >
            <ShareIcon />
            이 페이지 공유
          </button>
        </section>

        <div className="public-section-title">
          <h2>만든 앱</h2>
          <span>최근에 만든 순서</span>
        </div>

        <section
          className="public-app-grid"
          aria-label={`${profile.displayName}님이 만든 앱`}
        >
          {apps.length === 0 && (
            <div className="public-empty-apps">
              <span>✦</span>
              <h2>공개를 준비하고 있어요.</h2>
              <p>곧 이곳에서 만든 앱들을 만나볼 수 있어요.</p>
            </div>
          )}
          {apps.map((app) => (
            <PublicAppCard
              key={app.id}
              app={app}
              cheerCount={cheerCounts[app.id] ?? app.cheers}
              cheered={Boolean(cheeredApps[app.id])}
              cheerPending={Boolean(pendingCheers[app.id])}
              notes={notesByAppId[app.id] ?? EMPTY_APP_NOTES}
              viewerUsername={viewerUsername}
              canWriteNotes={notesEnabled && Boolean(viewerUsername) && !isOwnProfile}
              showNoteLogin={notesEnabled && !viewerUsername}
              onCheer={() => toggleCheer(app.id)}
            />
          ))}
        </section>

        <section className="profile-maker-cta">
          <span className="maker-cta-icon">✦</span>
          <div>
            <strong>이 페이지, 마음에 드셨나요?</strong>
            <p>당신이 만든 앱들도 한곳에 모아보세요.</p>
          </div>
          <Link className="button button-dark" href="/login">
            내 페이지 만들기
            <ArrowRightIcon />
          </Link>
        </section>
      </main>

      <footer className="public-footer">
        <BrandLogo compact />
        <p>바이브 코딩으로 만든 앱들을 모아둔 페이지입니다.</p>
      </footer>

      <MobileBottomNav
        active={isOwnProfile ? "profile" : "people"}
        username={viewerUsername}
      />

      <div className={`copy-toast${copied ? " is-visible" : ""}`} role="status">
        <span>
          <CheckIcon />
        </span>
        페이지 링크를 복사했어요
        <CopyIcon />
      </div>
    </div>
  );
}
