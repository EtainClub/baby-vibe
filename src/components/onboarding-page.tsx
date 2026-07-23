"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { BrandLogo, BrandMark } from "@/components/brand-logo";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  CheckIcon,
  ChevronLeftIcon,
  GoogleIcon,
  LinkIcon,
  SparkleIcon,
} from "@/components/icons";
import {
  getFirebaseClientServices,
  isFirebaseClientConfigured,
} from "@/lib/firebase/client";
import {
  uploadAppCover,
  uploadProfileImage,
} from "@/lib/firebase/upload-image";
import { onAuthStateChanged } from "firebase/auth";

type Step = "profile" | "app" | "done";

const tools = [
  ["codex", "❯", "Codex"],
  ["claude-code", "✦", "Claude Code"],
  ["lovable", "♥", "Lovable"],
  ["bolt", "↯", "Bolt"],
  ["replit", "R", "Replit"],
  ["v0", "▲", "v0"],
  ["base44", "44", "Base44"],
  ["cursor", "⌁", "Cursor"],
  ["firebase-studio", "◆", "Firebase Studio"],
  ["other", "＋", "기타"],
];

export default function OnboardingPage() {
  const demoMode = !isFirebaseClientConfigured;
  const [step, setStep] = useState<Step>("profile");
  const [displayName, setDisplayName] = useState(demoMode ? "E-time" : "");
  const [username, setUsername] = useState(demoMode ? "etime" : "");
  const [bio, setBio] = useState(
    demoMode ? "생활 속 아이디어를 작은 앱으로 만들고 있어요." : "",
  );
  const [usernameState, setUsernameState] = useState<
    "available" | "checking" | "invalid" | "taken"
  >("available");
  const [tool, setTool] = useState("claude-code");
  const [customToolName, setCustomToolName] = useState("");
  const [status, setStatus] = useState("live");
  const [isPublished, setIsPublished] = useState(true);
  const [appUrl, setAppUrl] = useState(
    demoMode ? "https://alien-index.app" : "",
  );
  const [appName, setAppName] = useState(demoMode ? "Alien Index" : "");
  const [appDescription, setAppDescription] = useState(
    demoMode ? "당신의 외계인 성향을 알아보는 1분 테스트" : "",
  );
  const [appImageURL, setAppImageURL] = useState<string | null>(null);
  const [appFaviconURL, setAppFaviconURL] = useState<string | null>(null);
  const [appCoverFile, setAppCoverFile] = useState<File | null>(null);
  const [appCoverPreview, setAppCoverPreview] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState("");
  const [copied, setCopied] = useState(false);
  const [inspectMessage, setInspectMessage] = useState(
    demoMode ? "앱 정보를 찾았어요" : "주소를 넣고 정보를 가져와 주세요",
  );
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const services = getFirebaseClientServices();
    if (!services) return;
    return onAuthStateChanged(services.auth, (user) => {
      if (user?.photoURL) setPhotoURL(user.photoURL);
      if (user?.displayName) setDisplayName(user.displayName);
      const suggestedUsername = (user?.email?.split("@")[0] ?? "")
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
        .replace(/^-+|-+$/g, "")
        .slice(0, 24);
      if (suggestedUsername.length >= 3) {
        setUsername(suggestedUsername);
        setUsernameState("available");
      }
    });
  }, []);

  async function handleAvatar(file?: File) {
    if (!file) return;
    setPending(true);
    setFormError("");
    try {
      setPhotoURL(await uploadProfileImage(file));
    } catch (caught) {
      setFormError(
        caught instanceof Error ? caught.message : "프로필 사진을 올리지 못했어요.",
      );
    } finally {
      setPending(false);
    }
  }

  async function checkUsername() {
    if (
      username.length < 3 ||
      username.length > 24 ||
      !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(username)
    ) {
      setUsernameState("invalid");
      return;
    }
    setUsernameState("checking");
    try {
      const response = await fetch(`/api/username/${encodeURIComponent(username)}`, {
        cache: "no-store",
      });
      const result = (await response.json()) as {
        data?: { available?: boolean };
        error?: { code?: string };
      };
      if (response.ok) {
        setUsernameState(result.data?.available ? "available" : "taken");
      } else if (response.status === 503) {
        setUsernameState("available");
      } else {
        setUsernameState(
          result.error?.code === "reserved_username" ? "taken" : "invalid",
        );
      }
    } catch {
      setUsernameState("available");
    }
  }

  async function nextFromProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (usernameState === "invalid" || usernameState === "taken") {
      setFormError("사용할 수 있는 사용자명을 먼저 입력해 주세요.");
      return;
    }
    setPending(true);
    setFormError("");
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          displayName: formData.get("displayName"),
          bio: formData.get("bio"),
          photoURL,
        }),
      });
      const result = (await response.json()) as {
        error?: { code?: string; message?: string };
      };

      if (response.ok || result.error?.code === "profile_exists") {
        setProfileSaved(true);
        setStep("app");
      } else if ([401, 503].includes(response.status)) {
        setProfileSaved(false);
        setStep("app");
      } else {
        setFormError(result.error?.message || "프로필을 저장하지 못했어요.");
      }
    } catch {
      setProfileSaved(false);
      setStep("app");
    } finally {
      setPending(false);
    }
  }

  async function finishApp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (tool === "other" && !customToolName.trim()) {
      setFormError("사용한 도구 이름을 입력해 주세요.");
      return;
    }
    setPending(true);
    setFormError("");

    if (!profileSaved) {
      setPending(false);
      setStep("done");
      return;
    }

    try {
      const response = await fetch("/api/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: appName,
          description: appDescription,
          url: appUrl || null,
          imageURL: appImageURL,
          faviconURL: appFaviconURL,
          tool,
          customToolName: tool === "other" ? customToolName.trim() : null,
          status,
          isPublished,
        }),
      });
      const result = (await response.json()) as {
        data?: { id?: string };
        error?: { message?: string };
      };
      if (!response.ok) {
        setFormError(result.error?.message || "앱을 저장하지 못했어요.");
        return;
      }
      if (appCoverFile && result.data?.id) {
        try {
          const imageURL = await uploadAppCover(appCoverFile, result.data.id);
          await fetch(`/api/apps/${result.data.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageURL }),
          });
        } catch {
          setFormError(
            "앱은 등록했지만 대표 이미지는 올리지 못했어요. 내 홈에서 다시 바꿀 수 있어요.",
          );
        }
      }
      setStep("done");
    } catch {
      setFormError("연결이 불안정해요. 잠시 뒤에 다시 시도해 주세요.");
    } finally {
      setPending(false);
    }
  }

  async function inspectApp() {
    setPending(true);
    setFormError("");
    setInspectMessage("앱 정보를 확인하고 있어요…");
    try {
      const response = await fetch("/api/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: appUrl }),
      });
      const result = (await response.json()) as {
        data?: {
          title?: string;
          description?: string;
          image?: string | null;
          favicon?: string | null;
        };
        error?: { message?: string };
      };
      if (!response.ok) {
        setInspectMessage("자동으로 가져오지 못했어요. 직접 입력해도 괜찮아요.");
        setFormError(result.error?.message || "");
        return;
      }
      if (result.data?.title) setAppName(result.data.title.slice(0, 50));
      if (result.data?.description) {
        setAppDescription(result.data.description.slice(0, 140));
      }
      if (result.data?.image) {
        setAppImageURL(result.data.image);
        setAppCoverPreview(result.data.image);
      }
      if (result.data?.favicon) setAppFaviconURL(result.data.favicon);
      setInspectMessage("앱 정보를 찾았어요");
    } catch {
      setInspectMessage("자동으로 가져오지 못했어요. 직접 입력해도 괜찮아요.");
    } finally {
      setPending(false);
    }
  }

  function chooseAppCover(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setFormError("JPG, PNG 또는 WebP 이미지를 선택해 주세요.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError("이미지는 5MB 이하로 선택해 주세요.");
      return;
    }
    if (appCoverPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(appCoverPreview);
    }
    setAppCoverFile(file);
    setAppCoverPreview(URL.createObjectURL(file));
    setFormError("");
  }

  async function copyProfileLink() {
    const profileUrl = `${window.location.origin}/${username}`;
    await navigator.clipboard?.writeText(profileUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  return (
    <div className="onboarding-shell">
      <header className="onboarding-topbar">
        <BrandLogo />
        {step !== "done" && (
          <span className="onboarding-step-count">
            {step === "profile" ? "1" : "2"} <i>/</i> 2
          </span>
        )}
        <Link className="onboarding-exit" href="/">
          나중에 하기
        </Link>
      </header>

      <main className="onboarding-main">
        <aside className="onboarding-aside">
          <div className="aside-orbit" />
          {step === "profile" && (
            <div className="aside-content">
              <span className="aside-kicker">반가워요!</span>
              <h1>
                먼저, 당신을
                <br />
                소개해 주세요.
              </h1>
              <p>
                거창한 경력은 필요 없어요.
                <br />
                어떤 것을 만드는 사람인지 한 줄이면 충분해요.
              </p>
              <div className="aside-tip">
                <span>💡</span>
                <p>
                  <strong>이름은 언제든 바꿀 수 있어요.</strong>
                  사용자명은 첫 버전에서 한 번 정하면 바꿀 수 없어요.
                </p>
              </div>
            </div>
          )}
          {step === "app" && (
            <div className="aside-content">
              <span className="aside-kicker">거의 다 됐어요</span>
              <h1>
                첫 앱의 주소를
                <br />
                붙여넣어 주세요.
              </h1>
              <p>
                완성되지 않아도 괜찮아요.
                <br />
                지금 만들고 있는 앱도 당당히 올릴 수 있어요.
              </p>
              <div className="aside-app-preview">
                <span className="preview-orb">👽</span>
                <span>
                  <small>첫 앱 미리 보기</small>
                  <strong>{appName || "첫 앱을 기다리고 있어요"}</strong>
                </span>
                <CheckIcon />
              </div>
            </div>
          )}
          {step === "done" && (
            <div className="aside-content aside-content-done">
              <span className="aside-kicker">첫 번째 성취</span>
              <h1>
                이제 당신도
                <br />
                만드는 사람이에요.
              </h1>
              <p>
                첫 앱을 올린 오늘을 기억해둘게요.
                <br />
                다음 앱이 생기면 이곳에 또 모아주세요.
              </p>
            </div>
          )}
        </aside>

        <section className="onboarding-panel">
          {step === "profile" && (
            <form className="onboarding-form" onSubmit={nextFromProfile}>
              <div className="form-heading">
                <span>내 프로필</span>
                <h2>어떻게 불러드릴까요?</h2>
                <p>내 앱 페이지 위에 보여지는 정보예요.</p>
              </div>

              <div className="avatar-picker">
                <div
                  className="form-avatar"
                  style={
                    photoURL
                      ? {
                          backgroundImage: `url("${photoURL.replace(/["\\]/g, "")}")`,
                          backgroundPosition: "center",
                          backgroundSize: "cover",
                          color: "transparent",
                        }
                      : undefined
                  }
                >
                  {displayName.charAt(0).toUpperCase() || "?"}
                </div>
                <div>
                  <button type="button" onClick={() => avatarInput.current?.click()}>
                    사진 바꾸기
                  </button>
                  <span>JPG, PNG 또는 WebP · 최대 5MB</span>
                  <input
                    ref={avatarInput}
                    className="visually-hidden"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => void handleAvatar(event.target.files?.[0])}
                  />
                </div>
              </div>

              <label className="field-group">
                <span>표시 이름</span>
                <input
                  name="displayName"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  maxLength={40}
                  placeholder="어떻게 불러드릴까요?"
                  required
                />
                <small>40자까지 입력할 수 있어요</small>
              </label>

              <label className="field-group">
                <span>사용자명</span>
                <div className="username-input">
                  <i>baby-vibe.web.app/</i>
                  <input
                    name="username"
                    value={username}
                    onChange={(event) =>
                      {
                        const next = event.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, "");
                        setUsername(next);
                        setUsernameState(
                          next.length >= 3 && next.length <= 24
                            ? "available"
                            : "invalid",
                        );
                      }
                    }
                    onBlur={() => void checkUsername()}
                    minLength={3}
                    maxLength={24}
                    required
                  />
                  {usernameState === "available" && <CheckIcon />}
                </div>
                <small
                  className={
                    usernameState === "available"
                      ? "field-success"
                      : usernameState === "checking"
                        ? ""
                        : "field-error"
                  }
                >
                  {usernameState === "available" && "사용할 수 있는 사용자명이에요"}
                  {usernameState === "checking" && "사용 가능 여부를 확인하고 있어요…"}
                  {usernameState === "invalid" &&
                    "영문 소문자, 숫자, 하이픈으로 3~24자를 입력해 주세요"}
                  {usernameState === "taken" && "이미 사용 중인 사용자명이에요"}
                </small>
              </label>

              <label className="field-group">
                <span>한 줄 소개</span>
                <textarea
                  name="bio"
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  maxLength={120}
                  rows={3}
                  placeholder="어떤 아이디어를 만들고 있는지 한 줄로 적어주세요"
                />
                <small>어떤 아이디어를 만들고 있는지 편하게 적어주세요</small>
              </label>

              {formError && (
                <p className="onboarding-form-error" role="alert">
                  {formError}
                </p>
              )}
              <button
                className="button button-primary form-submit"
                type="submit"
                disabled={pending}
              >
                {pending ? "프로필 저장 중…" : "첫 앱 추가하기"}
                <ArrowRightIcon />
              </button>
            </form>
          )}

          {step === "app" && (
            <form className="onboarding-form app-onboarding-form" onSubmit={finishApp}>
              <button
                className="back-button"
                type="button"
                onClick={() => setStep("profile")}
              >
                <ChevronLeftIcon />
                프로필로 돌아가기
              </button>
              <div className="form-heading">
                <span>나의 첫 앱</span>
                <h2>무엇을 만드셨나요?</h2>
                <p>앱 주소를 넣으면 기본 정보를 자동으로 확인해요.</p>
              </div>

              <label className="field-group">
                <span>앱 주소</span>
                <div className="inspect-input">
                  <LinkIcon />
                <input
                  type="url"
                    value={appUrl}
                    onChange={(event) => setAppUrl(event.target.value)}
                    placeholder="https://my-first-app.com"
                    required={status === "live"}
                  />
                  <button type="button" onClick={inspectApp} disabled={pending}>
                    정보 가져오기
                  </button>
                </div>
              </label>

              <div className="inspected-app">
                <label
                  className={`inspected-cover${
                    appCoverPreview ? " has-image" : ""
                  }`}
                  style={
                    appCoverPreview
                      ? {
                          backgroundImage: `url("${appCoverPreview.replace(
                            /["\\]/g,
                            "",
                          )}")`,
                          backgroundPosition: "center",
                          backgroundSize: "cover",
                        }
                      : undefined
                  }
                >
                  {!appCoverPreview && "👽"}
                  <i>바꾸기</i>
                  <input
                    className="visually-hidden"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) =>
                      chooseAppCover(event.target.files?.[0])
                    }
                  />
                </label>
                <div>
                  <span>
                    <CheckIcon /> {inspectMessage}
                  </span>
                  <input
                    className="inspected-name-input"
                    value={appName}
                    onChange={(event) => setAppName(event.target.value)}
                    maxLength={50}
                    aria-label="앱 이름"
                  />
                  <input
                    className="inspected-description-input"
                    value={appDescription}
                    onChange={(event) => setAppDescription(event.target.value)}
                    maxLength={140}
                    aria-label="앱 설명"
                  />
                </div>
                <span className="inspected-edit-label">직접 수정</span>
              </div>

              <fieldset className="choice-group">
                <legend>어떤 도구로 만들었나요?</legend>
                <div className="tool-choice-grid">
                  {tools.map(([value, icon, label]) => (
                    <button
                      key={value}
                      className={tool === value ? "is-selected" : ""}
                      type="button"
                      onClick={() => setTool(value)}
                    >
                      <i>{icon}</i>
                      {label}
                      {tool === value && <CheckIcon />}
                    </button>
                  ))}
                </div>
              </fieldset>

              {tool === "other" && (
                <label className="field-group">
                  <span>도구 이름</span>
                  <input
                    value={customToolName}
                    onChange={(event) => setCustomToolName(event.target.value)}
                    maxLength={30}
                    placeholder="사용한 도구를 입력해 주세요"
                    required
                  />
                </label>
              )}

              <fieldset className="choice-group">
                <legend>지금 어떤 상태인가요?</legend>
                <div className="status-choice-grid">
                  {[
                    ["live", "●", "지금 사용할 수 있어요"],
                    ["building", "◐", "아직 만들고 있어요"],
                    ["paused", "○", "잠시 쉬고 있어요"],
                  ].map(([value, icon, label]) => (
                    <button
                      key={value}
                      className={status === value ? "is-selected" : ""}
                      type="button"
                      onClick={() => setStatus(value)}
                    >
                      <i>{icon}</i>
                      {label}
                      {status === value && <CheckIcon />}
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="publish-choice">
                <span>
                  <strong>내 페이지에 바로 공개</strong>
                  <small>끄면 내 홈에서 나중에 공개할 수 있어요.</small>
                </span>
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(event) => setIsPublished(event.target.checked)}
                />
                <i aria-hidden="true" />
              </label>

              {formError && (
                <p className="onboarding-form-error" role="alert">
                  {formError}
                </p>
              )}
              <button
                className="button button-primary form-submit"
                type="submit"
                disabled={pending}
              >
                {pending ? "저장하는 중…" : "내 페이지에 추가하기"}
                <SparkleIcon />
              </button>
            </form>
          )}

          {step === "done" && (
            <div className="onboarding-complete">
              <div className="complete-mark">
                <BrandMark />
                <span className="complete-check">
                  <CheckIcon />
                </span>
                <i className="complete-spark-one">✦</i>
                <i className="complete-spark-two">✦</i>
              </div>
              <span className="complete-kicker">첫 앱 등록 완료</span>
              <h2>첫 앱이 등록됐어요!</h2>
              <p>
                이제 당신이 만든 것을 다른 사람에게 보여줄 수 있어요.
                <br />
                링크 하나로 시작해볼까요?
              </p>
              <div className="complete-url">
                <span>
                  <LinkIcon />
                  baby-vibe.web.app/{username || "etime"}
                </span>
                <button type="button" onClick={() => void copyProfileLink()}>
                  {copied ? "복사했어요" : "링크 복사"}
                  <CheckIcon />
                </button>
              </div>
              <div className="complete-actions">
                <Link className="button button-primary" href={`/${username}`}>
                  내 페이지 보기
                  <ArrowUpRightIcon />
                </Link>
                <Link className="button button-quiet" href="/home">
                  제작자 홈으로
                  <ArrowRightIcon />
                </Link>
              </div>
              <div className="complete-google-note">
                <GoogleIcon />
                {profileSaved
                  ? "Google 계정으로 안전하게 저장되었어요"
                  : "Firebase를 연결하면 Google 계정에 안전하게 저장돼요"}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
