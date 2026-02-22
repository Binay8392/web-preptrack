import { NextResponse } from "next/server";
import { z } from "zod";

import { getGeminiClient } from "@/lib/ai/gemini";
import { getSession } from "@/lib/auth/server";
import {
  evaluateInterviewQuestion,
  getInterviewQuestion,
  getInterviewSession,
} from "@/lib/firestore/service";
import { getPlacementDashboardData } from "@/lib/placement-data";
import type { InterviewQuestionFeedback } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const payloadSchema = z.object({
  sessionId: z.string().min(1),
  questionId: z.string().min(1),
  answer: z.string().trim().min(15).max(5000),
});

function extractJson(text: string) {
  const cleaned = text.replace(/```json|```/gi, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) return cleaned;
  return cleaned.slice(firstBrace, lastBrace + 1);
}

function fallback(question: string): InterviewQuestionFeedback {
  return {
    score: 6,
    strengths: "Answer shows intent and basic structure.",
    weaknesses: "Needs deeper technical reasoning, concrete examples, and clearer trade-off discussion.",
    modelAnswer:
      "Start with assumptions, outline approach options, compare trade-offs, then present a clear solution with complexity and edge-case handling.",
    followUp: `What is one key trade-off in your answer to: "${question.slice(0, 80)}..."?`,
  };
}

export async function POST(request: Request) {
  const auth = await getSession();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload.", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const session = await getInterviewSession(auth.uid, parsed.data.sessionId);
  if (!session) return NextResponse.json({ error: "Interview session not found." }, { status: 404 });

  const question = await getInterviewQuestion(parsed.data.sessionId, parsed.data.questionId);
  if (!question) return NextResponse.json({ error: "Interview question not found." }, { status: 404 });

  let feedback = fallback(question.question);
  const gemini = getGeminiClient();
  if (gemini) {
    const prompt = `
You are evaluating a candidate's interview answer.

Question: ${question.question}
Candidate Answer: ${parsed.data.answer}

Provide:
- Score out of 10
- Strengths
- Weaknesses
- Improved Model Answer
- One Follow-up Question

Return ONLY valid JSON:
{
  "score": 7,
  "strengths": "...",
  "weaknesses": "...",
  "modelAnswer": "...",
  "followUp": "..."
}
`;

    try {
      const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const text = extractJson(result.response.text().trim());
      const parsedJson = JSON.parse(text) as Partial<InterviewQuestionFeedback>;
      feedback = {
        score: Math.max(0, Math.min(10, Number(parsedJson.score ?? feedback.score))),
        strengths: String(parsedJson.strengths ?? feedback.strengths),
        weaknesses: String(parsedJson.weaknesses ?? feedback.weaknesses),
        modelAnswer: String(parsedJson.modelAnswer ?? feedback.modelAnswer),
        followUp: String(parsedJson.followUp ?? feedback.followUp),
      };
    } catch {
      // Keep fallback.
    }
  }

  const finalScore = await evaluateInterviewQuestion(parsed.data.sessionId, parsed.data.questionId, {
    userAnswer: parsed.data.answer,
    feedback,
  });

  // Recompute placement readiness immediately after interview evaluation.
  await getPlacementDashboardData(auth.uid);

  return NextResponse.json({
    score: feedback.score,
    strengths: feedback.strengths,
    weaknesses: feedback.weaknesses,
    modelAnswer: feedback.modelAnswer,
    followUp: feedback.followUp,
    finalScore,
  });
}
