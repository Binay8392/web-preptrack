import { redirect } from "next/navigation";

import { DsaTracker } from "@/components/placement/dsa-tracker";
import { GlassCard } from "@/components/shared/glass-card";
import { requireAuth } from "@/lib/auth/server";
import { getPlacementDashboardData } from "@/lib/placement-data";

export const dynamic = "force-dynamic";

export default async function DsaPage() {
  const session = await requireAuth();
  const data = await getPlacementDashboardData(session.uid);

  if (!data) redirect("/dashboard");

  return (
    <main className="space-y-4 pb-6">
      <GlassCard>
        <h1 className="text-2xl font-bold text-white">DSA Tracker</h1>
        <p className="mt-2 text-sm text-slate-300">
          Topic checklist with difficulty-wise completion and problem-solving streak support.
        </p>
      </GlassCard>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <GlassCard>
          <DsaTracker topics={data.dsaTopics} />
        </GlassCard>

        <GlassCard>
          <p className="text-sm font-semibold text-white">Difficulty Snapshot</p>
          <div className="mt-3 space-y-2">
            {data.metrics.dsaByDifficulty.map((item) => (
              <div
                key={item.difficulty}
                className="rounded-lg border border-slate-300/10 bg-slate-900/35 px-3 py-2 text-sm"
              >
                <p className="font-semibold text-slate-100">{item.difficulty}</p>
                <p className="text-xs text-slate-300">
                  {item.completed}/{item.total} completed
                </p>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>
    </main>
  );
}
