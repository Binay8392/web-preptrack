"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Chrome } from "lucide-react";
import type { AuthError } from "firebase/auth";
import { signInWithPopup } from "firebase/auth";

import { clientAuth, firebaseClientError, googleProvider } from "@/lib/firebase/client";

function getAuthErrorMessage(error: unknown) {
  if (!(error && typeof error === "object" && "code" in error)) {
    return error instanceof Error ? error.message : "Google sign-in failed.";
  }

  const authError = error as AuthError;

  if (authError.code === "auth/unauthorized-domain") {
    return "This domain is not authorized in Firebase Auth. Add your current domain in Firebase Console -> Authentication -> Authorized domains.";
  }

  if (authError.code === "auth/operation-not-allowed") {
    return "Google sign-in is disabled in Firebase. Enable Google provider in Firebase Console -> Authentication -> Sign-in method.";
  }

  if (authError.code === "auth/popup-blocked") {
    return "Sign-in popup was blocked by your browser. Allow popups for this site and try again.";
  }

  if (authError.code === "auth/popup-closed-by-user") {
    return "Sign-in popup was closed before completion. Please try again and finish the Google flow.";
  }

  if (authError.code === "auth/invalid-api-key") {
    return "Invalid Firebase Web API key. Check NEXT_PUBLIC_FIREBASE_API_KEY in your environment settings.";
  }

  return authError.message || "Google sign-in failed.";
}

export function GoogleSignInButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!clientAuth || !googleProvider) {
        throw new Error(
          firebaseClientError ??
            "Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* variables in Vercel.",
        );
      }

      const credential = await signInWithPopup(clientAuth, googleProvider);
      const idToken = await credential.user.getIdToken();

      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Unable to create secure session.");
      }

      router.replace("/");
      router.refresh();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Google sign-in error:", err);
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleSignIn}
        disabled={loading || !clientAuth || !googleProvider}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-400/30 bg-slate-900/40 px-4 py-3 text-sm font-semibold text-slate-50 transition hover:border-cyan-300/50 hover:bg-slate-900/70 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <Chrome className="size-4" />
        {loading ? "Signing in..." : "Continue with Google"}
      </button>
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
