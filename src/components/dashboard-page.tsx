"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { AppCover } from "@/components/app-cover";
import { BrandLogo } from "@/components/brand-logo";
import { ShareProfileSheet } from "@/components/share-profile-sheet";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  CheckIcon,
  CopyIcon,
  EyeIcon,
  GripIcon,
  HomeIcon,
  MoreIcon,
  PlusIcon,
  ShareIcon,
  SignOutIcon,
  SparkleIcon,
  UsersIcon,
} from "@/components/icons";
import {
  getFirebaseClientServices,
  isFirebaseClientConfigured,
} from "@/lib/firebase/client";
import { demoApps, statusLabel } from "@/lib/mock-data";
import { uploadAppCover } from "@/lib/firebase/upload-image";
import { useSheetDrag } from "@/lib/ui/use-sheet-drag";
import { TOOL_LABELS } from "@/lib/utils/tool-labels";
import type { VibeTool } from "@/types/app";

export default function DashboardPage() {
  const demoMode = !isFirebaseClientConfigured;
  const [sheetOpen, setSheetOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareProfileUrl, setShareProfileUrl] = useState("");
  const [shareSession, setShareSession] = useState(0);
  const [sheetStep, setSheetStep] = useState<"url" | "details">("url");
  const [sheetUrl, setSheetUrl] = useState("");
  const [sheetName, setSheetName] = useState("");
  const [sheetDescription, setSheetDescription] = useState("");
  const [sheetImageURL, setSheetImageURL] = useState<string | null>(null);
  const [sheetFaviconURL, setSheetFaviconURL] = useState<string | null>(null);
  const [sheetCoverFile, setSheetCoverFile] = useState<File | null>(null);
  const [sheetCoverPreview, setSheetCoverPreview] = useState<string | null>(null);
  const [sheetTool, setSheetTool] = useState("claude-code");
  const [sheetCustomToolName, setSheetCustomToolName] = useState("");
  const [sheetStatus, setSheetStatus] = useState<"live" | "building" | "paused">(
    "live",
  );
  const [sheetPublished, setSheetPublished] = useState(true);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [sheetPending, setSheetPending] = useState(false);
  const [sheetError, setSheetError] = useState("");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [apps, setApps] = useState(demoMode ? demoApps : []);
  const [profile, setProfile] = useState({
    username: demoMode ? "etime" : "",
    displayName: demoMode ? "E-time" : "",
    photoURL: null as string | null,
  });
  const [usingSavedApps, setUsingSavedApps] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();
  const appsRef = useRef(apps);
  const { sheetRef: addSheetRef, dragHandleProps: addSheetDragHandleProps } =
    useSheetDrag<HTMLElement>({
      open: sheetOpen,
      onDismiss: closeSheet,
    });

  useEffect(() => {
    appsRef.current = apps;
  }, [apps]);

  useEffect(() => {
    let cancelled = false;

    async function loadApps() {
      const [response, profileResponse] = await Promise.all([
        fetch("/api/apps", { cache: "no-store" }).catch(() => null),
        fetch("/api/profile", { cache: "no-store" }).catch(() => null),
      ]);
      if (profileResponse?.ok && !cancelled) {
        const profileResult = (await profileResponse.json()) as {
          data?: { username?: string; displayName?: string; photoURL?: string | null };
        };
        if (profileResult.data?.username && profileResult.data.displayName) {
          setProfile({
            username: profileResult.data.username,
            displayName: profileResult.data.displayName,
            photoURL: profileResult.data.photoURL ?? null,
          });
        }
      }
      if (!response?.ok || cancelled) return;
      const result = (await response.json()) as {
        data?: Array<{
          id: string;
          name: string;
          description: string;
          tool: string;
          customToolName: string | null;
          status: "live" | "building" | "paused";
          imageURL: string | null;
          faviconURL: string | null;
          url: string | null;
          isPublished: boolean;
          isFirstApp: boolean;
          stats?: { outboundClicks?: number; cheers?: number };
        }>;
      };
      if (!result.data || cancelled) return;

      const covers = ["alien", "coin", "quiet"] as const;
      const tones = ["blue", "pink", "orange"] as const;
      setApps(
        result.data.map((app, index) => ({
          id: app.id,
          name: app.name,
          description: app.description,
          tool:
            app.customToolName ||
            TOOL_LABELS[app.tool as VibeTool] ||
            app.tool,
          toolTone: tones[index % tones.length],
          status: app.status,
          cover: covers[index % covers.length],
          clicks: Number(app.stats?.outboundClicks ?? 0),
          cheers: Number(app.stats?.cheers ?? 0),
          isFirst: app.isFirstApp,
          imageURL: app.imageURL,
          faviconURL: app.faviconURL,
          url: app.url,
          isPublished: app.isPublished,
        })),
      );
      setUsingSavedApps(true);
    }

    void loadApps();
    return () => {
      cancelled = true;
    };
  }, []);

  const totals = useMemo(
    () => ({
      clicks: apps.reduce((sum, app) => sum + app.clicks, 0),
      cheers: apps.reduce((sum, app) => sum + app.cheers, 0),
    }),
    [apps],
  );

  function showToast(message: string) {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(""), 2200);
  }

  function openAddSheet() {
    setEditingAppId(null);
    setSheetStep("url");
    setSheetUrl("");
    setSheetName("");
    setSheetDescription("");
    setSheetImageURL(null);
    setSheetFaviconURL(null);
    setSheetCoverFile(null);
    setSheetCoverPreview(null);
    setSheetTool("claude-code");
    setSheetCustomToolName("");
    setSheetStatus("live");
    setSheetPublished(true);
    setSheetError("");
    setSheetOpen(true);
  }

  function openEditSheet(app: (typeof apps)[number]) {
    setEditingAppId(app.id);
    setSheetStep("details");
    setSheetUrl(app.url ?? "");
    setSheetName(app.name);
    setSheetDescription(app.description);
    setSheetImageURL(app.imageURL ?? null);
    setSheetFaviconURL(app.faviconURL ?? null);
    setSheetCoverFile(null);
    setSheetCoverPreview(app.imageURL ?? null);
    const toolValue = Object.entries(TOOL_LABELS).find(
      ([, label]) => label === app.tool,
    )?.[0];
    setSheetTool(toolValue ?? "other");
    setSheetCustomToolName(toolValue ? "" : app.tool);
    setSheetStatus(app.status);
    setSheetPublished(app.isPublished !== false);
    setSheetError("");
    setActiveMenu(null);
    setSheetOpen(true);
  }

  function closeSheet() {
    if (sheetPending) return;
    setSheetOpen(false);
    setSheetError("");
  }

  async function inspectSheetUrl() {
    if (!sheetUrl.trim()) {
      setSheetError("앱 주소를 입력해 주세요.");
      return;
    }
    setSheetPending(true);
    setSheetError("");
    if (sheetCoverPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(sheetCoverPreview);
    }
    setSheetImageURL(null);
    setSheetFaviconURL(null);
    setSheetCoverFile(null);
    setSheetCoverPreview(null);

    try {
      const response = await fetch("/api/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: sheetUrl }),
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
      if (result.data?.title) setSheetName(result.data.title.slice(0, 50));
      if (result.data?.description) {
        setSheetDescription(result.data.description.slice(0, 140));
      }
      const inspectedImageURL = result.data?.image ?? null;
      setSheetImageURL(inspectedImageURL);
      setSheetCoverPreview(inspectedImageURL);
      setSheetFaviconURL(result.data?.favicon ?? null);
      if (!response.ok) {
        setSheetError(
          result.error?.message ||
            "자동으로 정보를 찾지 못했어요. 직접 입력해도 괜찮아요.",
        );
      }
      setSheetStep("details");
    } catch {
      try {
        setSheetName(new URL(sheetUrl).hostname.replace(/^www\./, ""));
      } catch {
        setSheetName("새로운 앱");
      }
      setSheetStep("details");
      setSheetError("자동으로 정보를 찾지 못했어요. 직접 입력해 주세요.");
    } finally {
      setSheetPending(false);
    }
  }

  function chooseSheetCover(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setSheetError("이미지 파일을 선택해 주세요.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSheetError("이미지는 5MB 이하로 선택해 주세요.");
      return;
    }
    if (sheetCoverPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(sheetCoverPreview);
    }
    setSheetCoverFile(file);
    setSheetCoverPreview(URL.createObjectURL(file));
    setSheetError("");
  }

  async function saveSheetApp() {
    if (!sheetName.trim()) {
      setSheetError("앱 이름을 입력해 주세요.");
      return;
    }
    if (sheetStatus === "live" && !sheetUrl.trim()) {
      setSheetError("지금 사용할 수 있는 앱에는 주소가 필요해요.");
      return;
    }
    if (sheetTool === "other" && !sheetCustomToolName.trim()) {
      setSheetError("사용한 도구 이름을 입력해 주세요.");
      return;
    }

    setSheetPending(true);
    setSheetError("");
    const payload: Record<string, unknown> = {
      name: sheetName,
      description: sheetDescription,
      url: sheetUrl || null,
      imageURL: sheetImageURL,
      faviconURL: sheetFaviconURL,
      tool: sheetTool,
      customToolName:
        sheetTool === "other" ? sheetCustomToolName.trim() : null,
      status: sheetStatus,
      isPublished: sheetPublished,
    };

    try {
      const response = await fetch(
        editingAppId ? `/api/apps/${editingAppId}` : "/api/apps",
        {
          method: editingAppId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = (await response.json()) as {
        data?: { id?: string };
        error?: { message?: string };
      };

      if (!response.ok && ![401, 503].includes(response.status)) {
        throw new Error(result.error?.message || "앱을 저장하지 못했어요.");
      }

      const savedId = editingAppId || result.data?.id || null;
      let savedImageURL = sheetImageURL;
      let imageUploadFailed = false;
      let imageErrorText = "";
      if (sheetCoverFile && savedId) {
        try {
          savedImageURL = await uploadAppCover(sheetCoverFile, savedId);
          const imageRes = await fetch(`/api/apps/${savedId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageURL: savedImageURL }),
          });
          if (!imageRes.ok && ![401, 503].includes(imageRes.status)) {
            throw new Error("이미지 주소를 저장하지 못했어요.");
          }
        } catch (caught) {
          imageUploadFailed = true;
          imageErrorText =
            caught instanceof Error ? caught.message : String(caught);
          console.error("앱 커버 업로드 실패:", caught);
        }
      }

      if (editingAppId) {
        setApps((current) =>
          current.map((app) =>
            app.id === editingAppId
              ? {
                  ...app,
                  name: sheetName,
                  description: sheetDescription,
                  url: sheetUrl || null,
                  tool:
                    sheetTool === "other"
                      ? sheetCustomToolName.trim()
                      : TOOL_LABELS[sheetTool as VibeTool] ?? sheetTool,
                  status: sheetStatus,
                  imageURL: savedImageURL,
                  faviconURL: sheetFaviconURL,
                  isPublished: sheetPublished,
                }
              : app,
          ),
        );
      } else {
        const index = apps.length;
        const covers = ["alien", "coin", "quiet"] as const;
        const tones = ["blue", "pink", "orange"] as const;
        setApps((current) => [
          ...current,
          {
            id: result.data?.id || `demo-${Date.now()}`,
            name: sheetName,
            description: sheetDescription,
            url: sheetUrl || null,
            tool:
              sheetTool === "other"
                ? sheetCustomToolName.trim()
                : TOOL_LABELS[sheetTool as VibeTool] ?? sheetTool,
            status: sheetStatus,
            toolTone: tones[index % tones.length],
            cover: covers[index % covers.length],
            clicks: 0,
            cheers: 0,
            imageURL:
              savedImageURL ||
              sheetCoverPreview,
            faviconURL: sheetFaviconURL,
            isPublished: sheetPublished,
          },
        ]);
      }
      if (imageUploadFailed) {
        setSheetError(
          `이미지를 올리지 못했어요: ${imageErrorText || "알 수 없는 오류"}`,
        );
        showToast("앱 정보는 저장했지만 이미지는 올리지 못했어요");
      } else {
        setSheetOpen(false);
        showToast(editingAppId ? "앱 정보를 수정했어요" : "새 앱을 추가했어요");
      }
    } catch (caught) {
      setSheetError(
        caught instanceof Error ? caught.message : "앱을 저장하지 못했어요.",
      );
    } finally {
      setSheetPending(false);
    }
  }

  async function togglePublished(appId: string) {
    const target = apps.find((app) => app.id === appId);
    if (!target) return;
    const nextPublished = target.isPublished === false;
    setApps((current) =>
      current.map((app) =>
        app.id === appId ? { ...app, isPublished: nextPublished } : app,
      ),
    );
    setActiveMenu(null);
    if (usingSavedApps) {
      await fetch(`/api/apps/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: nextPublished }),
      }).catch(() => null);
    }
    showToast(nextPublished ? "앱을 다시 공개했어요" : "페이지에서 앱을 숨겼어요");
  }

  async function removeApp(appId: string, name: string) {
    if (!window.confirm(`“${name}” 앱을 삭제할까요? 이 작업은 되돌릴 수 없어요.`)) {
      return;
    }
    setApps((current) => current.filter((app) => app.id !== appId));
    setActiveMenu(null);
    if (usingSavedApps) {
      await fetch(`/api/apps/${appId}`, { method: "DELETE" }).catch(() => null);
    }
    showToast("앱을 삭제했어요");
  }

  async function copyCrossPromotionPrompt() {
    const prompt = `이 앱의 하단 또는 About 영역에 다음 버튼을 추가해줘.\n\n버튼 문구:\n"제가 만든 다른 앱 보기"\n\n연결 주소:\n${window.location.origin}/${profile.username}\n\n현재 앱의 디자인과 자연스럽게 어울리게 만들고,\n모바일에서도 잘 보이게 해줘.\n새 창에서 열리도록 설정해줘.`;
    await navigator.clipboard?.writeText(prompt);
    showToast("AI 도구용 프롬프트를 복사했어요");
  }

  function moveApp(index: number, offset: number) {
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= apps.length) return;

    setApps((current) => {
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      persistAppOrder(next);
      return next;
    });
  }

  function persistAppOrder(orderedApps: typeof apps) {
    if (!usingSavedApps) return;
    void fetch("/api/apps/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appIds: orderedApps.map((app) => app.id) }),
    });
  }

  function startDragging(
    event: React.DragEvent<HTMLElement>,
    appId: string,
  ) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", appId);
    setDraggedAppId(appId);
  }

  function dragOverApp(
    event: React.DragEvent<HTMLElement>,
    targetAppId: string,
  ) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (!draggedAppId || draggedAppId === targetAppId) return;

    setApps((current) => {
      const from = current.findIndex((app) => app.id === draggedAppId);
      const to = current.findIndex((app) => app.id === targetAppId);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      appsRef.current = next;
      return next;
    });
  }

  function finishDragging() {
    if (!draggedAppId) return;
    persistAppOrder(appsRef.current);
    setDraggedAppId(null);
    showToast("앱 순서를 바꿨어요");
  }

  function openCrossPromotion() {
    setShareOpen(false);
    window.requestAnimationFrame(() => {
      document
        .getElementById("cross-promotion")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function openShareSheet() {
    setShareProfileUrl(`${window.location.origin}/${profile.username}`);
    setShareSession((current) => current + 1);
    setShareOpen(true);
  }

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    setProfileMenuOpen(false);
    try {
      const services = getFirebaseClientServices();
      if (services) await signOut(services.auth).catch(() => undefined);
      await fetch("/api/auth/session", { method: "DELETE" }).catch(() => null);
    } finally {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-rail">
        <BrandLogo />
        <nav aria-label="제작자 메뉴">
          <Link className="is-current" href="/home">
            <HomeIcon />
            내 홈
          </Link>
          <Link href="/people">
            <UsersIcon />
            둘러보기
          </Link>
          <Link href={`/${profile.username}`}>
            <EyeIcon />
            내 페이지 보기
          </Link>
          <Link href="/settings">
            <SparkleIcon />
            프로필 설정
          </Link>
        </nav>
        <div className="dashboard-profile-wrap">
          <button
            type="button"
            className="dashboard-profile"
            aria-haspopup="menu"
            aria-expanded={profileMenuOpen}
            onClick={() => setProfileMenuOpen((open) => !open)}
          >
            <span
              className="dashboard-avatar"
              style={
                profile.photoURL
                  ? {
                      backgroundImage: `url("${profile.photoURL.replace(/["\\]/g, "")}")`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      color: "transparent",
                    }
                  : undefined
              }
            >
              {!profile.photoURL && profile.displayName.charAt(0).toUpperCase()}
            </span>
            <span>
              <strong>{profile.displayName}</strong>
              <small>@{profile.username}</small>
            </span>
            <MoreIcon />
          </button>
          {profileMenuOpen && (
            <>
              <button
                className="profile-menu-backdrop"
                aria-hidden="true"
                tabIndex={-1}
                onClick={() => setProfileMenuOpen(false)}
              />
              <div className="profile-menu" role="menu">
                <Link
                  href="/settings"
                  role="menuitem"
                  onClick={() => setProfileMenuOpen(false)}
                >
                  <SparkleIcon />
                  프로필 설정
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  className="is-destructive"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  <SignOutIcon />
                  {loggingOut ? "로그아웃 중…" : "로그아웃"}
                </button>
              </div>
            </>
          )}
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-mobile-header">
          <BrandLogo compact />
          <div className="dashboard-mobile-profile">
            <button
              type="button"
              className="dashboard-avatar"
              style={
                profile.photoURL
                  ? {
                      backgroundImage: `url("${profile.photoURL.replace(/["\\]/g, "")}")`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      color: "transparent",
                    }
                  : undefined
              }
              aria-label="프로필 메뉴"
              aria-haspopup="menu"
              aria-expanded={profileMenuOpen}
              onClick={() => setProfileMenuOpen((open) => !open)}
            >
              {!profile.photoURL && profile.displayName.charAt(0).toUpperCase()}
            </button>
            {profileMenuOpen && (
              <>
                <button
                  className="profile-menu-backdrop"
                  aria-hidden="true"
                  tabIndex={-1}
                  onClick={() => setProfileMenuOpen(false)}
                />
                <div className="profile-menu" role="menu">
                  <Link
                    href="/settings"
                    role="menuitem"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <SparkleIcon />
                    프로필 설정
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    className="is-destructive"
                    onClick={handleLogout}
                    disabled={loggingOut}
                  >
                    <SignOutIcon />
                    {loggingOut ? "로그아웃 중…" : "로그아웃"}
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <div className="dashboard-content">
          <section className="dashboard-welcome">
            <div>
              <span className="dashboard-date">MY WORKSPACE</span>
              <h1>{profile.displayName}님의 앱</h1>
              <p>
                <strong>{apps.length}개의 앱</strong>을 한곳에서 관리하고 있어요.
              </p>
            </div>
            <div className="dashboard-header-actions">
              <button
                className="button button-primary"
                type="button"
                onClick={openAddSheet}
              >
                <PlusIcon />
                앱 추가
              </button>
              <Link className="button button-quiet" href={`/${profile.username}`}>
                <EyeIcon />
                내 페이지 보기
              </Link>
              <button
                className="button button-quiet"
                type="button"
                onClick={openShareSheet}
              >
                <CopyIcon />
                링크 복사
              </button>
            </div>
          </section>

          <div className="dashboard-overview">
            <section className="dashboard-milestone">
              <span className="milestone-emoji">{apps.length >= 3 ? "✦" : "↗"}</span>
              <div>
                <span>{apps.length ? "COLLECTION" : "GET STARTED"}</span>
                <strong>
                  {apps.length >= 3
                    ? `앱 ${apps.length}개를 모았어요`
                    : apps.length
                      ? "첫 앱을 등록했어요"
                      : "첫 앱을 추가해 보세요"}
                </strong>
                <p>
                  {apps.length >= 3
                    ? "아이디어가 멋진 컬렉션으로 자라고 있어요."
                    : apps.length
                      ? "이제 다른 사람에게 보여줄 준비가 됐어요."
                      : "링크 하나면 나만의 앱 페이지가 완성돼요."}
                </p>
              </div>
              <span className="milestone-progress">
                <i
                  style={{
                    "--milestone-progress": `${Math.min(apps.length, 3) / 3 * 100}%`,
                  } as React.CSSProperties}
                />
                {Math.min(apps.length, 3)} / 3
              </span>
            </section>

            <div className="dashboard-overview-details">
              <section className="stats-grid" aria-label="내 앱 요약">
                <article>
                  <span className="stats-icon stats-icon-blue">
                    <SparkleIcon />
                  </span>
                  <span>
                    <small>등록한 앱</small>
                    <strong>{apps.length}<i>개</i></strong>
                  </span>
                </article>
                <article>
                  <span className="stats-icon stats-icon-mint">
                    <EyeIcon />
                  </span>
                  <span>
                    <small>앱 열기</small>
                    <strong>{totals.clicks}<i>회</i></strong>
                  </span>
                  {!usingSavedApps && <em>+24</em>}
                </article>
                <article>
                  <span className="stats-icon stats-icon-orange">👏</span>
                  <span>
                    <small>받은 응원</small>
                    <strong>{totals.cheers}<i>개</i></strong>
                  </span>
                  {!usingSavedApps && <em>+8</em>}
                </article>
              </section>

              <section className="dashboard-achievements" aria-label="나의 작은 성취">
                {[
                  ["🎉", "첫 앱", apps.length >= 1],
                  ["👀", "첫 열기", totals.clicks >= 1],
                  ["👏", "첫 응원", totals.cheers >= 1],
                  ["✨", "앱 3개", apps.length >= 3],
                ].map(([emoji, label, completed]) => (
                  <article
                    className={completed ? "is-completed" : ""}
                    key={String(label)}
                  >
                    <span>{String(emoji)}</span>
                    <strong>{String(label)}</strong>
                    {completed ? <CheckIcon /> : <i>·</i>}
                  </article>
                ))}
              </section>
            </div>
          </div>

          <section className="dashboard-apps-section">
            <div className="dashboard-section-heading">
              <div>
                <h2>내가 만든 앱</h2>
                <p>끌어서 공개 페이지에 보일 순서를 바꿀 수 있어요.</p>
              </div>
              <button className="button button-quiet" type="button" onClick={openAddSheet}>
                <PlusIcon />
                새 앱 추가
              </button>
            </div>

            <div className="dashboard-app-list">
              {apps.length === 0 && (
                <div className="dashboard-empty-apps">
                  <span>
                    <SparkleIcon />
                  </span>
                  <h3>아직 등록한 앱이 없어요.</h3>
                  <p>
                    처음 만든 앱 주소를 붙여넣어 보세요.
                    <br />
                    나만의 앱 페이지가 바로 완성됩니다.
                  </p>
                  <button
                    className="button button-primary"
                    type="button"
                    onClick={openAddSheet}
                  >
                    <PlusIcon />
                    첫 앱 추가하기
                  </button>
                </div>
              )}
              {apps.map((app, index) => (
                <article
                  className={`dashboard-app-row${
                    draggedAppId === app.id ? " is-dragging" : ""
                  }`}
                  key={app.id}
                  onDragOver={(event) => dragOverApp(event, app.id)}
                  onDrop={(event) => event.preventDefault()}
                >
                  <span
                    className="drag-handle"
                    draggable
                    onDragStart={(event) => startDragging(event, app.id)}
                    onDragEnd={finishDragging}
                    title={`${app.name} 끌어서 순서 변경`}
                    aria-label={`${app.name} 끌어서 순서 변경`}
                  >
                    <GripIcon />
                  </span>
                  <AppCover kind={app.cover} compact imageURL={app.imageURL} />
                  <div className="dashboard-app-info">
                    <div>
                      <h3>{app.name}</h3>
                      {app.isFirst && <span className="first-app-badge">나의 첫 앱</span>}
                    </div>
                    <p>
                      <span className={`tool-badge tool-badge-${app.toolTone}`}>
                        {app.tool}
                      </span>
                      <span className={`status-pill status-${app.status}`}>
                        <i />
                        {statusLabel[app.status]}
                      </span>
                    </p>
                  </div>
                  <div className="dashboard-app-reactions">
                    <span>
                      <EyeIcon /> {app.clicks}
                    </span>
                    <span>👏 {app.cheers}</span>
                  </div>
                  <span
                    className={`published-pill${app.isPublished === false ? " is-hidden" : ""}`}
                  >
                    <i /> {app.isPublished === false ? "숨김" : "공개 중"}
                  </span>
                  <button
                    className="row-edit-button"
                    type="button"
                    onClick={() => openEditSheet(app)}
                  >
                    수정
                  </button>
                  <div className="row-order-controls">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveApp(index, -1)}
                      aria-label={`${app.name} 위로 이동`}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={index === apps.length - 1}
                      onClick={() => moveApp(index, 1)}
                      aria-label={`${app.name} 아래로 이동`}
                    >
                      ↓
                    </button>
                  </div>
                  <button
                    className="row-more-button"
                    type="button"
                    aria-label={`${app.name} 메뉴`}
                    aria-expanded={activeMenu === app.id}
                    onClick={() =>
                      setActiveMenu((current) => (current === app.id ? null : app.id))
                    }
                  >
                    <MoreIcon />
                  </button>
                  {activeMenu === app.id && (
                    <div className="row-app-menu">
                      <button type="button" onClick={() => openEditSheet(app)}>
                        수정하기
                      </button>
                      <button
                        className="mobile-order-action"
                        type="button"
                        disabled={index === 0}
                        onClick={() => {
                          moveApp(index, -1);
                          setActiveMenu(null);
                        }}
                      >
                        위로 이동
                      </button>
                      <button
                        className="mobile-order-action"
                        type="button"
                        disabled={index === apps.length - 1}
                        onClick={() => {
                          moveApp(index, 1);
                          setActiveMenu(null);
                        }}
                      >
                        아래로 이동
                      </button>
                      <button type="button" onClick={() => togglePublished(app.id)}>
                        {app.isPublished === false
                          ? "페이지에 다시 공개"
                          : "페이지에서 숨기기"}
                      </button>
                      <button
                        className="is-destructive"
                        type="button"
                        onClick={() => removeApp(app.id, app.name)}
                      >
                        삭제하기
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>

          <section className="cross-promo-card" id="cross-promotion">
            <span className="cross-promo-icon">
              <ArrowUpRightIcon />
            </span>
            <div>
              <strong>내 앱에서 다른 앱들도 소개해보세요</strong>
              <p>AI 코딩 도구에 붙여넣을 버튼 추가 프롬프트를 만들어드려요.</p>
            </div>
            <button
              className="button button-quiet"
              type="button"
              onClick={copyCrossPromotionPrompt}
            >
              프롬프트 복사
              <ArrowRightIcon />
            </button>
          </section>
        </div>
      </main>

      <MobileBottomNav active="home" username={profile.username} />

      <div
        className={`sheet-scrim${sheetOpen ? " is-visible" : ""}`}
        onClick={closeSheet}
      />
      <section
        ref={addSheetRef}
        className={`add-app-sheet${sheetOpen ? " is-visible" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!sheetOpen}
        aria-labelledby="add-app-sheet-title"
      >
        <div className="sheet-handle" aria-hidden="true" {...addSheetDragHandleProps} />
        <div className="sheet-heading">
          <div>
            <span>{editingAppId ? "앱 수정" : "새로운 앱"}</span>
            <h2 id="add-app-sheet-title">
              {sheetStep === "url"
                ? "만든 앱 주소를 붙여넣어 주세요."
                : editingAppId
                  ? "앱 정보를 수정해 주세요."
                  : "가져온 정보를 확인해 주세요."}
            </h2>
            <p>
              {sheetStep === "url"
                ? "앱 이름과 이미지는 자동으로 찾아드릴게요."
                : "모든 정보는 직접 바꿀 수 있어요."}
            </p>
          </div>
          <button type="button" onClick={closeSheet} aria-label="닫기">
            ×
          </button>
        </div>
        {sheetStep === "url" ? (
          <>
            <label className="sheet-url-input">
              <ShareIcon />
              <input
                type="url"
                placeholder="https://my-new-app.com"
                value={sheetUrl}
                onChange={(event) => setSheetUrl(event.target.value)}
              />
            </label>
            {sheetError && <p className="sheet-error">{sheetError}</p>}
            <button
              className="button button-primary sheet-submit"
              type="button"
              onClick={inspectSheetUrl}
              disabled={sheetPending}
            >
              {sheetPending ? "앱 정보 확인 중…" : "앱 정보 가져오기"}
              <ArrowRightIcon />
            </button>
            <p className="sheet-help">
              정보를 찾지 못해도 직접 입력해서 계속 등록할 수 있어요.
            </p>
            <button
              className="sheet-skip-url"
              type="button"
              onClick={() => {
                setSheetStatus("building");
                setSheetStep("details");
                setSheetError("");
              }}
            >
              아직 주소가 없어요 · 만드는 중인 앱으로 등록
            </button>
          </>
        ) : (
          <div className="sheet-details">
            <div className="sheet-cover-picker">
              <label className="sheet-cover-preview sheet-cover-drop">
                {sheetCoverPreview ? (
                  <img
                    src={sheetCoverPreview}
                    alt=""
                    onError={() => {
                      setSheetImageURL(null);
                      setSheetCoverFile(null);
                      setSheetCoverPreview(null);
                    }}
                  />
                ) : (
                  <span>이미지 없음</span>
                )}
                <input
                  className="visually-hidden"
                  type="file"
                  accept="image/*"
                  onChange={(event) => chooseSheetCover(event.target.files?.[0])}
                />
              </label>
              <div>
                <strong>대표 이미지</strong>
                <p aria-live="polite">
                  {sheetCoverFile
                    ? "새 이미지가 선택됐어요. 저장하면 반영됩니다."
                    : sheetCoverPreview
                      ? "자동으로 찾은 이미지를 바꾸거나 새 이미지를 올릴 수 있어요."
                      : "썸네일을 가져오지 못했어요. 이미지 선택에서 직접 등록해 주세요."}
                </p>
                <label className="sheet-cover-button">
                  {sheetCoverFile ? "다른 이미지 선택" : "이미지 선택"}
                  <input
                    className="visually-hidden"
                    type="file"
                    accept="image/*"
                    onChange={(event) => chooseSheetCover(event.target.files?.[0])}
                  />
                </label>
              </div>
            </div>
            <label className="field-group">
              <span>앱 주소</span>
              <input
                type="url"
                value={sheetUrl}
                onChange={(event) => setSheetUrl(event.target.value)}
                placeholder="https://my-new-app.com"
              />
            </label>
            <label className="field-group">
              <span>앱 이름</span>
              <input
                value={sheetName}
                onChange={(event) => setSheetName(event.target.value)}
                maxLength={50}
              />
            </label>
            <label className="field-group">
              <span>한 줄 설명</span>
              <textarea
                value={sheetDescription}
                onChange={(event) => setSheetDescription(event.target.value)}
                maxLength={140}
                rows={3}
              />
            </label>
            <div className="sheet-detail-grid">
              <label className="field-group">
                <span>만든 도구</span>
                <select
                  value={sheetTool}
                  onChange={(event) => setSheetTool(event.target.value)}
                >
                  <option value="codex">Codex</option>
                  <option value="claude-code">Claude Code</option>
                  <option value="lovable">Lovable</option>
                  <option value="bolt">Bolt</option>
                  <option value="replit">Replit</option>
                  <option value="v0">v0</option>
                  <option value="base44">Base44</option>
                  <option value="cursor">Cursor</option>
                  <option value="firebase-studio">Firebase Studio</option>
                  <option value="other">기타</option>
                </select>
              </label>
              <label className="field-group">
                <span>현재 상태</span>
                <select
                  value={sheetStatus}
                  onChange={(event) =>
                    setSheetStatus(
                      event.target.value as "live" | "building" | "paused",
                    )
                  }
                >
                  <option value="live">지금 사용할 수 있어요</option>
                  <option value="building">아직 만들고 있어요</option>
                  <option value="paused">잠시 쉬고 있어요</option>
                </select>
              </label>
            </div>
            {sheetTool === "other" && (
              <label className="field-group">
                <span>도구 이름</span>
                <input
                  value={sheetCustomToolName}
                  onChange={(event) => setSheetCustomToolName(event.target.value)}
                  maxLength={30}
                  placeholder="사용한 도구를 입력해 주세요"
                />
              </label>
            )}
            <label className="publish-choice">
              <span>
                <strong>내 페이지에 공개</strong>
                <small>끄면 나만 홈에서 볼 수 있어요.</small>
              </span>
              <input
                type="checkbox"
                checked={sheetPublished}
                onChange={(event) => setSheetPublished(event.target.checked)}
              />
              <i aria-hidden="true" />
            </label>
            {sheetError && <p className="sheet-error">{sheetError}</p>}
            <div className="sheet-detail-actions">
              {!editingAppId && (
                <button
                  className="button button-quiet"
                  type="button"
                  onClick={() => setSheetStep("url")}
                  disabled={sheetPending}
                >
                  주소 다시 입력
                </button>
              )}
              <button
                className="button button-primary"
                type="button"
                onClick={saveSheetApp}
                disabled={sheetPending}
              >
                {sheetPending
                  ? "저장하는 중…"
                  : editingAppId
                    ? "수정 내용 저장"
                    : "내 페이지에 추가"}
                <CheckIcon />
              </button>
            </div>
          </div>
        )}
      </section>

      <ShareProfileSheet
        key={shareSession}
        open={shareOpen}
        username={profile.username}
        displayName={profile.displayName}
        profileUrl={shareProfileUrl}
        onClose={() => setShareOpen(false)}
        onNotice={showToast}
        onCrossPromotion={openCrossPromotion}
      />

      <div className={`copy-toast${toastMessage ? " is-visible" : ""}`} role="status">
        <span>
          <CheckIcon />
        </span>
        {toastMessage}
        <CopyIcon />
      </div>
    </div>
  );
}
