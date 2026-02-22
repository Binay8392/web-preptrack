import { MockTestClient } from "@/components/mock/mock-test-client";
import { MockInterviewMode } from "@/components/placement/mock-interview-mode";
import { GlassCard } from "@/components/shared/glass-card";
import { requireAuth } from "@/lib/auth/server";
import { getDashboardData } from "@/lib/dashboard-data";
import { getPlacementDashboardData } from "@/lib/placement-data";

export const dynamic = "force-dynamic";

export default async function MockTestsPage() {
  const session = await requireAuth();
  const placementData = await getPlacementDashboardData(session.uid);

  if (placementData) {
    return (
      <main className="space-y-4 pb-6">
        <GlassCard>
          <h1 className="text-2xl font-bold text-white">Placement Mock Console</h1>
          <p className="mt-2 text-sm text-slate-300">
            Practice coding and aptitude rounds, then run mock HR and behavioral interviews with AI feedback.
          </p>
        </GlassCard>

        <GlassCard>
          <MockTestClient
            examId="placement"
            examName={`${placementData.user.targetRole ?? "Software Developer"} Placement`}
            subjects={placementData.metrics.weakDsaTopics}
            previousAttempts={placementData.mockTests
              .filter((item) => item.mode === "placement")
              .reverse()
              .slice(-10)
              .map((item, index) => ({
                label: `T${index + 1}`,
                score: Math.round((item.score / Math.max(item.totalQuestions, 1)) * 100),
              }))}
            mode="placement"
            defaultSegment="coding"
          />
        </GlassCard>

        <GlassCard>
          <p className="mb-3 text-sm font-semibold text-white">Mock Interview Mode</p>
          <MockInterviewMode
            initialHistory={placementData.mockInterviews.map((item) => ({
              id: item.id,
              mode: item.mode,
              score: item.score,
              feedbackSummary: item.feedbackSummary,
            }))}
          />
        </GlassCard>
      </main>
    );
  }

  const data = await getDashboardData(session.uid);

  if (!data) {
    return (
      <GlassCard>
        <p className="text-sm text-slate-300">Mock tests unavailable until onboarding is completed.</p>
      </GlassCard>
    );
  }

  return (
    <main className="space-y-4 pb-6">
      <GlassCard>
        <h1 className="text-2xl font-bold text-white">Mock Test Console</h1>
        <p className="mt-2 text-sm text-slate-300">
          Generate AI MCQ tests, evaluate instantly, and store attempts for readiness analysis.
        </p>
      </GlassCard>

      <GlassCard>
        <MockTestClient
          examId={data.exam.id}
          examName={data.exam.name}
          subjects={data.subjects.map((subject) => subject.name)}
          previousAttempts={data.metrics.mockPerformance}
          mode="exam"
        />
      </GlassCard>
    </main>
  );
}
