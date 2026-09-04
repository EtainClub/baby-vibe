"use client";

import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithCustomToken,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebaseClientServices } from "@/lib/firebase/client";

/** Resolves with the current user once Firebase has restored the session. */
export function waitForAuthUser(): Promise<User | null> {
  const services = getFirebaseClientServices();
  if (!services) return Promise.resolve(null);

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(services.auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

/**
 * Baseline identity for the Apps in Toss build.
 *
 * The Toss webview blocks OAuth popups and redirects, so there is no provider
 * login to fall back on — an anonymous account is the account, and a recovery
 * key is what carries it to another device.
 */
export async function ensureAnonymousUser(): Promise<User | null> {
  const services = getFirebaseClientServices();
  if (!services) return null;

  const existing = await waitForAuthUser();
  if (existing) return existing;

  try {
    return (await signInAnonymously(services.auth)).user;
  } catch {
    return null;
  }
}

/** Replaces the local identity with the account a recovery key points at. */
export async function signInWithRecoveryToken(token: string) {
  const services = getFirebaseClientServices();
  if (!services) return null;

  await signOut(services.auth).catch(() => undefined);
  return (await signInWithCustomToken(services.auth, token)).user;
}
