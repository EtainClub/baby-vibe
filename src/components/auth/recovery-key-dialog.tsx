"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, CopyIcon, KeyIcon } from "@/components/icons";
import { apiFetch } from "@/lib/api/client";
import { signInWithRecoveryToken } from "@/lib/firebase/auth";
import { IS_TOSS_APP } from "@/lib/platform";
import { copyText } from "@/lib/toss/bridge";

interface Envelope<T> {
  ok?: boolean;
  data?: T;
  error?: { message?: string };
}

/**
 * Issues a recovery key and shows it exactly once.
 *
 * This is the only way an account survives losing the device — inside Toss
 * there is no provider login to fall back on — so the code has to be
 * acknowledged explicitly before the panel will close.
 */
export function RecoveryKeyIssuer({ hasKey = false }: { hasKey?: boolean }) {
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState("");

  async function issue() {
    setPending(true);
    setError("");
    try {
      const response = await apiFetch("/api/auth/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const result = (await response.json()) as Envelope<{ code: string }>;
      if (!response.ok || !result.data?.code) {
        throw new Error(result.error?.message || "복구 키를 만들지 못했어요.");
      }
      setCode(result.data.code);
      setCopied(false);
      setAcknowledged(false);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "복구 키를 만들지 못했어요.",
      );
    } finally {
      setPending(false);
    }
  }

  async function copyCode() {
    // copyText reports failure rather than throwing — the user must not be
    // told the only copy of their recovery key is safely on the clipboard
    // when it isn't.
    if (await copyText(code)) {
      setCopied(true);
      return;
    }
    setError("복사하지 못했어요. 코드를 직접 적어 주세요.");
  }

  if (code) {
    return (
      <div className="recovery-card recovery-card-issued">
        <span className="recovery-kicker">
          <KeyIcon /> 이 코드는 다시 볼 수 없어요
        </span>
        <output className="recovery-code">{code}</output>
        <p className="recovery-hint">
          다른 기기에서 이 계정을 다시 열려면 이 코드가 필요해요. 메모장이나
          비밀번호 관리자에 지금 저장해 주세요.
        </p>
        <div className="recovery-actions">
          <button className="button" type="button" onClick={copyCode}>
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? "복사했어요" : "코드 복사하기"}
          </button>
        </div>
        <label className="recovery-ack">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
          />
          안전한 곳에 저장했어요.
        </label>
        <button
          className="button button-quiet"
          type="button"
          disabled={!acknowledged}
          onClick={() => setCode("")}
        >
          닫기
        </button>
        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="recovery-card">
      <span className="recovery-kicker">
        <KeyIcon /> 복구 키
      </span>
      <p className="recovery-hint">
        {hasKey
          ? "새로 만들면 예전 복구 키는 더 이상 쓸 수 없어요."
          : "기기를 바꾸거나 앱을 지워도 내 앱 페이지를 그대로 되찾을 수 있어요."}
      </p>
      <button
        className="button"
        type="button"
        onClick={issue}
        disabled={pending}
      >
        {pending
          ? "만드는 중이에요…"
          : hasKey
            ? "복구 키 새로 만들기"
            : "복구 키 만들기"}
      </button>
      {error && (
        <p className="login-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Redeems a recovery key, moving this device onto the recovered account. */
export function RecoveryKeyRedeemer({
  onRecovered,
}: {
  onRecovered?: () => void;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function redeem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    try {
      const response = await apiFetch("/api/auth/recovery", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value }),
      });
      const result = (await response.json()) as Envelope<{ token: string }>;
      if (!response.ok || !result.data?.token) {
        throw new Error(result.error?.message || "복구 키를 확인하지 못했어요.");
      }

      const user = await signInWithRecoveryToken(result.data.token);
      if (!user) throw new Error("이 기기에서 로그인하지 못했어요.");

      // The web build authenticates with a cookie, so the recovered identity
      // has to be exchanged for a session. The Toss build sends the ID token
      // on every request and needs nothing further.
      if (!IS_TOSS_APP) {
        await apiFetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: await user.getIdToken(true) }),
        });
      }

      onRecovered?.();
      router.replace("/home");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "복구 키를 확인하지 못했어요.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="recovery-card" onSubmit={redeem}>
      <span className="recovery-kicker">
        <KeyIcon /> 다른 기기의 기록 불러오기
      </span>
      <label className="recovery-field">
        <span className="sr-only">복구 키</span>
        <input
          name="recoveryKey"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="XXXX-XXXX-XXXX-XXXX"
          autoComplete="one-time-code"
          autoCapitalize="characters"
          spellCheck={false}
          inputMode="text"
          maxLength={24}
          required
        />
      </label>
      <button className="button" type="submit" disabled={pending}>
        {pending ? "확인하는 중이에요…" : "불러오기"}
      </button>
      {error && (
        <p className="login-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
