import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { DecodedIdToken } from "firebase-admin/auth";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { ensureUserDocument } from "@/lib/firestore/service";
import type { UserDocument } from "@/lib/types";

const SESSION_COOKIE_NAME = "__session";
const GUEST_UID = process.env.DEFAULT_GUEST_UID ?? "guest-user";

export async function getSession() {
  const sessionCookie = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    return { uid: GUEST_UID } as DecodedIdToken;
  }

  try {
    return await adminAuth().verifySessionCookie(sessionCookie, true);
  } catch {
    return { uid: GUEST_UID } as DecodedIdToken;
  }
}

export async function requireAuth() {
  const session = await getSession();
  await ensureUserDocument({
    uid: session.uid,
    name: "PrepTrack User",
    email: "",
    photoURL: "",
  });
  return session;
}

export async function getCurrentUserProfile() {
  const session = await requireAuth();
  const snap = await adminDb().collection("users").doc(session.uid).get();
  if (!snap.exists) return null;
  return {
    uid: session.uid,
    ...(snap.data() as UserDocument),
  };
}

export async function redirectIfAuthed() {
  redirect("/");
}
