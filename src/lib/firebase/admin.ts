import "server-only";

import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { FirebaseConfigurationError } from "@/lib/errors";

function getAdminCredential() {
  const projectId = process.env.FB_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FB_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FB_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    return cert({ projectId, clientEmail, privateKey });
  }

  if (projectId && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return applicationDefault();
  }

  throw new FirebaseConfigurationError();
}

export function isFirebaseAdminConfigured() {
  const usesEmulator = Boolean(
    process.env.FIRESTORE_EMULATOR_HOST ||
      process.env.FIREBASE_AUTH_EMULATOR_HOST,
  );
  return Boolean(
    process.env.FB_ADMIN_PROJECT_ID &&
      (usesEmulator ||
        (process.env.FB_ADMIN_CLIENT_EMAIL &&
          process.env.FB_ADMIN_PRIVATE_KEY) ||
        process.env.GOOGLE_APPLICATION_CREDENTIALS),
  );
}

// Firebase Hosting's framework runtime initializes its own named admin app,
// so we can't rely on getApp()/the default app existing. Use a dedicated app.
const ADMIN_APP_NAME = "baby-vibe-admin";

export function getFirebaseAdminApp(): App {
  const existing = getApps().find((app) => app.name === ADMIN_APP_NAME);
  if (existing) return existing;

  const usesEmulator = Boolean(
    process.env.FIRESTORE_EMULATOR_HOST ||
      process.env.FIREBASE_AUTH_EMULATOR_HOST,
  );
  return initializeApp(
    {
      ...(usesEmulator ? {} : { credential: getAdminCredential() }),
      projectId: process.env.FB_ADMIN_PROJECT_ID,
      storageBucket: process.env.FB_ADMIN_STORAGE_BUCKET,
    },
    ADMIN_APP_NAME,
  );
}

export function getAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getAdminDb() {
  return getFirestore(getFirebaseAdminApp());
}

export function getAdminStorage() {
  return getStorage(getFirebaseAdminApp());
}
