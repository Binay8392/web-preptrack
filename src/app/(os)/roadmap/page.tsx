import { addWeeks, format } from "date-fns";
import { redirect } from "next/navigation";

import { GlassCard } from "@/components/shared/glass-card";
import { requireAuth } from "@/lib/auth/server";
import { getDashboardData } from "@/lib/dashboard-data";
import { getPlacementDashboardData } from "@/lib/placement-data";

export const dynamic = "force-dynamic";

export default async function RoadmapPage() {
  const session = await requireAuth();
  const placementData = await getPlacementDashboardData(session.uid);

  if (placementData) {
    const phases = [
      "DSA Pattern Mastery",
      "Aptitude Speed Building",
      "Core CS Interview Revision",
      "Mock Interview Drills",
      "Company-Specific Prep",
      "Final Revision and Applications",
    ];

    const roadmap = phases.map((phase, index) => ({
      week: `Week ${index + 1}`,
      date: format(addWeeks(new Date(), index), "dd MMM yyyy"),
      phase,
      checklist: [
        "Daily coding set",
        "Timed aptitude block",
        "Interview question revision",
        "Application and outreach update",
      ],
    }));

    return (
      <main className="space-y-4 pb-6">
        <GlassCard>
          <h1 className="text-2xl font-bold text-white">Placement Roadmap</h1>
          <p className="mt-2 text-sm text-slate-300">
            Weekly placement execution path integrating DSA, aptitude, core subjects, interviews, and applications.
          </p>
        </GlassCard>

        <section className="grid gap-4 lg:grid-cols-2">
          {roadmap.map((week) => (
            <GlassCard key={week.week}>
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/80">{week.week}</p>
              <p className="mt-1 text-sm text-slate-300">{week.date}</p>
              <p className="mt-3 text-lg font-semibold text-white">{week.phase}</p>
              <ul className="mt-3 space-y-1 text-sm text-slate-200">
                {week.checklist.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </GlassCard>
          ))}
        </section>
      </main>
    );
  }

  const data = await getDashboardData(session.uid);
  if (!data) redirect("/dashboard");

  const weakFirst = [...data.metrics.subjectProgress].sort((a, b) => a.progress - b.progress);
  const weeks = Array.from({ length: 6 }).map((_, index) => {
    const weekStart = addWeeks(new Date(), index);
    const focusSubject = weakFirst[index % Math.max(weakFirst.length, 1)];
    return {
      label: `Week ${index + 1}`,
      date: format(weekStart, "dd MMM yyyy"),
      focus: focusSubject?.name ?? "Revision",
      targetHours: Math.max(4, Math.round(data.metrics.weeklyTargetHours)),
      checklist: ["Core concept revision", "Timed problem set", "Error log review", "Mini mock analysis"],
    };
  });

  return (
    <main className="space-y-4 pb-6">
      <GlassCard>
        <h1 className="text-2xl font-bold text-white">Smart Roadmap</h1>
        <p className="mt-2 text-sm text-slate-300">
          Priority-driven weekly roadmap auto-structured from your current readiness and weak subject profile.
        </p>
      </GlassCard>

      <section className="grid gap-4 lg:grid-cols-2">
        {weeks.map((week) => (
          <GlassCard key={week.label}>
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/80">{week.label}</p>
            <p className="mt-1 text-sm text-slate-300">{week.date}</p>
            <p className="mt-3 text-lg font-semibold text-white">{week.focus}</p>
            <p className="text-sm text-slate-300">Target: {week.targetHours} hours</p>
            <ul className="mt-3 space-y-1 text-sm text-slate-200">
              {week.checklist.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </GlassCard>
        ))}
      </section>
    </main>
  );
}
