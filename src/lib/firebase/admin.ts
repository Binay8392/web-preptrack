import "server-only";

import { getApp, getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App | null = null;

function getPrivateKey() {
  const key = process.env.FIREBASE_PRIVATE_KEY;
  if (!key) return undefined;

  // Accept both quoted .env style keys and raw values from hosting providers.
  const unquoted =
    key.length >= 2 && key.startsWith("\"") && key.endsWith("\"")
      ? key.slice(1, -1)
      : key;

  return unquoted.replace(/\\n/g, "\n");
}

function initAdminApp() {
  if (adminApp) return adminApp;
  if (getApps().length) {
    adminApp = getApp();
    return adminApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = getPrivateKey();

  if (projectId && clientEmail && privateKey) {
    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    return adminApp;
  }

  throw new Error(
    "Firebase Admin credentials are missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.",
  );
}

export function adminAuth() {
  return getAuth(initAdminApp());
}

export function adminDb() {
  return getFirestore(initAdminApp());
}
