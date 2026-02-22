import { addDays, format } from "date-fns";
import { redirect } from "next/navigation";

import { GlassCard } from "@/components/shared/glass-card";
import { requireAuth } from "@/lib/auth/server";
import { getDashboardData } from "@/lib/dashboard-data";
import { getPlacementDashboardData } from "@/lib/placement-data";

export const dynamic = "force-dynamic";

export default async function StudyPlanPage() {
  const session = await requireAuth();
  const placementData = await getPlacementDashboardData(session.uid);

  if (placementData) {
    const baseHours = placementData.user.dailyStudyTime ?? 2;
    const plan = Array.from({ length: 7 }).map((_, dayIndex) => {
      const day = format(addDays(new Date(), dayIndex), "EEE, dd MMM");
      const extra = dayIndex % 2 === 0 ? 0.4 : 0.2;
      return {
        day,
        hours: Number((baseHours + extra).toFixed(1)),
        blocks: [
          "DSA problem set + review",
          "Aptitude timed round",
          "Core CS revision",
          "Interview communication practice",
        ],
      };
    });

    return (
      <main className="space-y-4 pb-6">
        <GlassCard>
          <h1 className="text-2xl font-bold text-white">Placement Study Plan</h1>
          <p className="mt-2 text-sm text-slate-300">
            Structured daily plan for coding rounds, aptitude tests, interview prep, and company applications.
          </p>
        </GlassCard>

        <GlassCard>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.14em] text-slate-400">
                <tr>
                  <th className="px-3 py-2">Day</th>
                  <th className="px-3 py-2">Study Hours</th>
                  <th className="px-3 py-2">Plan Blocks</th>
                </tr>
              </thead>
              <tbody>
                {plan.map((item) => (
                  <tr key={item.day} className="border-t border-slate-300/10">
                    <td className="px-3 py-3 text-slate-100">{item.day}</td>
                    <td className="px-3 py-3 text-cyan-100">{item.hours}h</td>
                    <td className="px-3 py-3 text-slate-300">{item.blocks.join(" | ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </main>
    );
  }

  const data = await getDashboardData(session.uid);
  if (!data) redirect("/dashboard");

  const rankedSubjects = [...data.metrics.subjectProgress].sort((a, b) => a.progress - b.progress);
  const baseDailyHours = data.user.dailyStudyTime ?? 2;
  const plan = Array.from({ length: 7 }).map((_, dayIndex) => {
    const focus = rankedSubjects[dayIndex % Math.max(rankedSubjects.length, 1)];
    return {
      day: format(addDays(new Date(), dayIndex), "EEE, dd MMM"),
      focus: focus?.name ?? "Revision",
      hours: Number((baseDailyHours + (100 - (focus?.progress ?? 70)) / 200).toFixed(1)),
      tasks: ["Concept revision", "Practice set", "Mistake analysis"],
    };
  });

  return (
    <main className="space-y-4 pb-6">
      <GlassCard>
        <h1 className="text-2xl font-bold text-white">Study Plan</h1>
        <p className="mt-2 text-sm text-slate-300">
          Auto-generated 7-day execution plan from target date, daily hours, and weak subjects.
        </p>
      </GlassCard>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <GlassCard>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.14em] text-slate-400">
                <tr>
                  <th className="px-3 py-2">Day</th>
                  <th className="px-3 py-2">Focus Subject</th>
                  <th className="px-3 py-2">Hours</th>
                  <th className="px-3 py-2">Tasks</th>
                </tr>
              </thead>
              <tbody>
                {plan.map((item) => (
                  <tr key={item.day} className="border-t border-slate-300/10">
                    <td className="px-3 py-3 text-slate-100">{item.day}</td>
                    <td className="px-3 py-3 text-cyan-100">{item.focus}</td>
                    <td className="px-3 py-3 text-slate-100">{item.hours}h</td>
                    <td className="px-3 py-3 text-slate-300">{item.tasks.join(" | ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-sm font-semibold text-white">Daily Target Formula</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>- Base from onboarding daily study commitment</li>
            <li>- Added buffer for weak subject catch-up</li>
            <li>- Balanced revision + test + error review</li>
            <li>- Weekly recalibration from performance</li>
          </ul>
        </GlassCard>
      </section>
    </main>
  );
}
