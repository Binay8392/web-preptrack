import { redirect } from "next/navigation";

import { Sidebar } from "@/components/app/sidebar";
import { requireAuth } from "@/lib/auth/server";
import { getUser } from "@/lib/firestore/service";

export const dynamic = "force-dynamic";

export default async function OsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireAuth();
  const user = await getUser(session.uid);

  if (!user) redirect("/login");
  const onboardingMissing = !user.onboardingCompleted || !user.targetDate || !user.dailyStudyTime;
  const examMissing = user.goalType !== "placement" && !user.examId;
  const placementRoleMissing = user.goalType === "placement" && !user.targetRole;

  if (onboardingMissing || examMissing || placementRoleMissing) {
    redirect("/onboarding");
  }

  return (
    <div
      className={`page-shell mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 gap-4 p-4 lg:grid-cols-[280px_minmax(0,1fr)] ${
        user.goalType === "placement" ? "placement-shell" : ""
      }`}
    >
      <Sidebar name={user.name} photoURL={user.photoURL} xp={user.xp} goalType={user.goalType} />
      <div>{children}</div>
    </div>
  );
}
