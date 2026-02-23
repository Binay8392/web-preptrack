"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const requiredConfigMap = {
  NEXT_PUBLIC_FIREBASE_API_KEY: firebaseConfig.apiKey,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: firebaseConfig.authDomain,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: firebaseConfig.projectId,
  NEXT_PUBLIC_FIREBASE_APP_ID: firebaseConfig.appId,
} as const;

const missingRequiredKeys = Object.entries(requiredConfigMap)
  .filter(([, value]) => !value)
  .map(([key]) => key);

const hasRequiredConfig = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
);

if (!hasRequiredConfig) {
  // eslint-disable-next-line no-console
  console.warn(
    `Firebase client configuration is missing. Missing: ${missingRequiredKeys.join(", ") || "unknown key"}.`,
  );
}

let app = null;
let firebaseClientError: string | null = null;

if (hasRequiredConfig) {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  } catch (error) {
    firebaseClientError =
      error instanceof Error ? error.message : "Failed to initialize Firebase client SDK.";

    // eslint-disable-next-line no-console
    console.error(firebaseClientError);
  }
} else {
  firebaseClientError =
    `Firebase client is not configured. Missing: ${missingRequiredKeys.join(", ") || "unknown key"}.`;
}

if (process.env.NEXT_PUBLIC_FIREBASE_DEBUG === "true") {
  // Safe to log existence booleans only; never log secrets.
  // eslint-disable-next-line no-console
  console.table({
    NEXT_PUBLIC_FIREBASE_API_KEY: Boolean(firebaseConfig.apiKey),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: Boolean(firebaseConfig.authDomain),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: Boolean(firebaseConfig.projectId),
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: Boolean(firebaseConfig.storageBucket),
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: Boolean(firebaseConfig.messagingSenderId),
    NEXT_PUBLIC_FIREBASE_APP_ID: Boolean(firebaseConfig.appId),
    NEXT_PUBLIC_FIREBASE_DEBUG: process.env.NEXT_PUBLIC_FIREBASE_DEBUG,
    host: typeof window !== "undefined" ? window.location.host : "server",
  });
}

export { firebaseClientError };

export const clientAuth = app ? getAuth(app) : null;
export const clientDb = app ? getFirestore(app) : null;
export const googleProvider = app ? new GoogleAuthProvider() : null;

if (googleProvider) {
  googleProvider.setCustomParameters({
    prompt: "select_account",
  });
}
