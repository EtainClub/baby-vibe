"use client";

import { useCallback, useState } from "react";
import { RefreshIcon } from "@/components/icons";

export type LoadStatus = "loading" | "ready" | "error";

/**
 * Load status tied to a retry counter.
 *
 * Bumping `token` reads as "loading" immediately, without an effect having to
 * set state synchronously on the way in — which would cost an extra render
 * pass on every mount.
 */
export function useLoadStatus(token: number, initial: LoadStatus = "loading") {
  const [result, setResult] = useState({ token, status: initial });
  const setStatus = useCallback(
    (status: LoadStatus) => setResult({ token, status }),
    [token],
  );
  return [
    result.token === token ? result.status : "loading",
    setStatus,
  ] as const;
}

/** Placeholder block for content that hasn't arrived yet. */
export function Skeleton({
  className = "",
  count = 1,
}: {
  className?: string;
  count?: number;
}) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div
          className={`skeleton ${className}`.trim()}
          key={index}
          aria-hidden="true"
        />
      ))}
    </>
  );
}

/**
 * What to show when a fetch failed.
 *
 * Every load used to `.catch(() => null)` and render the empty state, so a
 * dropped connection looked exactly like "you have no apps yet" — which is a
 * lie the user acts on. A failure has to say so and offer a way back.
 */
export function LoadError({
  title = "잠시 연결이 끊겼어요",
  description = "네트워크 상태를 확인하고 다시 시도해 주세요.",
  onRetry,
  retrying = false,
}: {
  title?: string;
  description?: string;
  onRetry: () => void;
  retrying?: boolean;
}) {
  return (
    <div className="load-error" role="alert">
      <span aria-hidden="true">
        <RefreshIcon />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      <button
        className="button button-quiet"
        type="button"
        onClick={onRetry}
        disabled={retrying}
      >
        {retrying ? "다시 불러오는 중…" : "다시 시도"}
      </button>
    </div>
  );
}
