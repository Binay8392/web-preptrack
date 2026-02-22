import { redirect } from "next/navigation";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { getSession } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/");

  return (
    <main className="page-shell flex min-h-screen items-center justify-center px-4 py-12">
      <section className="glass-card animate-float-up w-full max-w-md rounded-2xl p-7 sm:p-8">
        <div className="mb-6 space-y-2">
          <p className="inline-flex items-center rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
            PrepTrack OS
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white">Goal-based prep operating system</h1>
          <p className="text-sm text-slate-300">
            Sign in and build your personalized roadmap, readiness score, smart study plan, and AI-powered action
            recommendations.
          </p>
        </div>

        <GoogleSignInButton />
      </section>
    </main>
  );
}
