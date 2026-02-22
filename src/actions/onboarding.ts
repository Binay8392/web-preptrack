"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuth } from "@/lib/auth/server";
import { updateUserOnboarding } from "@/lib/firestore/service";

const onboardingSchema = z.object({
  goalType: z.enum(["exam", "placement"]),
  examId: z.string().optional(),
  targetRole: z.string().optional(),
  targetDate: z.string().min(1),
  dailyStudyTime: z.coerce.number().min(1).max(16),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]),
});

export async function submitOnboardingAction(formData: FormData) {
  const session = await requireAuth();
  const parsed = onboardingSchema.safeParse({
    goalType: formData.get("goalType"),
    examId: formData.get("examId"),
    targetRole: formData.get("targetRole"),
    targetDate: formData.get("targetDate"),
    dailyStudyTime: formData.get("dailyStudyTime"),
    level: formData.get("level"),
  });

  if (!parsed.success) {
    throw new Error("Invalid onboarding input.");
  }

  const examId = parsed.data.goalType === "placement" ? null : (parsed.data.examId ?? "").trim();
  const targetRole =
    parsed.data.goalType === "placement"
      ? (parsed.data.targetRole ?? "").trim() || "Software Developer"
      : null;

  if (parsed.data.goalType === "exam" && !examId) {
    throw new Error("Please select an exam for exam mode onboarding.");
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
  redirect("/dashboard");
}
