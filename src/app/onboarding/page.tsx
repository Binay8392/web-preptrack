import { redirect } from "next/navigation";

import { submitOnboardingAction } from "@/actions/onboarding";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { requireAuth } from "@/lib/auth/server";
import { getUser, listExams } from "@/lib/firestore/service";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await requireAuth();
  const [user, exams] = await Promise.all([getUser(session.uid), listExams()]);

  if (user?.onboardingCompleted && ((user.goalType === "placement" && user.targetRole) || user.examId)) {
    redirect("/dashboard");
  }

  return (
    <main className="page-shell mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-12">
      <section className="glass-card animate-float-up w-full rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-white">Set up your prep OS</h1>
        <p className="mt-2 text-sm text-slate-300">
          Choose your goal, timeline, and daily commitment. PrepTrack OS auto-configures modules for exam or placement.
        </p>

        <form action={submitOnboardingAction} className="mt-8 grid gap-5">
          <OnboardingForm exams={exams} />

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-100">Target date</span>
            <input
              type="date"
              name="targetDate"
              required
              min={new Date().toISOString().slice(0, 10)}
              className="rounded-xl border border-slate-300/20 bg-slate-900/45 px-4 py-3 text-sm outline-none ring-cyan-300/40 focus:ring-2"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-slate-100">Daily study hours</span>
            <input
              type="number"
              name="dailyStudyTime"
              min={1}
              max={16}
              defaultValue={2}
              required
              className="rounded-xl border border-slate-300/20 bg-slate-900/45 px-4 py-3 text-sm outline-none ring-cyan-300/40 focus:ring-2"
            />
          </label>

          <fieldset className="grid gap-2">
            <legend className="text-sm font-semibold text-slate-100">Current level</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {(["Beginner", "Intermediate", "Advanced"] as const).map((level) => (
                <label key={level} className="cursor-pointer rounded-xl border border-slate-300/20 bg-slate-900/35 p-3">
                  <input type="radio" name="level" value={level} defaultChecked={level === "Beginner"} className="mr-2" />
                  <span className="text-sm">{level}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            className="mt-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-300 px-5 py-3 text-sm font-bold text-slate-900 transition hover:opacity-90"
          >
            Generate My Dashboard
          </button>
        </form>
      </section>
    </main>
  );
}
