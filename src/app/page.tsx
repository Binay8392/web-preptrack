import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/server";
import { getUser } from "@/lib/firestore/service";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await requireAuth();

  const user = await getUser(session.uid);
  if (!user) {
    redirect("/onboarding");
  }

  const onboardingMissing = !user.onboardingCompleted || !user.targetDate || !user.dailyStudyTime;
  const examMissing = user.goalType !== "placement" && !user.examId;
  const placementRoleMissing = user.goalType === "placement" && !user.targetRole;

  if (onboardingMissing || examMissing || placementRoleMissing) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}
