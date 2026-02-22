import { eachWeekOfInterval, endOfWeek, format, startOfWeek, subWeeks } from "date-fns";

import type {
  DashboardMetrics,
  MockTestAttemptDocument,
  StudySessionDocument,
  SubjectDocument,
  UserDocument,
} from "@/lib/types";

const difficultyMap: Record<string, number> = {
  easy: 1,
  medium: 1.2,
  hard: 1.45,
};

function normalizeDifficulty(value: string) {
  return value.trim().toLowerCase();
}

function scoreFromAttempts(mockTests: MockTestAttemptDocument[]) {
  if (!mockTests.length) return 0;
  const avg =
    mockTests.reduce((sum, test) => sum + (test.score / Math.max(test.totalQuestions, 1)) * 100, 0) /
    mockTests.length;
  return Math.round(avg);
}

export function buildDashboardMetrics(input: {
  user: UserDocument;
  subjects: SubjectDocument[];
  sessions: StudySessionDocument[];
  mockTests: MockTestAttemptDocument[];
}): DashboardMetrics {
  const now = new Date();
  const target = input.user.targetDate ? new Date(input.user.targetDate) : null;
  const countdownDays = target
    ? Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const totalTopics = input.subjects.reduce((sum, subject) => sum + subject.topics.length, 0);
  const studiedMinutes = input.sessions.reduce((sum, session) => sum + session.duration, 0);
  const studiedHours = Number((studiedMinutes / 60).toFixed(1));

  const subjectProgress = input.subjects.map((subject) => {
    const requiredHours = Math.max(
      2,
      subject.topics.reduce((sum, topic) => {
        const difficultyScore = difficultyMap[normalizeDifficulty(topic.difficulty)] ?? 1.15;
        return sum + (topic.weightage * 0.75 + 2.2) * difficultyScore;
      }, 0),
    );

    const studied = input.sessions
      .filter((session) => session.subjectId === subject.id)
      .reduce((sum, session) => sum + session.duration / 60, 0);

    return {
      id: subject.id,
      name: subject.name,
      progress: Math.min(100, Math.round((studied / requiredHours) * 100)),
      studiedHours: Number(studied.toFixed(1)),
      requiredHours: Number(requiredHours.toFixed(1)),
    };
  });

  const requiredHours = Number(
    subjectProgress.reduce((sum, subject) => sum + subject.requiredHours, 0).toFixed(1),
  );
  const completionScore = requiredHours ? Math.min(100, Math.round((studiedHours / requiredHours) * 100)) : 0;
  const mockScore = scoreFromAttempts(input.mockTests);
  const streakScore = Math.min(100, input.user.streak * 6);

  const readinessScore = Math.round(completionScore * 0.5 + mockScore * 0.35 + streakScore * 0.15);

  const todayTargetMinutes = Math.max(
    45,
    Math.round((input.user.dailyStudyTime ?? 2) * 60 + (100 - completionScore) * 0.3),
  );

  const totalRemainingHours = Math.max(0, requiredHours - studiedHours);
  const weeksLeft = Math.max(1, Math.ceil(Math.max(countdownDays, 1) / 7));
  const weeklyTargetHours = Number((totalRemainingHours / weeksLeft).toFixed(1));

  const weakSubjects = [...subjectProgress]
    .sort((a, b) => a.progress - b.progress)
    .slice(0, 2)
    .map((subject) => subject.name);

  const weekRange = eachWeekOfInterval({
    start: startOfWeek(subWeeks(new Date(), 5), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 }),
  });

  const weeklyHours = weekRange.map((weekStart) => {
    const label = format(weekStart, "dd MMM");
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const hours =
      input.sessions
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

  const mockPerformance = [...input.mockTests]
    .reverse()
    .slice(-8)
    .map((item, index) => ({
      label: `T${index + 1}`,
      score: Math.round((item.score / Math.max(item.totalQuestions, 1)) * 100),
    }));

  return {
    countdownDays,
    totalTopics,
    requiredHours,
    studiedHours,
    readinessScore,
    todayTargetMinutes,
    weeklyTargetHours,
    weakSubjects,
    subjectProgress,
    weeklyHours,
    mockPerformance,
  };
}
