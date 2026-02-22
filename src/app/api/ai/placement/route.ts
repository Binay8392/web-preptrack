import { NextResponse } from "next/server";
import { z } from "zod";

import { getGeminiClient } from "@/lib/ai/gemini";
import { getSession } from "@/lib/auth/server";
import { adminDb } from "@/lib/firebase/admin";
import { getUser } from "@/lib/firestore/service";

export const runtime = "nodejs";
export const maxDuration = 60;

const payloadSchema = z.object({
  targetRole: z.string().min(1),
  weakDsaTopics: z.array(z.string()).default([]),
  dailyStudyTime: z.number().min(0),
  companyTargets: z.array(z.string()).default([]),
  mockInterviewScore: z.number().min(0).max(100).default(0),
});

function extractJson(text: string) {
  const cleaned = text.replace(/```json|```/gi, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) return cleaned;
  return cleaned.slice(firstBrace, lastBrace + 1);
}

function fallback(weakDsaTopics: string[]) {
  return {
    suggestion: "Prioritize one weak DSA pattern and solve 3 timed problems before moving to aptitude.",
    priorityTopic: weakDsaTopics[0] ?? "Dynamic Programming",
    dailyPlan: "1) 60 mins DSA patterns 2) 45 mins aptitude set 3) 30 mins CS core revision 4) 15 mins recap.",
    interviewTip: "Practice concise thought narration while solving; interviewers score communication heavily.",
    companyAdvice: "Pick 3 target companies and map common rounds, timelines, and required problem patterns.",
  };
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUser(session.uid);
  if (!user) return NextResponse.json({ error: "User profile missing." }, { status: 404 });
  if (user.goalType !== "placement") {
    return NextResponse.json({ error: "Placement mentor is available only in placement mode." }, { status: 400 });
  }

  const body = await request.json();
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload.", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const freeLimitReached = user.subscriptionType === "free" && user.lastPlacementAiDate === today;
  if (freeLimitReached && user.lastPlacementAiRecommendation) {
    return NextResponse.json({
      ...fallback(parsed.data.weakDsaTopics),
      suggestion: user.lastPlacementAiRecommendation,
      limited: true,
    });
  }

  const gemini = getGeminiClient();
  if (!gemini) {
    return NextResponse.json({
      ...fallback(parsed.data.weakDsaTopics),
      limited: false,
      fallback: true,
    });
  }

  const prompt = `
You are a placement mentor for software engineering roles.
Return ONLY valid JSON with keys: suggestion, priorityTopic, dailyPlan, interviewTip, companyAdvice.

Context:
- Target role: ${parsed.data.targetRole}
- Weak DSA topics: ${parsed.data.weakDsaTopics.join(", ") || "None"}
- Daily study time: ${parsed.data.dailyStudyTime} hours
- Target companies: ${parsed.data.companyTargets.join(", ") || "None"}
- Mock interview score: ${parsed.data.mockInterviewScore}

Keep each value concise and practical.
`;

  let responsePayload = fallback(parsed.data.weakDsaTopics);
  try {
    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = extractJson(result.response.text().trim());
    responsePayload = {
      ...responsePayload,
      ...JSON.parse(text),
    };
  } catch {
    // Keep fallback payload.
  }

  try {
    await adminDb()
      .collection("users")
      .doc(session.uid)
      .set(
        {
          lastPlacementAiDate: today,
          lastPlacementAiRecommendation: responsePayload.suggestion,
        },
        { merge: true },
      );
  } catch {
    // Do not fail API if persistence fails.
  }

  return NextResponse.json({
    ...responsePayload,
    limited: false,
  });
}
