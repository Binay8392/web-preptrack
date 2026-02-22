import { NextResponse } from "next/server";
import { z } from "zod";

import { getGeminiClient } from "@/lib/ai/gemini";
import { getSession } from "@/lib/auth/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const payloadSchema = z.object({
  mode: z.enum(["coding", "hr", "behavioral"]),
  answer: z.string().min(20).max(3000),
});

function extractJson(text: string) {
  const cleaned = text.replace(/```json|```/gi, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) return cleaned;
  return cleaned.slice(firstBrace, lastBrace + 1);
}

function fallback(mode: "coding" | "hr" | "behavioral") {
  if (mode === "coding") {
    return {
      score: 68,
      feedbackSummary:
        "Good approach framing. Improve edge-case handling and explicitly analyze time/space complexity.",
    };
  }
  if (mode === "hr") {
    return {
      score: 72,
      feedbackSummary:
        "Clear communication and intent. Add concrete examples using impact metrics for stronger answers.",
    };
  }
  return {
    score: 70,
    feedbackSummary:
      "Response is structured. Improve STAR depth by adding conflict details, decisions, and measurable outcomes.",
  };
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload.", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const gemini = getGeminiClient();
  if (!gemini) return NextResponse.json(fallback(parsed.data.mode));

  const prompt = `
You are an interview evaluator.
Mode: ${parsed.data.mode}
Candidate answer:
${parsed.data.answer}

Return ONLY valid JSON:
{
  "score": 0-100,
  "feedbackSummary": "2 concise sentences with strengths and improvements"
}
`;

  try {
    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = extractJson(result.response.text().trim());
    const response = JSON.parse(text) as { score: number; feedbackSummary: string };
    return NextResponse.json({
      score: Math.max(0, Math.min(100, Math.round(Number(response.score) || 0))),
      feedbackSummary: String(response.feedbackSummary || "No feedback generated."),
    });
  } catch {
    return NextResponse.json(fallback(parsed.data.mode));
  }
}
