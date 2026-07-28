"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { CheckIcon, ChevronLeftIcon } from "@/components/icons";
import { LogoutButton } from "@/components/auth/logout-button";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { uploadProfileImage } from "@/lib/firebase/upload-image";

interface EditableProfile {
  username: string;
  displayName: string;
  bio: string;
  photoURL: string | null;
}

const fallbackProfile: EditableProfile = {
  username: "etime",
  displayName: "E-time",
  bio: "생활 속 아이디어를 작은 앱으로 만들고 있어요.",
  photoURL: null,
};

export default function SettingsPage({ appVersion }: { appVersion: string }) {
  const [profile, setProfile] = useState(fallbackProfile);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/profile", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const result = (await response.json()) as { data?: EditableProfile };
        if (result.data && !cancelled) setProfile(result.data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: profile.displayName,
          bio: profile.bio,
          photoURL: profile.photoURL,
        }),
      });
      const result = (await response.json()) as {
        data?: EditableProfile;
        error?: { message?: string };
      };

      if (!response.ok) {
        if ([401, 503].includes(response.status)) {
          setMessage("데모 모드에서 변경 내용을 미리 적용했어요.");
          return;
        }
        throw new Error(result.error?.message || "프로필을 저장하지 못했어요.");
      }
      if (result.data) setProfile(result.data);
      setMessage("프로필을 저장했어요.");
    } catch (caught) {
      setIsError(true);
      setMessage(caught instanceof Error ? caught.message : "프로필을 저장하지 못했어요.");
    } finally {
      setPending(false);
    }
  }

  async function changePhoto(file?: File) {
    if (!file) return;
    setPending(true);
    setMessage("");
    try {
      const photoURL = await uploadProfileImage(file);
      setProfile((current) => ({ ...current, photoURL }));
      setMessage("새 프로필 이미지를 선택했어요. 저장 버튼을 눌러주세요.");
      setIsError(false);
    } catch (caught) {
      setIsError(true);
      setMessage(
        caught instanceof Error ? caught.message : "프로필 이미지를 올리지 못했어요.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="settings-shell">
      <header className="settings-topbar">
        <BrandLogo compact />
        <Link href="/home">
          <ChevronLeftIcon />
          내 홈으로
        </Link>
      </header>
      <main className="settings-main">
        <aside className="settings-aside">
          <span>내 정보</span>
          <h1>프로필 설정</h1>
          <p>공개 앱 페이지 위에 보여지는 정보를 관리해요.</p>
          <nav>
            <a className="is-current" href="#profile">
              프로필
            </a>
            <a href="#account">계정</a>
          </nav>
        </aside>
        <section className="settings-panel" id="profile">
          <div className="settings-heading">
            <h2>프로필 정보</h2>
            <p>이 정보는 누구나 볼 수 있는 내 앱 페이지에 표시됩니다.</p>
          </div>
          <form className="settings-form" onSubmit={saveProfile}>
            <div className="settings-avatar-row">
              <div
                className="settings-avatar"
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
                {profile.displayName.charAt(0)}
              </div>
              <div>
                <strong>프로필 이미지</strong>
                <p>JPG, PNG 또는 WebP · 최대 5MB</p>
                <label className="settings-photo-button">
                  이미지 바꾸기
                  <input
                    className="visually-hidden"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => void changePhoto(event.target.files?.[0])}
                  />
                </label>
              </div>
            </div>

            <label className="field-group">
              <span>표시 이름</span>
              <input
                value={profile.displayName}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    displayName: event.target.value,
                  }))
                }
                maxLength={40}
                required
              />
              <small>{profile.displayName.length} / 40</small>
            </label>

            <label className="field-group">
              <span>사용자명</span>
              <div className="settings-username">
                <i>baby-vibe.web.app/</i>
                <input value={profile.username} disabled />
              </div>
              <small>첫 버전에서는 사용자명을 변경할 수 없어요.</small>
            </label>

            <label className="field-group">
              <span>한 줄 소개</span>
              <textarea
                value={profile.bio}
                onChange={(event) =>
                  setProfile((current) => ({ ...current, bio: event.target.value }))
                }
                maxLength={120}
                rows={4}
              />
              <small>{profile.bio.length} / 120</small>
            </label>

            {message && (
              <p className={isError ? "settings-message is-error" : "settings-message"}>
                {!isError && <CheckIcon />}
                {message}
              </p>
            )}
            <button className="button button-primary settings-save" disabled={pending}>
              {pending ? "저장하는 중…" : "변경 내용 저장"}
            </button>
          </form>

          <div className="settings-account" id="account">
            <div>
              <h2>계정</h2>
              <p>Google 계정으로 로그인하고 있어요.</p>
            </div>
            <div className="settings-account-actions">
              <span>Google</span>
              <LogoutButton />
            </div>
            <div className="settings-version" aria-label={`앱 버전 ${appVersion}`}>
              <span>Baby Vibe</span>
              <small>버전 {appVersion}</small>
            </div>
          </div>
        </section>
      </main>
      <MobileBottomNav active="settings" username={profile.username} />
    </div>
  );
}
