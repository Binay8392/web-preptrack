import "server-only";

import { Timestamp } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase/admin";
import type {
  CommunityPostDocument,
  CompanyApplicationDocument,
  CommunityPostType,
  DsaTopicDocument,
  ExamDocument,
  InterviewDifficulty,
  InterviewQuestionDocument,
  InterviewQuestionFeedback,
  InterviewSessionDocument,
  InterviewType,
  MockInterviewDocument,
  MockTestAttemptDocument,
  StudySessionDocument,
  SubjectDocument,
  UserDocument,
} from "@/lib/types";

function toDate(value: unknown): Date | undefined {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    return new Date(value);
  }
  return undefined;
}

const defaultDsaTopics: Array<{
  name: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
}> = [
  { name: "Arrays and Strings", category: "Fundamentals", difficulty: "Easy" },
  { name: "Hashing and Maps", category: "Fundamentals", difficulty: "Easy" },
  { name: "Linked List", category: "Data Structures", difficulty: "Easy" },
  { name: "Binary Search", category: "Algorithms", difficulty: "Easy" },
  { name: "Sliding Window", category: "Algorithms", difficulty: "Medium" },
  { name: "Two Pointers", category: "Algorithms", difficulty: "Medium" },
  { name: "Trees and BST", category: "Data Structures", difficulty: "Medium" },
  { name: "Heaps and Priority Queue", category: "Data Structures", difficulty: "Medium" },
  { name: "Dynamic Programming", category: "Algorithms", difficulty: "Hard" },
  { name: "Graphs", category: "Algorithms", difficulty: "Hard" },
];

export async function ensureUserDocument(input: {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
}) {
  const db = adminDb();
  const ref = db.collection("users").doc(input.uid);
  const snap = await ref.get();

  if (!snap.exists) {
    const now = Timestamp.now();
    const payload = {
      name: input.name,
      email: input.email,
      photoURL: input.photoURL,
      goalType: "exam",
      examId: null,
      targetRole: null,
      targetDate: null,
      dailyStudyTime: null,
      placementTrack: false,
      readinessScore: 0,
      level: null,
      streak: 0,
      xp: 0,
      subscriptionType: "free",
      onboardingCompleted: false,
      createdAt: now,
      updatedAt: now,
    };
    await ref.set(payload);
    return payload;
  }

  const existing = snap.data() as UserDocument;
  await ref.set(
    {
      name: input.name ?? existing.name,
      email: input.email ?? existing.email,
      photoURL: input.photoURL ?? existing.photoURL,
      goalType: existing.goalType ?? "exam",
      targetRole: existing.targetRole ?? null,
      placementTrack: Boolean(existing.placementTrack),
      readinessScore: Number(existing.readinessScore ?? 0),
      updatedAt: Timestamp.now(),
    },
    { merge: true },
  );
  return existing;
}

export async function getUser(uid: string) {
  const snap = await adminDb().collection("users").doc(uid).get();
  if (!snap.exists) return null;
  const data = snap.data() as UserDocument;
  return {
    uid,
    ...data,
    goalType: data.goalType ?? "exam",
    targetRole: data.targetRole ?? null,
    placementTrack: Boolean(data.placementTrack),
    readinessScore: Number(data.readinessScore ?? 0),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export async function updateUserOnboarding(
  uid: string,
  payload: {
    goalType: "exam" | "placement";
    examId: string | null;
    targetRole: string | null;
    targetDate: string;
    dailyStudyTime: number;
    level: string;
  },
) {
  await adminDb()
    .collection("users")
    .doc(uid)
    .set(
      {
        goalType: payload.goalType,
        examId: payload.examId,
        targetRole: payload.targetRole,
        targetDate: payload.targetDate,
        dailyStudyTime: payload.dailyStudyTime,
        placementTrack: payload.goalType === "placement",
        level: payload.level,
        onboardingCompleted: true,
        updatedAt: Timestamp.now(),
      },
      { merge: true },
    );
}

export async function listExams() {
  const snap = await adminDb().collection("exams").orderBy("name", "asc").get();
  return snap.docs.map((doc) => {
    const data = doc.data() as Omit<ExamDocument, "id">;
    return { id: doc.id, ...data };
  });
}

export async function getExamWithSyllabus(examId: string) {
  const db = adminDb();
  const examRef = db.collection("exams").doc(examId);
  const examSnap = await examRef.get();
  if (!examSnap.exists) return null;

  const examData = examSnap.data() as Omit<ExamDocument, "id">;
  const subjectSnaps = await examRef.collection("subjects").orderBy("name").get();

  const subjects = await Promise.all(
    subjectSnaps.docs.map(async (subjectDoc) => {
      const topicSnaps = await subjectDoc.ref.collection("topics").orderBy("name").get();
      const topics = topicSnaps.docs.map((topicDoc) => {
        const topicData = topicDoc.data();
        return {
          id: topicDoc.id,
          name: String(topicData.name ?? "Untitled Topic"),
          weightage: Number(topicData.weightage ?? 1),
          difficulty: String(topicData.difficulty ?? "Medium"),
        };
      });

      return {
        id: subjectDoc.id,
        name: String(subjectDoc.get("name") ?? "Untitled Subject"),
        difficulty: String(subjectDoc.get("difficulty") ?? "Medium"),
        topics,
      } satisfies SubjectDocument;
    }),
  );

  return {
    exam: {
      id: examSnap.id,
      ...examData,
    } satisfies ExamDocument,
    subjects,
  };
}

export async function listStudySessions(uid: string, limit = 300) {
  let snap;
  try {
    snap = await adminDb()
      .collection("studySessions")
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.includes("requires an index")) throw error;

    // Fallback path so UI remains usable until composite index is created.
    snap = await adminDb().collection("studySessions").where("userId", "==", uid).limit(limit).get();
  }

  return snap.docs
    .map((doc) => {
    const data = doc.data() as Omit<StudySessionDocument, "id">;
    return {
      id: doc.id,
      ...data,
      createdAt: toDate(data.createdAt),
    };
    })
    .sort((a, b) => {
      const aTime = a.createdAt?.getTime() ?? 0;
      const bTime = b.createdAt?.getTime() ?? 0;
      return bTime - aTime;
    });
}

export async function createStudySession(
  uid: string,
  payload: {
    duration: number;
    subjectId?: string;
    subjectName?: string;
  },
) {
  const db = adminDb();
  const today = new Date().toISOString().slice(0, 10);

  await db.collection("studySessions").add({
    userId: uid,
    date: today,
    duration: payload.duration,
    subjectId: payload.subjectId ?? null,
    subjectName: payload.subjectName ?? null,
    createdAt: Timestamp.now(),
  });

  const recentSnap = await db
    .collection("studySessions")
    .where("userId", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(10)
    .get();

  const dates = recentSnap.docs
    .map((doc) => String(doc.get("date") ?? ""))
    .filter(Boolean);
  const todayCount = dates.filter((date) => date === today).length;

  const todayDate = new Date(today);
  const yesterday = new Date(todayDate);
  yesterday.setDate(todayDate.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const userSnap = await db.collection("users").doc(uid).get();
  const currentStreak = Number(userSnap.get("streak") ?? 0);

  let streak = Math.max(1, currentStreak);
  if (todayCount <= 1) {
    const previousDay = dates.find((item) => item !== today);
    if (!previousDay) streak = 1;
    else if (previousDay === yesterdayStr) streak = Math.max(1, currentStreak + 1);
    else streak = 1;
  }

  const userRef = db.collection("users").doc(uid);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    const currentXp = Number(snap.get("xp") ?? 0);
    tx.set(
      userRef,
      {
        streak,
        xp: currentXp + Math.round(payload.duration * 1.8),
        updatedAt: Timestamp.now(),
      },
      { merge: true },
    );
  });
}

export async function listMockTestAttempts(uid: string, limit = 24) {
  let snap;
  try {
    snap = await adminDb()
      .collection("mockTests")
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.includes("requires an index")) throw error;

    // Fallback path so UI remains usable until composite index is created.
    snap = await adminDb().collection("mockTests").where("userId", "==", uid).limit(limit).get();
  }

  return snap.docs
    .map((doc) => {
    const data = doc.data() as Omit<MockTestAttemptDocument, "id">;
    return {
      id: doc.id,
      ...data,
      createdAt: toDate(data.createdAt),
    };
    })
    .sort((a, b) => {
      const aTime = a.createdAt?.getTime() ?? 0;
      const bTime = b.createdAt?.getTime() ?? 0;
      return bTime - aTime;
    });
}

export async function createMockTestAttempt(
  uid: string,
  payload: {
    examId: string;
    score: number;
    totalQuestions: number;
    weakSubjects: string[];
    mode?: "exam" | "placement";
    segment?: "coding" | "aptitude" | "hr" | "behavioral";
  },
) {
  await adminDb().collection("mockTests").add({
    userId: uid,
    examId: payload.examId,
    score: payload.score,
    totalQuestions: payload.totalQuestions,
    weakSubjects: payload.weakSubjects,
    mode: payload.mode ?? "exam",
    segment: payload.segment ?? "coding",
    createdAt: Timestamp.now(),
  });
}

export async function listCommunityPosts(limit = 40) {
  const snap = await adminDb()
    .collection("posts")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((doc) => {
    const data = doc.data() as Partial<Omit<CommunityPostDocument, "id">>;
    return {
      id: doc.id,
      userId: String(data.userId ?? ""),
      userName: String(data.userName ?? "Anonymous"),
      userPhotoURL: String(data.userPhotoURL ?? ""),
      type: (data.type ?? "discussion") as CommunityPostType,
      content: String(data.content ?? ""),
      createdAt: toDate(data.createdAt),
    };
  });
}

export async function createCommunityPost(
  payload: Pick<CommunityPostDocument, "userId" | "userName" | "userPhotoURL" | "content"> & {
    type?: CommunityPostType;
  },
) {
  await adminDb().collection("posts").add({
    ...payload,
    type: payload.type ?? "discussion",
    createdAt: Timestamp.now(),
  });
}

export async function listTopUsers(limit = 10) {
  const snap = await adminDb()
    .collection("users")
    .orderBy("xp", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((doc) => {
    const data = doc.data() as UserDocument;
    return {
      uid: doc.id,
      name: data.name,
      photoURL: data.photoURL,
      xp: data.xp,
      streak: data.streak,
    };
  });
}

export async function listOrSeedDsaTopics(uid: string) {
  const db = adminDb();
  const ref = db.collection("users").doc(uid).collection("dsaTopics");
  const existing = await ref.orderBy("name", "asc").get();

  if (existing.empty) {
    const batch = db.batch();
    for (const topic of defaultDsaTopics) {
      const topicRef = ref.doc();
      batch.set(topicRef, {
        userId: uid,
        name: topic.name,
        category: topic.category,
        difficulty: topic.difficulty,
        completed: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }
    await batch.commit();
  }

  const snapshot = await ref.orderBy("name", "asc").get();
  return snapshot.docs.map((doc) => {
    const data = doc.data() as Omit<DsaTopicDocument, "id">;
    return {
      id: doc.id,
      ...data,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    };
  });
}

export async function toggleDsaTopicCompletion(uid: string, topicId: string, completed: boolean) {
  await adminDb()
    .collection("users")
    .doc(uid)
    .collection("dsaTopics")
    .doc(topicId)
    .set(
      {
        completed,
        updatedAt: Timestamp.now(),
      },
      { merge: true },
    );
}

export async function listCompanyApplications(uid: string, limit = 120) {
  let snap;
  try {
    snap = await adminDb()
      .collection("companyApplications")
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.includes("requires an index")) throw error;
    snap = await adminDb().collection("companyApplications").where("userId", "==", uid).limit(limit).get();
  }

  return snap.docs
    .map((doc) => {
      const data = doc.data() as Omit<CompanyApplicationDocument, "id">;
      return {
        id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
      };
    })
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
}

export async function createCompanyApplication(
  uid: string,
  payload: {
    companyName: string;
    role: string;
    status: "applied" | "oa" | "interview" | "offer" | "rejected";
    round: string;
    result: string;
  },
) {
  await adminDb().collection("companyApplications").add({
    userId: uid,
    companyName: payload.companyName,
    role: payload.role,
    status: payload.status,
    round: payload.round,
    result: payload.result,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

export async function listMockInterviews(uid: string, limit = 50) {
  let snap;
  try {
    snap = await adminDb()
      .collection("mockInterviews")
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.includes("requires an index")) throw error;
    snap = await adminDb().collection("mockInterviews").where("userId", "==", uid).limit(limit).get();
  }

  return snap.docs
    .map((doc) => {
      const data = doc.data() as Omit<MockInterviewDocument, "id">;
      return {
        id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt),
      };
    })
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
}

export async function createMockInterviewRecord(
  uid: string,
  payload: {
    mode: "coding" | "hr" | "behavioral";
    score: number;
    feedbackSummary: string;
  },
) {
  await adminDb().collection("mockInterviews").add({
    userId: uid,
    mode: payload.mode,
    score: payload.score,
    feedbackSummary: payload.feedbackSummary,
    createdAt: Timestamp.now(),
  });
}

export async function updateUserReadinessScore(uid: string, readinessScore: number) {
  await adminDb()
    .collection("users")
    .doc(uid)
    .set(
      {
        readinessScore,
        updatedAt: Timestamp.now(),
      },
      { merge: true },
    );
}

export async function createInterviewSession(
  uid: string,
  payload: {
    type: InterviewType;
    difficulty: InterviewDifficulty;
    company?: string | null;
  },
) {
  const ref = await adminDb().collection("interviewSessions").add({
    userId: uid,
    type: payload.type,
    difficulty: payload.difficulty,
    company: payload.company ?? null,
    createdAt: Timestamp.now(),
    finalScore: null,
  });
  return ref.id;
}

export async function getInterviewSession(uid: string, sessionId: string) {
  const doc = await adminDb().collection("interviewSessions").doc(sessionId).get();
  if (!doc.exists) return null;
  const data = doc.data() as Omit<InterviewSessionDocument, "id">;
  if (data.userId !== uid) return null;
  return {
    id: doc.id,
    ...data,
    createdAt: toDate(data.createdAt),
  } satisfies InterviewSessionDocument;
}

export async function createInterviewQuestion(
  uid: string,
  sessionId: string,
  payload: {
    question: string;
    topic: string;
    difficulty: InterviewDifficulty;
  },
) {
  const ref = await adminDb()
    .collection("interviewSessions")
    .doc(sessionId)
    .collection("questions")
    .add({
      userId: uid,
      question: payload.question,
      topic: payload.topic,
      difficulty: payload.difficulty,
      userAnswer: null,
      aiFeedback: null,
      score: null,
      createdAt: Timestamp.now(),
    });
  return ref.id;
}

export async function getInterviewQuestion(
  sessionId: string,
  questionId: string,
) {
  const doc = await adminDb()
    .collection("interviewSessions")
    .doc(sessionId)
    .collection("questions")
    .doc(questionId)
    .get();
  if (!doc.exists) return null;
  const data = doc.data() as Omit<InterviewQuestionDocument, "id">;
  return {
    id: doc.id,
    ...data,
    createdAt: toDate(data.createdAt),
  } satisfies InterviewQuestionDocument;
}

export async function evaluateInterviewQuestion(
  sessionId: string,
  questionId: string,
  payload: {
    userAnswer: string;
    feedback: InterviewQuestionFeedback;
  },
) {
  const questionRef = adminDb()
    .collection("interviewSessions")
    .doc(sessionId)
    .collection("questions")
    .doc(questionId);

  await questionRef.set(
    {
      userAnswer: payload.userAnswer,
      aiFeedback: payload.feedback,
      score: payload.feedback.score,
    },
    { merge: true },
  );

  const questionsSnap = await adminDb()
    .collection("interviewSessions")
    .doc(sessionId)
    .collection("questions")
    .where("score", "!=", null)
    .get();

  const scores = questionsSnap.docs
    .map((doc) => Number(doc.get("score")))
    .filter((score) => !Number.isNaN(score));
  const average = scores.length
    ? Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2))
    : null;

  await adminDb()
    .collection("interviewSessions")
    .doc(sessionId)
    .set(
      {
        finalScore: average,
      },
      { merge: true },
    );

  return average;
}

export async function getInterviewSessionWithQuestions(uid: string, sessionId: string) {
  const session = await getInterviewSession(uid, sessionId);
  if (!session) return null;

  const questionsSnap = await adminDb()
    .collection("interviewSessions")
    .doc(sessionId)
    .collection("questions")
    .orderBy("createdAt", "asc")
    .get();

  const questions = questionsSnap.docs.map((doc) => {
    const data = doc.data() as Omit<InterviewQuestionDocument, "id">;
    return {
      id: doc.id,
      ...data,
      createdAt: toDate(data.createdAt),
    } satisfies InterviewQuestionDocument;
  });

  return { session, questions };
}

export async function listInterviewSessions(uid: string, limit = 40) {
  let snap;
  try {
    snap = await adminDb()
      .collection("interviewSessions")
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.includes("requires an index")) throw error;
    snap = await adminDb().collection("interviewSessions").where("userId", "==", uid).limit(limit).get();
  }

  return snap.docs
    .map((doc) => {
      const data = doc.data() as Omit<InterviewSessionDocument, "id">;
      return {
        id: doc.id,
        ...data,
        createdAt: toDate(data.createdAt),
      } satisfies InterviewSessionDocument;
    })
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
}

export async function listInterviewQuestionsByUser(uid: string, limit = 200) {
  let snap;
  try {
    snap = await adminDb()
      .collectionGroup("questions")
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.includes("requires an index") && !message.includes("FAILED_PRECONDITION")) throw error;

    // Fallback path: fetch per interview session so dashboard remains usable before index creation.
    const sessions = await listInterviewSessions(uid, 50);
    const questionSnaps = await Promise.all(
      sessions.map((session) =>
        adminDb().collection("interviewSessions").doc(session.id).collection("questions").limit(limit).get(),
      ),
    );

    return questionSnaps
      .flatMap((questionsSnap) => questionsSnap.docs)
      .map((doc) => {
        const data = doc.data() as Omit<InterviewQuestionDocument, "id"> & { userId?: string };
        return {
          id: doc.id,
          question: data.question,
          topic: data.topic,
          difficulty: data.difficulty,
          userAnswer: data.userAnswer,
          aiFeedback: data.aiFeedback,
          score: data.score,
          createdAt: toDate(data.createdAt),
        } satisfies InterviewQuestionDocument;
      })
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))
      .slice(0, limit);
  }

  return snap.docs
    .map((doc) => {
      const data = doc.data() as Omit<InterviewQuestionDocument, "id"> & { userId?: string };
      return {
        id: doc.id,
        question: data.question,
        topic: data.topic,
        difficulty: data.difficulty,
        userAnswer: data.userAnswer,
        aiFeedback: data.aiFeedback,
        score: data.score,
        createdAt: toDate(data.createdAt),
      } satisfies InterviewQuestionDocument;
    })
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
}
