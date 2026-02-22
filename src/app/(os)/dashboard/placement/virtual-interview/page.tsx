import { redirect } from "next/navigation";

import { VirtualInterviewAI } from "@/components/placement/virtual-interview-ai";
import { GlassCard } from "@/components/shared/glass-card";
import { requireAuth } from "@/lib/auth/server";
import { getPlacementDashboardData } from "@/lib/placement-data";

export const dynamic = "force-dynamic";

export default async function VirtualInterviewPage() {
  const session = await requireAuth();
  const data = await getPlacementDashboardData(session.uid);
  if (!data) redirect("/dashboard");

  return (
    <main className="space-y-4 pb-6">
      <GlassCard>
        <h1 className="text-2xl font-bold text-white">Virtual Interview AI</h1>
        <p className="mt-2 text-sm text-slate-300">
          Simulate real interviews with AI interviewer prompts, deep answer evaluation, follow-up questions, and
          progress tracking.
        </p>
      </GlassCard>

      <VirtualInterviewAI
        targetRole={data.user.targetRole ?? "Software Developer"}
        history={data.interviewSessions.map((item) => ({
          id: item.id,
          type: item.type,
          difficulty: item.difficulty,
          company: item.company,
          finalScore: item.finalScore ?? null,
          createdAt: item.createdAt?.toISOString(),
        }))}
      />
    </main>
  );
}
