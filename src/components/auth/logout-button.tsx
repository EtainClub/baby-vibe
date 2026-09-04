"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { ConfirmSheet, type ConfirmRequest } from "@/components/confirm-sheet";
import { getFirebaseClientServices } from "@/lib/firebase/client";
import { apiFetch } from "@/lib/api/client";
import { IS_TOSS_APP } from "@/lib/platform";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(
    null,
  );

  async function logout() {
    setPending(true);
    await apiFetch("/api/auth/session", { method: "DELETE" }).catch(() => undefined);
    const services = getFirebaseClientServices();
    if (services) await signOut(services.auth).catch(() => undefined);
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <button
        className="button button-quiet settings-logout"
        type="button"
        disabled={pending}
        onClick={() =>
          setConfirmRequest({
            title: "로그아웃할까요?",
            // Inside Toss the account is anonymous — there is no provider to
            // sign back in with, so only a recovery key can undo this.
            description: IS_TOSS_APP
              ? "복구 키를 저장하지 않았다면 이 페이지로 다시 돌아올 수 없어요."
              : "언제든 Google 계정으로 다시 로그인할 수 있어요.",
            confirmLabel: "로그아웃",
            destructive: IS_TOSS_APP,
            onConfirm: () => void logout(),
          })
        }
      >
        {pending ? "로그아웃 중…" : "로그아웃"}
      </button>
      <ConfirmSheet
        request={confirmRequest}
        onClose={() => setConfirmRequest(null)}
      />
    </>
  );
}
