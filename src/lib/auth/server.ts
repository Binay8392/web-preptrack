import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import type { UserDocument } from "@/lib/types";

const SESSION_COOKIE_NAME = "__session";

export async function getSession() {
  const sessionCookie = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    return await adminAuth().verifySessionCookie(sessionCookie, true);
  } catch {
    return null;
  }
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) redirect("/login");
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
  const session = await getSession();
  if (session) redirect("/");
}
