import "server-only";

import { eachWeekOfInterval, endOfWeek, format, startOfWeek, subWeeks } from "date-fns";

import {
  getUser,
  listCompanyApplications,
  listInterviewQuestionsByUser,
  listInterviewSessions,
  listMockInterviews,
  listMockTestAttempts,
  listOrSeedDsaTopics,
  listStudySessions,
  updateUserReadinessScore,
} from "@/lib/firestore/service";
import type { PlacementDashboardMetrics } from "@/lib/types";

function calcWeeklyHours(
  sessions: Array<{
    duration: number;
    createdAt?: Date;
  }>,
) {
  const weekRange = eachWeekOfInterval({
    start: startOfWeek(subWeeks(new Date(), 5), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 }),
  });

  return weekRange.map((weekStart) => {
    const label = format(weekStart, "dd MMM");
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const hours =
      sessions
        .filter((session) => {
          if (!session.createdAt) return false;
          return session.createdAt >= weekStart && session.createdAt <= weekEnd;
        })
        .reduce((sum, session) => sum + session.duration, 0) / 60;

    return {
      weekLabel: label,
      hours: Number(hours.toFixed(1)),
    };
  });
}

export async function getPlacementDashboardData(uid: string) {
  const user = await getUser(uid);
  if (!user || user.goalType !== "placement") return null;

  const [dsaTopics, sessions, mockTests, mockInterviews, companyApplications, interviewSessions, interviewQuestions] =
    await Promise.all([
    listOrSeedDsaTopics(uid),
    listStudySessions(uid, 300),
    listMockTestAttempts(uid, 80),
    listMockInterviews(uid, 40),
    listCompanyApplications(uid, 80),
    listInterviewSessions(uid, 40),
    listInterviewQuestionsByUser(uid, 220),
  ]);

  const dsaCompleted = dsaTopics.filter((topic) => topic.completed).length;
  const dsaCompletion = dsaTopics.length ? Math.round((dsaCompleted / dsaTopics.length) * 100) : 0;

  const aptitudeTests = mockTests.filter(
    (test) => test.mode === "placement" && (test.segment === "aptitude" || test.segment === "coding"),
  );
  const aptitudeProgress = Math.min(100, aptitudeTests.length * 12);

  const mockInterviewScore = mockInterviews.length
    ? Math.round(mockInterviews.reduce((sum, interview) => sum + interview.score, 0) / mockInterviews.length)
    : 0;

  const virtualInterviewScore = interviewQuestions.length
    ? Math.round(
        (interviewQuestions.reduce((sum, item) => sum + Number(item.score ?? 0), 0) /
          interviewQuestions.length) *
          10,
      )
    : 0;

  const blendedInterviewScore = interviewQuestions.length
    ? Math.round(virtualInterviewScore * 0.75 + mockInterviewScore * 0.25)
    : mockInterviewScore;

  const studyConsistency = Math.min(100, user.streak * 12);
  const readinessScore = Math.round(
    dsaCompletion * 0.32 + aptitudeProgress * 0.2 + blendedInterviewScore * 0.33 + studyConsistency * 0.15,
  );

  if (readinessScore !== user.readinessScore) {
    await updateUserReadinessScore(uid, readinessScore);
  }

  const dailyTargetMinutes = Math.max(
    60,
    Math.round((user.dailyStudyTime ?? 2) * 60 + (100 - readinessScore) * 0.45),
  );

  const weakDsaTopics = dsaTopics
    .filter((topic) => !topic.completed)
    .sort((a, b) => {
      const weight = { Hard: 3, Medium: 2, Easy: 1 };
      return weight[b.difficulty] - weight[a.difficulty];
    })
    .slice(0, 3)
    .map((topic) => topic.name);

  const weakInterviewTopicMap = new Map<string, { sum: number; count: number }>();
  for (const question of interviewQuestions) {
    const topic = question.topic || "General";
    const score = Number(question.score ?? 0);
    const existing = weakInterviewTopicMap.get(topic) ?? { sum: 0, count: 0 };
    weakInterviewTopicMap.set(topic, { sum: existing.sum + score, count: existing.count + 1 });
  }

  const weakInterviewTopics = Array.from(weakInterviewTopicMap.entries())
    .map(([topic, scoreData]) => ({
      topic,
      avg: scoreData.count ? scoreData.sum / scoreData.count : 10,
    }))
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 3)
    .map((item) => item.topic);

  const dsaByDifficulty = (["Easy", "Medium", "Hard"] as const).map((difficulty) => {
    const group = dsaTopics.filter((topic) => topic.difficulty === difficulty);
    return {
      difficulty,
      total: group.length,
      completed: group.filter((topic) => topic.completed).length,
    };
  });

  const metrics: PlacementDashboardMetrics = {
    readinessScore,
    dsaCompletion,
    aptitudeProgress,
    mockInterviewScore: blendedInterviewScore,
    virtualInterviewScore,
    studyConsistency,
    streak: user.streak,
    dailyTargetMinutes,
    weakDsaTopics,
    weakInterviewTopics,
    weeklyHours: calcWeeklyHours(sessions),
    dsaByDifficulty,
  };

  return {
    user: {
      ...user,
      readinessScore,
    },
    sessions,
    dsaTopics,
    mockTests,
    mockInterviews,
    companyApplications,
    interviewSessions,
    interviewQuestions,
    metrics,
  };
}
