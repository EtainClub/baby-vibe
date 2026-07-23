"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { getFirebaseClientServices } from "@/lib/firebase/client";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    await fetch("/api/auth/session", { method: "DELETE" }).catch(() => undefined);
    const services = getFirebaseClientServices();
    if (services) await signOut(services.auth).catch(() => undefined);
    router.push("/");
    router.refresh();
  }

  return (
    <button
      className="button button-quiet settings-logout"
      type="button"
      onClick={logout}
      disabled={pending}
    >
      {pending ? "로그아웃 중…" : "로그아웃"}
    </button>
  );
}
