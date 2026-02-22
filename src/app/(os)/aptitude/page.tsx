import { redirect } from "next/navigation";

import { GlassCard } from "@/components/shared/glass-card";
import { requireAuth } from "@/lib/auth/server";
import { getPlacementDashboardData } from "@/lib/placement-data";

export const dynamic = "force-dynamic";

export default async function AptitudePage() {
  const session = await requireAuth();
  const data = await getPlacementDashboardData(session.uid);
  if (!data) redirect("/dashboard");

  const aptitudeTests = data.mockTests.filter(
    (test) => test.mode === "placement" && test.segment === "aptitude",
  );
  const avgScore = aptitudeTests.length
    ? Math.round(
        aptitudeTests.reduce((sum, test) => sum + (test.score / Math.max(test.totalQuestions, 1)) * 100, 0) /
          aptitudeTests.length,
      )
    : 0;

  const sections = [
    { title: "Quantitative Aptitude", targetTests: 10 },
    { title: "Logical Reasoning", targetTests: 8 },
    { title: "Verbal Ability", targetTests: 8 },
  ];

  return (
    <main className="space-y-4 pb-6">
      <GlassCard>
        <h1 className="text-2xl font-bold text-white">Aptitude Module</h1>
        <p className="mt-2 text-sm text-slate-300">
          Timed aptitude practice tracker for quantitative, logical reasoning, and verbal rounds.
        </p>
      </GlassCard>

      <section className="grid gap-4 md:grid-cols-3">
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Tests Attempted</p>
          <p className="mt-2 text-3xl font-bold text-cyan-100">{aptitudeTests.length}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Average Score</p>
          <p className="mt-2 text-3xl font-bold text-emerald-200">{avgScore}%</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Readiness Impact</p>
          <p className="mt-2 text-3xl font-bold text-cyan-100">{data.metrics.aptitudeProgress}%</p>
        </GlassCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {sections.map((section) => {
          const progress = Math.min(100, Math.round((aptitudeTests.length / section.targetTests) * 100));
          return (
            <GlassCard key={section.title}>
              <p className="text-sm font-semibold text-white">{section.title}</p>
              <p className="mt-1 text-xs text-slate-300">Target {section.targetTests} tests</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-900/55">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-cyan-100">{progress}% progress</p>
            </GlassCard>
          );
        })}
      </section>
    </main>
  );
}
