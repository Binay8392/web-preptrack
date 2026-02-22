import "server-only";

import { buildDashboardMetrics } from "@/lib/calculations";
import { getUser, getExamWithSyllabus, listMockTestAttempts, listStudySessions } from "@/lib/firestore/service";

export async function getDashboardData(uid: string) {
  const user = await getUser(uid);
  if (!user || user.goalType === "placement" || !user.examId) return null;

  const [examBundle, sessions, mockTests] = await Promise.all([
    getExamWithSyllabus(user.examId),
    listStudySessions(uid, 300),
    listMockTestAttempts(uid, 40),
  ]);

  if (!examBundle) return null;

  const metrics = buildDashboardMetrics({
    user,
    subjects: examBundle.subjects,
    sessions,
    mockTests,
  });

  return {
    user,
    exam: examBundle.exam,
    subjects: examBundle.subjects,
    sessions,
    mockTests,
    metrics,
  };
}
