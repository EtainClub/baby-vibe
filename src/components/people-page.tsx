"use client";

import Link from "next/link";
import { useState } from "react";
import { AppCover } from "@/components/app-cover";
import { BrandLogo } from "@/components/brand-logo";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  HomeIcon,
  SparkleIcon,
  UsersIcon,
} from "@/components/icons";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { apiFetch } from "@/lib/api/client";
import { outboundHref, profileHref } from "@/lib/routes";
import { getToolTone, TOOL_LABELS } from "@/lib/utils/tool-labels";
import type { RecentPublicApp } from "@/types/app";
import type { PublicUserProfile } from "@/types/user";

function relativeDay(iso: string) {
  const days = Math.floor(
    (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (days <= 0) return "오늘";
  if (days === 1) return "어제";
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  return `${Math.floor(days / 30)}개월 전`;
}

function RecentAppCard({ app }: { app: RecentPublicApp }) {
  const toolLabel = app.customToolName || TOOL_LABELS[app.tool] || app.tool;

  return (
    <article className="recent-app-card">
      <Link
        className="recent-app-owner"
        href={profileHref(app.ownerUsername)}
        prefetch={false}
      >
        <span
          className="recent-app-avatar"
          style={
            app.ownerPhotoURL
              ? {
                  backgroundImage: `url("${app.ownerPhotoURL.replace(/["\\]/g, "")}")`,
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                  color: "transparent",
                }
              : undefined
          }
        >
          {app.ownerDisplayName.charAt(0).toUpperCase()}
        </span>
        <span>
          <strong>{app.ownerDisplayName}</strong>
          <small>{relativeDay(app.createdAt)}</small>
        </span>
      </Link>

      <div className="recent-app-body">
        <AppCover kind="alien" compact imageURL={app.imageURL} />
        <div>
          <span className={`tool-badge tool-badge-${getToolTone(app.tool, app.customToolName)}`}>
            <i>✦</i>
            {toolLabel}
          </span>
          <h3>{app.name}</h3>
          <p>{app.description}</p>
        </div>
      </div>

      {app.url && (
        <a
          className="button button-quiet recent-app-open"
          href={outboundHref(app.id)}
          target="_blank"
          rel="noreferrer"
        >
          앱 열기
          <ArrowUpRightIcon />
        </a>
      )}
    </article>
  );
}

export default function PeoplePage({
  people,
  recentApps = [],
  nextCursor = null,
  viewerUsername,
}: {
  people: PublicUserProfile[];
  recentApps?: RecentPublicApp[];
  nextCursor?: string | null;
  viewerUsername?: string | null;
}) {
  const [loadedPeople, setLoadedPeople] = useState(people);
  const [cursor, setCursor] = useState(nextCursor);
  const [loadingMore, setLoadingMore] = useState(false);

  const otherPeople = loadedPeople.filter(
    (person) => person.username !== viewerUsername,
  );

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const response = await apiFetch(
        `/api/people?cursor=${encodeURIComponent(cursor)}`,
        { cache: "no-store" },
      ).catch(() => null);
      const result = response?.ok
        ? ((await response.json().catch(() => null)) as {
            data?: { people?: PublicUserProfile[]; nextCursor?: string | null };
          } | null)
        : null;
      if (!result?.data?.people) return;

      setLoadedPeople((current) => [...current, ...result.data!.people!]);
      setCursor(result.data.nextCursor ?? null);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="people-shell">
      <header className="people-topbar">
        <BrandLogo compact />
        <Link href="/home">
          <HomeIcon />
          내 홈
        </Link>
      </header>

      <main className="people-main">
        <section className="people-hero">
          <span className="people-kicker">
            <UsersIcon />
            메이커 둘러보기
          </span>
          <h1>다른 사람들은<br />무엇을 만들고 있을까요?</h1>
          <p>궁금한 사람을 골라 그 사람이 공개한 앱들을 한 번에 만나보세요.</p>
        </section>

        {recentApps.length > 0 && (
          <section className="people-section" aria-labelledby="recent-apps-title">
            <div className="people-section-heading">
              <div>
                <h2 id="recent-apps-title">
                  <SparkleIcon />
                  방금 올라온 앱
                </h2>
                <p>가장 최근에 공개된 앱들이에요.</p>
              </div>
            </div>
            <div className="recent-app-rail">
              {recentApps.map((app) => (
                <RecentAppCard app={app} key={app.id} />
              ))}
            </div>
          </section>
        )}

        <section className="people-section" aria-labelledby="people-list-title">
          <div className="people-section-heading">
            <div>
              <h2 id="people-list-title">새로운 메이커</h2>
              <p>프로필을 누르면 공개한 앱 목록으로 이동해요.</p>
            </div>
            <span>{otherPeople.length}명</span>
          </div>

          {otherPeople.length > 0 ? (
            <div className="people-grid">
              {otherPeople.map((person, index) => (
                <Link
                  className="person-card"
                  href={profileHref(person.username)}
                  prefetch={false}
                  key={person.username}
                >
                  <span
                    className={`person-avatar person-avatar-${(index % 4) + 1}`}
                    style={
                      person.photoURL
                        ? {
                            backgroundImage: `url("${person.photoURL.replace(/["\\]/g, "")}")`,
                            backgroundPosition: "center",
                            backgroundSize: "cover",
                            color: "transparent",
                          }
                        : undefined
                    }
                  >
                    {person.displayName.charAt(0).toUpperCase()}
                  </span>
                  <span className="person-card-copy">
                    <small>@{person.username}</small>
                    <strong>{person.displayName}</strong>
                    <p>{person.bio || "작은 아이디어를 앱으로 만들고 있어요."}</p>
                  </span>
                  <span className="person-card-action">
                    만든 앱 보기
                    <ArrowRightIcon />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="people-empty">
              <span><UsersIcon /></span>
              <h2>곧 새로운 메이커를 만날 수 있어요.</h2>
              <p>다른 사용자가 앱을 공개하면 이곳에 표시됩니다.</p>
            </div>
          )}

          {cursor && (
            <button
              className="button button-quiet people-load-more"
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
            >
              {loadingMore ? "불러오는 중…" : "더 보기"}
            </button>
          )}
        </section>
      </main>

      <MobileBottomNav active="people" username={viewerUsername} />
    </div>
  );
}
