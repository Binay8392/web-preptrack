import { CalendarClock, Flame, Gauge, Target, TrendingUp } from "lucide-react";
import Link from "next/link";

import { AIRecommendationCard } from "@/components/dashboard/ai-recommendation-card";
import { PlacementMentorCard } from "@/components/dashboard/placement-mentor-card";
import { StudyTimer } from "@/components/dashboard/study-timer";
import { WeeklyHoursChart } from "@/components/charts/weekly-hours-chart";
import { GlassCard } from "@/components/shared/glass-card";
import { requireAuth } from "@/lib/auth/server";
import { getDashboardData } from "@/lib/dashboard-data";
import { getPlacementDashboardData } from "@/lib/placement-data";

export const dynamic = "force-dynamic";

function PlacementRoadmapCards() {
  const roadmap = [
    { title: "DSA Tracker", desc: "Topic checklist, difficulty split, and streak-driven progression." },
    { title: "Core CS Subjects", desc: "OS, DBMS, and CN revision blocks for interview depth." },
    { title: "Aptitude", desc: "Timed logical, quantitative, and verbal practice rounds." },
    { title: "Mock Interview", desc: "Coding + HR + behavioral simulation with AI feedback." },
    { title: "Resume Builder", desc: "Role-focused resume updates tied to company targets." },
    { title: "Interview Prep", desc: "Company-specific patterns, rounds, and final revision cadence." },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {roadmap.map((item) => (
        <div key={item.title} className="rounded-xl border border-slate-300/15 bg-slate-900/30 p-3">
          <p className="text-sm font-semibold text-white">{item.title}</p>
          <p className="mt-1 text-xs text-slate-300">{item.desc}</p>
        </div>
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await requireAuth();

  const placementData = await getPlacementDashboardData(session.uid);
  if (placementData) {
    const countdownDays = placementData.user.targetDate
      ? Math.max(
          0,
          Math.ceil(
            (new Date(placementData.user.targetDate).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : 0;

    return (
      <main className="space-y-4 pb-6">
        <header className="glass-card rounded-2xl border-cyan-300/25 bg-gradient-to-br from-[#0a1a3d]/80 to-[#05203f]/70 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/80">Placement Preparation</p>
          <h1 className="mt-2 text-3xl font-bold text-white">
            {placementData.user.targetRole ?? "Software Developer"} Placement OS
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-300">
            DSA + aptitude + interview system with company tracking, AI mentoring, and readiness intelligence.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <GlassCard className="animate-pulse-glow">
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.17em] text-slate-300">
              <Gauge className="size-4" />
              Placement Readiness
            </p>
            <p className="mt-3 text-4xl font-bold text-emerald-200">{placementData.metrics.readinessScore}%</p>
            <p className="text-sm text-slate-300">interview readiness score</p>
          </GlassCard>

          <GlassCard>
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.17em] text-slate-300">
              <Target className="size-4" />
              DSA Completion
            </p>
            <p className="mt-3 text-4xl font-bold text-cyan-100">{placementData.metrics.dsaCompletion}%</p>
            <p className="text-sm text-slate-300">topic tracker completion</p>
          </GlassCard>

          <GlassCard>
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.17em] text-slate-300">
              <TrendingUp className="size-4" />
              Aptitude Progress
            </p>
            <p className="mt-3 text-4xl font-bold text-cyan-100">{placementData.metrics.aptitudeProgress}%</p>
            <p className="text-sm text-slate-300">practice momentum</p>
          </GlassCard>

          <GlassCard>
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.17em] text-slate-300">
              <Flame className="size-4" />
              Streak
            </p>
            <p className="mt-3 text-4xl font-bold text-amber-200">{placementData.metrics.streak}</p>
            <p className="text-sm text-slate-300">consistent preparation days</p>
          </GlassCard>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <GlassCard>
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-200" />
              <p className="text-sm font-semibold text-white">Weekly Study Hours</p>
            </div>
            <WeeklyHoursChart data={placementData.metrics.weeklyHours} />
          </GlassCard>

          <GlassCard>
            <StudyTimer
              subjects={[
                { id: "dsa", name: "DSA" },
                { id: "aptitude", name: "Aptitude" },
                { id: "core-subjects", name: "Core Subjects" },
                { id: "interview", name: "Interview Prep" },
              ]}
            />
          </GlassCard>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
          <GlassCard>
            <p className="mb-3 text-sm font-semibold text-white">Placement Roadmap</p>
            <PlacementRoadmapCards />
          </GlassCard>

          <GlassCard>
            <PlacementMentorCard
              targetRole={placementData.user.targetRole ?? "Software Developer"}
              weakDsaTopics={placementData.metrics.weakDsaTopics}
              dailyStudyTime={placementData.user.dailyStudyTime ?? 2}
              companyTargets={placementData.companyApplications.slice(0, 4).map((item) => item.companyName)}
              mockInterviewScore={placementData.metrics.mockInterviewScore}
            />
          </GlassCard>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <GlassCard>
            <p className="text-xs uppercase tracking-[0.15em] text-slate-300">Virtual Interview Score</p>
            <p className="mt-2 text-3xl font-bold text-cyan-100">{placementData.metrics.virtualInterviewScore}%</p>
            <p className="text-xs text-slate-300">average AI interview performance</p>
          </GlassCard>

          <GlassCard>
            <p className="text-xs uppercase tracking-[0.15em] text-slate-300">Company Tracking</p>
            <p className="mt-2 text-3xl font-bold text-cyan-100">{placementData.companyApplications.length}</p>
            <p className="text-xs text-slate-300">applications in pipeline</p>
          </GlassCard>

          <GlassCard>
            <p className="text-xs uppercase tracking-[0.15em] text-slate-300">Today&apos;s Target</p>
            <p className="mt-2 text-3xl font-bold text-cyan-100">
              {Math.round(placementData.metrics.dailyTargetMinutes / 60)}h
            </p>
            <p className="text-xs text-slate-300">{placementData.metrics.dailyTargetMinutes} minutes planned</p>
          </GlassCard>

          <GlassCard>
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-slate-300">
              <CalendarClock className="size-4" />
              Target Countdown
            </p>
            <p className="mt-2 text-3xl font-bold text-white">{countdownDays}</p>
            <p className="text-xs text-slate-300">days to placement target date</p>
          </GlassCard>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
          <GlassCard>
            <p className="text-sm font-semibold text-white">Weak Interview Topics</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {placementData.metrics.weakInterviewTopics.length ? (
                placementData.metrics.weakInterviewTopics.map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full border border-rose-300/30 bg-rose-500/10 px-3 py-1 text-xs text-rose-100"
                  >
                    {topic}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-300">No weak interview topics detected yet.</p>
              )}
            </div>
          </GlassCard>

          <GlassCard>
            <p className="text-sm font-semibold text-white">Virtual Interview AI</p>
            <p className="mt-2 text-sm text-slate-300">
              Run full AI interview rounds with question generation, scoring, model answers, and follow-up drills.
            </p>
            <Link
              href="/dashboard/placement/virtual-interview"
              className="mt-4 inline-flex rounded-lg border border-cyan-200/35 bg-cyan-300/15 px-4 py-2 text-sm font-semibold text-cyan-100"
            >
              Launch Virtual Interview
            </Link>
          </GlassCard>
        </section>
      </main>
    );
  }

  const data = await getDashboardData(session.uid);

  if (!data) {
    return (
      <main className="space-y-4">
        <GlassCard>
          <p className="text-sm text-slate-200">
            Unable to load dashboard. Complete onboarding and ensure exam data exists in Firestore.
          </p>
        </GlassCard>
      </main>
    );
  }

  const lastPerformance = data.metrics.mockPerformance.length
    ? data.metrics.mockPerformance[data.metrics.mockPerformance.length - 1].score
    : 0;

  return (
    <main className="space-y-4 pb-6">
      <header className="glass-card rounded-2xl p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/80">{data.exam.category}</p>
        <h1 className="mt-2 text-3xl font-bold text-white">{data.exam.name} Mission Control</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Personalized operating view with live countdown, readiness scoring, AI strategy, streak momentum, and study
          performance tracking.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <GlassCard className="animate-pulse-glow">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.17em] text-slate-300">
            <CalendarClock className="size-4" />
            Countdown
          </p>
          <p className="mt-3 text-4xl font-bold text-white">{data.metrics.countdownDays}</p>
          <p className="text-sm text-slate-300">days remaining</p>
        </GlassCard>

        <GlassCard>
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.17em] text-slate-300">
            <Gauge className="size-4" />
            Readiness Score
          </p>
          <p className="mt-3 text-4xl font-bold text-emerald-200">{data.metrics.readinessScore}%</p>
          <p className="text-sm text-slate-300">overall preparedness</p>
        </GlassCard>

        <GlassCard>
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.17em] text-slate-300">
            <Target className="size-4" />
            Today&apos;s Target
          </p>
          <p className="mt-3 text-4xl font-bold text-cyan-100">{Math.round(data.metrics.todayTargetMinutes / 60)}h</p>
          <p className="text-sm text-slate-300">{data.metrics.todayTargetMinutes} minutes</p>
        </GlassCard>

        <GlassCard>
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.17em] text-slate-300">
            <Flame className="size-4" />
            Streak
          </p>
          <p className="mt-3 text-4xl font-bold text-amber-200">{data.user.streak}</p>
          <p className="text-sm text-slate-300">consecutive active days</p>
        </GlassCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <GlassCard>
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="size-4 text-emerald-200" />
            <p className="text-sm font-semibold text-white">Weekly Study Hours</p>
          </div>
          <WeeklyHoursChart data={data.metrics.weeklyHours} />
        </GlassCard>

        <GlassCard>
          <StudyTimer subjects={data.subjects.map((subject) => ({ id: subject.id, name: subject.name }))} />
        </GlassCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <GlassCard>
          <p className="mb-4 text-sm font-semibold text-white">Subject Progress</p>
          <div className="space-y-3">
            {data.metrics.subjectProgress.map((subject) => (
              <div key={subject.id}>
                <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                  <span>{subject.name}</span>
                  <span>{subject.progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-900/50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300"
                    style={{ width: `${subject.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <AIRecommendationCard
            exam={data.exam.name}
            weakSubjects={data.metrics.weakSubjects}
            lastPerformance={lastPerformance}
            studyTime={data.user.dailyStudyTime ?? 2}
          />
        </GlassCard>
      </section>
    </main>
  );
}
