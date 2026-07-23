"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { GoogleIcon } from "@/components/icons";
import {
  getFirebaseClientServices,
  isFirebaseClientConfigured,
} from "@/lib/firebase/client";

interface ApiEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: { message?: string };
}

export function GoogleLoginButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    const services = getFirebaseClientServices();
    if (!services) {
      setError("Firebase 공개 설정을 연결하면 Google 로그인을 사용할 수 있어요.");
      return;
    }

    setPending(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const credential = await signInWithPopup(services.auth, provider);
      const idToken = await credential.user.getIdToken(true);

      const sessionResponse = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const sessionResult = (await sessionResponse.json()) as ApiEnvelope<never>;
      if (!sessionResponse.ok) {
        throw new Error(sessionResult.error?.message || "로그인 세션을 만들지 못했어요.");
      }

      const profileResponse = await fetch("/api/profile", { cache: "no-store" });
      if (profileResponse.status === 404) {
        router.push("/start");
      } else if (profileResponse.ok) {
        const profileResult = (await profileResponse.json()) as ApiEnvelope<{
          onboardingCompleted?: boolean;
        } | null>;
        router.push(
          profileResult.data?.onboardingCompleted ? "/home" : "/start",
        );
      } else {
        router.push("/start");
      }
      router.refresh();
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Google 로그인에 실패했어요.";
      setError(
        message.includes("popup-closed")
          ? "로그인 창이 닫혔어요. 다시 시도해 주세요."
          : message,
      );
      if (services) await signOut(services.auth).catch(() => undefined);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="google-login-control">
      <button
        className="button google-login-button"
        type="button"
        onClick={handleLogin}
        disabled={pending}
      >
        <GoogleIcon />
        {pending ? "Google 계정 확인 중…" : "Google로 계속하기"}
      </button>
      {!isFirebaseClientConfigured && (
        <p className="firebase-setup-note">
          현재는 디자인 데모 모드예요. Firebase 설정 후 실제 로그인이 활성화됩니다.
        </p>
      )}
      {error && (
        <p className="login-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
