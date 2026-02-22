import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/server";
import { getUser } from "@/lib/firestore/service";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await getUser(session.uid);

  const onboardingMissing = !user?.onboardingCompleted || !user.targetDate || !user.dailyStudyTime;
  const examMissing = user?.goalType !== "placement" && !user?.examId;
  const placementRoleMissing = user?.goalType === "placement" && !user?.targetRole;

  if (onboardingMissing || examMissing || placementRoleMissing) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}
