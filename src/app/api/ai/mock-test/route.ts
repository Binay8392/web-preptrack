import { NextResponse } from "next/server";
import { z } from "zod";

import { getSession } from "@/lib/auth/server";
import { getGeminiClient, getGeminiModelName } from "@/lib/ai/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

const payloadSchema = z.object({
  exam: z.string().min(1),
  subjects: z.array(z.string()).default([]),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  count: z.number().int().min(5).max(20).default(10),
});

const questionSchema = z.object({
  id: z.string(),
  subject: z.string(),
  question: z.string(),
  options: z.array(z.string()).length(4),
  answerIndex: z.number().int().min(0).max(3),
});

const responseSchema = z.object({
  questions: z.array(questionSchema).min(1),
});

function extractJson(text: string) {
  const cleaned = text.replace(/```json|```/gi, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) return cleaned;
  return cleaned.slice(firstBrace, lastBrace + 1);
}

function fallbackQuestions(input: {
  subjects: string[];
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  count: number;
}) {
  const levelHint =
    input.difficulty === "Beginner"
      ? "basic concept understanding"
      : input.difficulty === "Intermediate"
        ? "applied reasoning with constraints"
        : "edge-case heavy and optimization-oriented";

  return Array.from({ length: input.count }).map((_, index) => {
    const subject = input.subjects[index % input.subjects.length] ?? "Core Concepts";
    const optionSeed = index + 3;
    return {
      id: `q${index + 1}`,
      subject,
      question: `(${input.difficulty}) ${subject}: Which option best matches a ${levelHint} approach for scenario #${index + 1}?`,
      options: [
        `Use brute force first, then document limits (${optionSeed} mins)`,
        `Select a pattern-based approach and explain trade-offs`,
        `Prioritize memory optimization regardless of constraints`,
        `Skip complexity analysis and focus only on syntax`,
      ],
      answerIndex: 1,
    };
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid payload.",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const normalizedSubjects = parsed.data.subjects
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 4);
  const subjects = normalizedSubjects.length ? normalizedSubjects : ["Core Concepts"];
  const fallbackResponse = {
    questions: fallbackQuestions({
      subjects,
      difficulty: parsed.data.difficulty,
      count: parsed.data.count,
    }),
    fallback: true,
  };

  const gemini = getGeminiClient();
  if (!gemini) {
    return NextResponse.json(fallbackResponse);
  }

  const model = gemini.getGenerativeModel({ model: getGeminiModelName() });
  const prompt = `
Generate ${parsed.data.count} multiple-choice questions for the ${parsed.data.exam} exam.
Focus subjects: ${subjects.join(", ")}.
Difficulty: ${parsed.data.difficulty}.

Return ONLY valid JSON:
{
  "questions": [
    {
      "id": "q1",
      "subject": "Subject Name",
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "answerIndex": 0
    }
  ]
}
`;

  try {
    const result = await model.generateContent(prompt);
    const text = extractJson(result.response.text().trim());
    const parsedJson = JSON.parse(text);
    const validated = responseSchema.safeParse(parsedJson);
    if (!validated.success) {
      return NextResponse.json(fallbackResponse);
    }
    return NextResponse.json(validated.data);
  } catch {
    return NextResponse.json(fallbackResponse);
  }
}
