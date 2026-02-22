import { MindWellChat } from "@/components/mindwell/mindwell-chat";
import { GlassCard } from "@/components/shared/glass-card";

export const dynamic = "force-dynamic";

export default function MindWellPage() {
  return (
    <main className="space-y-4 pb-6">
      <GlassCard>
        <h1 className="text-2xl font-bold text-white">MindWell Assistant</h1>
        <p className="mt-2 text-sm text-slate-300">
          AI motivation and stress-management companion focused on productivity, clarity, and sustainable routines.
        </p>
      </GlassCard>

      <GlassCard>
        <MindWellChat />
      </GlassCard>
    </main>
  );
}
