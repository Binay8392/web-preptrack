"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "firebase/auth";

import { clientAuth } from "@/lib/firebase/client";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = () => {
    startTransition(async () => {
      setError(null);
      try {
        if (clientAuth) {
          await signOut(clientAuth);
        }
        await fetch("/api/auth/logout", { method: "POST" });
        router.replace("/login");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Sign out failed.");
      }
    });
  };

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg border border-rose-200/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/20 disabled:opacity-70"
      >
        <LogOut className="size-3.5" />
        {isPending ? "Signing out..." : "Sign out"}
      </button>
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
