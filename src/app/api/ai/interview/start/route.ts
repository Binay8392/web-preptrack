import { NextResponse } from "next/server";
import { z } from "zod";

import { getGeminiClient, getGeminiModelName } from "@/lib/ai/gemini";
import { getSession } from "@/lib/auth/server";
import {
  createInterviewQuestion,
  createInterviewSession,
  getInterviewSession,
} from "@/lib/firestore/service";
import type { InterviewDifficulty, InterviewType } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const payloadSchema = z.object({
  type: z.enum([
    "technical-dsa",
    "core-cs",
    "hr-behavioral",
    "system-design",
    "company-specific",
  ]),
  difficulty: z.enum(["Easy", "Medium", "Hard"]).default("Medium"),
  company: z.string().trim().optional(),
  sessionId: z.string().optional(),
  seedQuestion: z.string().trim().optional(),
  targetRole: z.string().trim().default("Software Developer"),
});

function extractJson(text: string) {
  const cleaned = text.replace(/```json|```/gi, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) return cleaned;
  return cleaned.slice(firstBrace, lastBrace + 1);
}

function fallbackQuestion(input: {
  type: InterviewType;
  difficulty: InterviewDifficulty;
  company?: string;
}) {
  const map: Record<InterviewType, { topic: string; question: string }> = {
    "technical-dsa": {
      topic: "Dynamic Programming",
      question:
        "Given an array, design an O(n) or O(n log n) approach to find the maximum subarray sum with at most one deletion.",
    },
    "core-cs": {
      topic: "DBMS Transactions",
      question:
        "Explain isolation levels and discuss how phantom reads can occur in a high-concurrency reservation system.",
    },
    "hr-behavioral": {
      topic: "Conflict Resolution",
      question:
        "Describe a time you disagreed with a teammate on technical direction and how you resolved it with measurable outcome.",
    },
    "system-design": {
      topic: "Scalable Notification Service",
      question:
        "Design a notification service for millions of users supporting retries, prioritization, and multi-channel delivery.",
    },
    "company-specific": {
      topic: "Company-Focused Interview",
      question: `For ${input.company || "a top product company"}, explain how you would prepare for coding + behavioral rounds in 14 days and justify your prioritization.`,
    },
  };
  const chosen = map[input.type];
  return {
    question: chosen.question,
    topic: chosen.topic,
    difficulty: input.difficulty,
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

  let sessionId = parsed.data.sessionId;
  if (sessionId) {
    const existing = await getInterviewSession(auth.uid, sessionId);
    if (!existing) {
      return NextResponse.json({ error: "Interview session not found." }, { status: 404 });
    }
  } else {
    sessionId = await createInterviewSession(auth.uid, {
      type: parsed.data.type,
      difficulty: parsed.data.difficulty,
      company: parsed.data.company ?? null,
    });
  }

  let questionPayload = fallbackQuestion({
    type: parsed.data.type,
    difficulty: parsed.data.difficulty,
    company: parsed.data.company,
  });

  if (parsed.data.seedQuestion) {
    questionPayload = {
      question: parsed.data.seedQuestion,
      topic: "Follow-up",
      difficulty: parsed.data.difficulty,
    };
  } else {
    const gemini = getGeminiClient();
    if (gemini) {
      const prompt = `
Act as a senior interviewer at a top tech company.
Ask ONE challenging interview question for a ${parsed.data.targetRole} role.
Interview type: ${parsed.data.type}
Difficulty: ${parsed.data.difficulty}
Target company: ${parsed.data.company || "Not specified"}

Do NOT provide the answer.
Return ONLY valid JSON:
{
  "question": "...",
  "difficulty": "${parsed.data.difficulty}",
  "topic": "..."
}
`;

      try {
        const model = gemini.getGenerativeModel({ model: getGeminiModelName() });
        const result = await model.generateContent(prompt);
        const text = extractJson(result.response.text().trim());
        const parsedJson = JSON.parse(text) as {
          question?: string;
          difficulty?: InterviewDifficulty;
          topic?: string;
        };
        if (parsedJson.question?.trim()) {
          questionPayload = {
            question: parsedJson.question.trim(),
            difficulty: parsedJson.difficulty ?? parsed.data.difficulty,
            topic: parsedJson.topic?.trim() || questionPayload.topic,
          };
        }
      } catch {
        // Use fallback question payload.
      }
    }
  }

  const questionId = await createInterviewQuestion(auth.uid, sessionId, {
    question: questionPayload.question,
    topic: questionPayload.topic,
    difficulty: questionPayload.difficulty,
  });

  return NextResponse.json({
    sessionId,
    questionId,
    question: questionPayload.question,
    difficulty: questionPayload.difficulty,
    topic: questionPayload.topic,
  });
}
