"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "firebase/app-check";
import {
  browserLocalPersistence,
  connectAuthEmulator,
  getAuth,
  setPersistence,
  type Auth,
} from "firebase/auth";
import {
  connectStorageEmulator,
  getStorage,
  type FirebaseStorage,
} from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseClientConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
);

// No Firestore here on purpose: every read and write goes through the JSON API
// (Admin SDK), and shipping the Firestore SDK would put its WebChannel /
// IndexedDB codegen — which Toss app review flags as eval — into the bundle.
export interface FirebaseClientServices {
  app: FirebaseApp;
  auth: Auth;
  storage: FirebaseStorage;
}

let services: FirebaseClientServices | null = null;
let persistenceConfigured = false;
let appCheckConfigured = false;
let emulatorsConnected = false;

export function getFirebaseClientServices(): FirebaseClientServices | null {
  if (!isFirebaseClientConfigured || typeof window === "undefined") return null;
  if (services) return services;

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const appCheckSiteKey = process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY;

  const usesEmulators =
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";
  if (appCheckSiteKey && !appCheckConfigured && !usesEmulators) {
    appCheckConfigured = true;
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  }

  if (!persistenceConfigured) {
    persistenceConfigured = true;
    void setPersistence(auth, browserLocalPersistence).catch(() => {
      persistenceConfigured = false;
    });
  }

  const storage = getStorage(app);
  if (usesEmulators && !emulatorsConnected) {
    emulatorsConnected = true;
    connectAuthEmulator(auth, "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
    connectStorageEmulator(storage, "127.0.0.1", 9199);
  }

  services = {
    app,
    auth,
    storage,
  };

  return services;
}
