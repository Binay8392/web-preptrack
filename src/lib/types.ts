export type SubscriptionType = "free" | "pro";
export type PrepLevel = "Beginner" | "Intermediate" | "Advanced";
export type GoalType = "exam" | "placement";
export type CommunityPostType = "job" | "referral" | "discussion";
export type InterviewType = "technical-dsa" | "core-cs" | "hr-behavioral" | "system-design" | "company-specific";
export type InterviewDifficulty = "Easy" | "Medium" | "Hard";

export interface UserDocument {
  name: string;
  email: string;
  photoURL: string;
  goalType: GoalType;
  examId: string | null;
  targetRole: string | null;
  targetDate: string | null;
  dailyStudyTime: number | null;
  placementTrack: boolean;
  readinessScore: number;
  level: PrepLevel | null;
  streak: number;
  xp: number;
  subscriptionType: SubscriptionType;
  onboardingCompleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  lastAiRecommendationDate?: string;
  lastAiRecommendation?: string;
  lastPlacementAiDate?: string;
  lastPlacementAiRecommendation?: string;
}

export interface ExamDocument {
  id: string;
  name: string;
  category: string;
  durationMonths: number;
}

export interface TopicDocument {
  id: string;
  name: string;
  weightage: number;
  difficulty: string;
}

export interface SubjectDocument {
  id: string;
  name: string;
  difficulty: string;
  topics: TopicDocument[];
}

export interface StudySessionDocument {
  id: string;
  userId: string;
  date: string;
  duration: number;
  subjectId?: string;
  subjectName?: string;
  createdAt?: Date;
}

export interface MockTestAttemptDocument {
  id: string;
  userId: string;
  examId: string;
  score: number;
  totalQuestions: number;
  weakSubjects: string[];
  mode?: "exam" | "placement";
  segment?: "coding" | "aptitude" | "hr" | "behavioral";
  createdAt?: Date;
}

export interface CommunityPostDocument {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL: string;
  type: CommunityPostType;
  content: string;
  createdAt?: Date;
}

export interface DsaTopicDocument {
  id: string;
  userId: string;
  name: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  completed: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CompanyApplicationDocument {
  id: string;
  userId: string;
  companyName: string;
  role: string;
  status: "applied" | "oa" | "interview" | "offer" | "rejected";
  round: string;
  result: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MockInterviewDocument {
  id: string;
  userId: string;
  mode: "coding" | "hr" | "behavioral";
  score: number;
  feedbackSummary: string;
  createdAt?: Date;
}

export interface DashboardMetrics {
  countdownDays: number;
  totalTopics: number;
  requiredHours: number;
  studiedHours: number;
  readinessScore: number;
  todayTargetMinutes: number;
  weeklyTargetHours: number;
  weakSubjects: string[];
  subjectProgress: Array<{
    id: string;
    name: string;
    progress: number;
    studiedHours: number;
    requiredHours: number;
  }>;
  weeklyHours: Array<{
    weekLabel: string;
    hours: number;
  }>;
  mockPerformance: Array<{
    label: string;
    score: number;
  }>;
}

export interface PlacementDashboardMetrics {
  readinessScore: number;
  dsaCompletion: number;
  aptitudeProgress: number;
  mockInterviewScore: number;
  virtualInterviewScore: number;
  studyConsistency: number;
  streak: number;
  dailyTargetMinutes: number;
  weakDsaTopics: string[];
  weakInterviewTopics: string[];
  weeklyHours: Array<{
    weekLabel: string;
    hours: number;
  }>;
  dsaByDifficulty: Array<{
    difficulty: "Easy" | "Medium" | "Hard";
    total: number;
    completed: number;
  }>;
}

export interface InterviewSessionDocument {
  id: string;
  userId: string;
  type: InterviewType;
  difficulty: InterviewDifficulty;
  company: string | null;
  createdAt?: Date;
  finalScore?: number | null;
}

export interface InterviewQuestionFeedback {
  score: number;
  strengths: string;
  weaknesses: string;
  modelAnswer: string;
  followUp: string;
}

export interface InterviewQuestionDocument {
  id: string;
  question: string;
  topic: string;
  difficulty: InterviewDifficulty;
  userAnswer?: string | null;
  aiFeedback?: InterviewQuestionFeedback | null;
  score?: number | null;
  createdAt?: Date;
}
