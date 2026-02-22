import { redirect } from "next/navigation";

import { MockPerformanceChart } from "@/components/charts/mock-performance-chart";
import { WeeklyHoursChart } from "@/components/charts/weekly-hours-chart";
import { GlassCard } from "@/components/shared/glass-card";
import { requireAuth } from "@/lib/auth/server";
import { getDashboardData } from "@/lib/dashboard-data";
import { getPlacementDashboardData } from "@/lib/placement-data";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const session = await requireAuth();
  const placementData = await getPlacementDashboardData(session.uid);

  if (placementData) {
    return (
      <main className="space-y-4 pb-6">
        <GlassCard>
          <h1 className="text-2xl font-bold text-white">Placement Analytics</h1>
          <p className="mt-2 text-sm text-slate-300">
            Live placement metrics across DSA completion, aptitude practice, mock interview performance, and streak.
          </p>
        </GlassCard>

        <section className="grid gap-4 xl:grid-cols-2">
          <GlassCard>
            <p className="mb-3 text-sm font-semibold text-white">Study Hours Trend</p>
            <WeeklyHoursChart data={placementData.metrics.weeklyHours} variant="line" />
          </GlassCard>

          <GlassCard>
            <p className="mb-3 text-sm font-semibold text-white">Placement Mock Test Trend</p>
            <MockPerformanceChart
              data={placementData.mockTests
                .filter((item) => item.mode === "placement")
                .reverse()
                .slice(-8)
                .map((item, index) => ({
                  label: `T${index + 1}`,
                  score: Math.round((item.score / Math.max(item.totalQuestions, 1)) * 100),
                }))}
            />
          </GlassCard>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <GlassCard>
            <p className="mb-3 text-sm font-semibold text-white">DSA Completion by Difficulty</p>
            <div className="space-y-3">
              {placementData.metrics.dsaByDifficulty.map((item) => {
                const progress = item.total ? Math.round((item.completed / item.total) * 100) : 0;
                return (
                  <div key={item.difficulty}>
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                      <span>{item.difficulty}</span>
                      <span>
                        {item.completed}/{item.total}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-900/55">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard>
            <p className="text-sm font-semibold text-white">Interview Readiness</p>
            <p className="mt-3 text-5xl font-bold text-emerald-200">{placementData.metrics.mockInterviewScore}%</p>
            <p className="text-sm text-slate-300">AI-scored mock interview performance</p>
            <div className="mt-4 rounded-xl border border-slate-300/10 bg-slate-900/35 p-3 text-sm text-slate-300">
              Readiness score combines DSA completion, aptitude activity, mock interview quality, and consistency.
            </div>
          </GlassCard>
        </section>
      </main>
    );
  }

  const data = await getDashboardData(session.uid);
  if (!data) redirect("/dashboard");

  return (
    <main className="space-y-4 pb-6">
      <GlassCard>
        <h1 className="text-2xl font-bold text-white">Progress Analytics</h1>
        <p className="mt-2 text-sm text-slate-300">
          Subject completion, weekly output, mock performance, and streak consistency in one place.
        </p>
      </GlassCard>

      <section className="grid gap-4 xl:grid-cols-2">
        <GlassCard>
          <p className="mb-3 text-sm font-semibold text-white">Study Hours Trend</p>
          <WeeklyHoursChart data={data.metrics.weeklyHours} variant="line" />
        </GlassCard>

        <GlassCard>
          <p className="mb-3 text-sm font-semibold text-white">Mock Test Trend</p>
          <MockPerformanceChart data={data.metrics.mockPerformance} />
        </GlassCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <GlassCard>
          <p className="mb-3 text-sm font-semibold text-white">Subject Completion %</p>
          <div className="space-y-3">
            {data.metrics.subjectProgress.map((subject) => (
              <div key={subject.id}>
                <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                  <span>{subject.name}</span>
                  <span>{subject.progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-900/55">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300"
                    style={{ width: `${subject.progress}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {subject.studiedHours}h / {subject.requiredHours}h
                </p>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-sm font-semibold text-white">Streak Intelligence</p>
          <p className="mt-3 text-5xl font-bold text-amber-200">{data.user.streak}</p>
          <p className="text-sm text-slate-300">Current study streak (days)</p>
          <div className="mt-4 rounded-xl border border-slate-300/10 bg-slate-900/35 p-3 text-sm text-slate-300">
            Keep a minimum of one saved study session daily to preserve streak and improve readiness stability.
          </div>
        </GlassCard>
      </section>
    </main>
  );
}
