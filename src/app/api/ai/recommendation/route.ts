import { NextResponse } from "next/server";
import { z } from "zod";

import { getSession } from "@/lib/auth/server";
import { getGeminiClient, getGeminiModelName } from "@/lib/ai/gemini";
import { adminDb } from "@/lib/firebase/admin";
import { getUser } from "@/lib/firestore/service";

export const runtime = "nodejs";
export const maxDuration = 60;

const payloadSchema = z.object({
  exam: z.string().optional(),
  weakSubjects: z.array(z.string()).default([]),
  lastPerformance: z.number().min(0).max(100),
  studyTime: z.number().min(0),
});

function extractJson(text: string) {
  const cleaned = text.replace(/```json|```/gi, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) return cleaned;
  return cleaned.slice(firstBrace, lastBrace + 1);
}

function buildFallback(weakSubjects: string[]) {
  return {
    suggestion: "Focus on your weakest subject first and do one timed practice block.",
    prioritySubject: weakSubjects[0] ?? "General Revision",
    motivation: "Consistency compounds. Your streak is a real advantage.",
    plan: "Split your study time into 50-minute focus sessions with 10-minute breaks.",
  };
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUser(session.uid);
  if (!user) {
    return NextResponse.json({ error: "User profile not found." }, { status: 404 });
  }

  const body = await request.json();
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid input payload.",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const weakSubjects = parsed.data.weakSubjects
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  const exam = (parsed.data.exam ?? "").trim() || "Current Exam";

  const today = new Date().toISOString().slice(0, 10);
  const isFreeLimitExceeded =
    user.subscriptionType === "free" && user.lastAiRecommendationDate === today;
  if (isFreeLimitExceeded && user.lastAiRecommendation) {
    return NextResponse.json({
      suggestion: user.lastAiRecommendation,
      prioritySubject: weakSubjects[0] ?? "Revision",
      motivation: "Upgrade to Pro for unlimited AI recommendations.",
      plan: "Free plan daily limit reached. Review your current plan and continue with consistency.",
      limited: true,
    });
  }

  const gemini = getGeminiClient();
  if (!gemini) {
    const fallback = buildFallback(weakSubjects);
    return NextResponse.json({
      ...fallback,
      limited: false,
      fallback: true,
    });
  }

  const prompt = `
You are an academic performance strategist.
Return ONLY valid JSON with keys: suggestion, prioritySubject, motivation, plan.
Context:
- Exam: ${exam}
- Weak Subjects: ${weakSubjects.join(", ") || "None"}
- Last Performance: ${parsed.data.lastPerformance}%
- Daily Study Time: ${parsed.data.studyTime} hours

Guidelines:
- suggestion: one concise actionable recommendation.
- prioritySubject: single subject to prioritize.
- motivation: one short motivating sentence.
- plan: two-step tactical plan for today.
`;

  let responsePayload: {
    suggestion: string;
    prioritySubject: string;
    motivation: string;
    plan: string;
  };

  try {
    const model = gemini.getGenerativeModel({ model: getGeminiModelName() });
    const result = await model.generateContent(prompt);
    const text = extractJson(result.response.text().trim());
    responsePayload = JSON.parse(text);
  } catch {
    responsePayload = buildFallback(weakSubjects);
  }

  try {
    await adminDb()
      .collection("users")
      .doc(session.uid)
      .set(
        {
          lastAiRecommendationDate: today,
          lastAiRecommendation: responsePayload.suggestion,
        },
        { merge: true },
      );
  } catch {
    // Ignore persistence failures so the user still receives recommendation output.
  }

  return NextResponse.json({
    ...responsePayload,
    limited: false,
  });
}
