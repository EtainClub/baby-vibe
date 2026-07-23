import "server-only";

import {
  applicationDefault,
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { FirebaseConfigurationError } from "@/lib/errors";

function getAdminCredential() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

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
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
      (usesEmulator ||
        (process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
          process.env.FIREBASE_ADMIN_PRIVATE_KEY) ||
        process.env.GOOGLE_APPLICATION_CREDENTIALS),
  );
}

export function getFirebaseAdminApp(): App {
  if (getApps().length) return getApp();

  const usesEmulator = Boolean(
    process.env.FIRESTORE_EMULATOR_HOST ||
      process.env.FIREBASE_AUTH_EMULATOR_HOST,
  );
  return initializeApp({
    ...(usesEmulator ? {} : { credential: getAdminCredential() }),
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    storageBucket: process.env.FIREBASE_ADMIN_STORAGE_BUCKET,
  });
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
