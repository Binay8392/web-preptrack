import { NextResponse } from "next/server";
import { z } from "zod";

import { adminAuth } from "@/lib/firebase/admin";
import { ensureUserDocument } from "@/lib/firestore/service";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  idToken: z.string().min(1),
});

const SESSION_COOKIE_NAME = "__session";
const EXPIRES_IN_MS = 1000 * 60 * 60 * 24 * 7;

function mapSessionError(error: unknown) {
  if (!(error instanceof Error)) return "Failed to create session.";

  const message = error.message || "";

  if (message.includes("Firebase Admin credentials are missing")) {
    return "Server auth is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in deployment env vars.";
  }

  if (message.includes("ID token")) {
    return "Invalid Firebase ID token. Ensure client and server Firebase projects are the same.";
  }

  return message || "Failed to create session.";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const decoded = await adminAuth().verifyIdToken(parsed.data.idToken);
    const sessionCookie = await adminAuth().createSessionCookie(parsed.data.idToken, {
      expiresIn: EXPIRES_IN_MS,
    });

    await ensureUserDocument({
      uid: decoded.uid,
      name: decoded.name ?? "PrepTrack Student",
      email: decoded.email ?? "",
      photoURL: decoded.picture ?? "",
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: EXPIRES_IN_MS / 1000,
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: mapSessionError(error) }, { status: 401 });
  }
}
