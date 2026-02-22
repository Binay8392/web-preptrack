import { updateGoalAction } from "@/actions/goal";
import { GoalSwitcherForm } from "@/components/settings/goal-switcher-form";
import { GlassCard } from "@/components/shared/glass-card";
import { requireAuth } from "@/lib/auth/server";
import { getUser, listExams } from "@/lib/firestore/service";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireAuth();
  const [user, exams] = await Promise.all([getUser(session.uid), listExams()]);

  if (!user) {
    return (
      <GlassCard>
        <p className="text-sm text-slate-300">Unable to load settings.</p>
      </GlassCard>
    );
  }

  return (
    <main className="space-y-4 pb-6">
      <GlassCard>
        <h1 className="text-2xl font-bold text-white">Goal Settings</h1>
        <p className="mt-2 text-sm text-slate-300">
          Switch between Exam Preparation and Placement Preparation anytime.
        </p>
      </GlassCard>

      <GlassCard>
        <form action={updateGoalAction} className="grid gap-5">
          <GoalSwitcherForm
            exams={exams}
            currentGoalType={user.goalType}
            currentExamId={user.examId}
            currentTargetRole={user.targetRole}
            currentTargetDate={user.targetDate}
            currentDailyStudyTime={user.dailyStudyTime}
            currentLevel={user.level}
          />
          <button
            type="submit"
            className="mt-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-300 px-5 py-3 text-sm font-bold text-slate-900 transition hover:opacity-90"
          >
            Save Goal Changes
          </button>
        </form>
      </GlassCard>
    </main>
  );
}
