"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuth } from "@/lib/auth/server";
import { getUser, updateUserOnboarding } from "@/lib/firestore/service";

const goalSchema = z.object({
  goalType: z.enum(["exam", "placement"]),
  examId: z.string().optional(),
  targetRole: z.string().optional(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Target date must be in YYYY-MM-DD format."),
  dailyStudyTime: z.coerce.number().min(1).max(16),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]),
});

export async function updateGoalAction(formData: FormData) {
  const session = await requireAuth();
  const user = await getUser(session.uid);
  if (!user) {
    throw new Error("User profile not found.");
  }

  const fallbackTargetDate = user.targetDate ?? new Date().toISOString().slice(0, 10);
  const fallbackDailyHours = user.dailyStudyTime ?? 2;
  const fallbackLevel = user.level ?? "Beginner";
  const fallbackGoalType = user.goalType ?? "exam";

  const parsed = goalSchema.safeParse({
    goalType: (formData.get("goalType") as string | null) ?? fallbackGoalType,
    examId: (formData.get("examId") as string | null) ?? (user.examId ?? undefined),
    targetRole: (formData.get("targetRole") as string | null) ?? (user.targetRole ?? undefined),
    targetDate: (formData.get("targetDate") as string | null) ?? fallbackTargetDate,
    dailyStudyTime: (formData.get("dailyStudyTime") as string | null) ?? String(fallbackDailyHours),
    level: (formData.get("level") as string | null) ?? fallbackLevel,
  });

  if (!parsed.success) {
    const fields = Object.keys(parsed.error.flatten().fieldErrors).join(", ");
    throw new Error(`Invalid goal update input (${fields || "unknown fields"}).`);
  }

  const examId = parsed.data.goalType === "placement" ? null : (parsed.data.examId ?? "").trim();
  const targetRole =
    parsed.data.goalType === "placement"
      ? (parsed.data.targetRole ?? "").trim() || "Software Developer"
      : null;

  if (parsed.data.goalType === "exam" && !examId) {
    throw new Error("Please select an exam when switching to exam mode.");
  }

  await updateUserOnboarding(session.uid, {
    goalType: parsed.data.goalType,
    examId,
    targetRole,
    targetDate: parsed.data.targetDate,
    dailyStudyTime: parsed.data.dailyStudyTime,
    level: parsed.data.level,
  });

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  redirect("/dashboard");
}
