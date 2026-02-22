import { NextResponse } from "next/server";
import { z } from "zod";

import { getSession } from "@/lib/auth/server";
import { getGeminiClient } from "@/lib/ai/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

const payloadSchema = z.object({
  message: z.string().min(1).max(1000),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  const gemini = getGeminiClient();
  if (!gemini) {
    return NextResponse.json({
      reply:
        "Take a 5-minute breathing break, then restart with a 25-minute focused sprint on one topic only.",
      fallback: true,
    });
  }

  const prompt = `
You are MindWell, a supportive student productivity assistant.
User message: "${parsed.data.message}"

Respond in <= 120 words.
Tone: calm, practical, optimistic.
Do not provide medical diagnosis.
Include one immediate action and one reflection prompt.
`;

  try {
    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    return NextResponse.json({
      reply: text,
    });
  } catch {
    return NextResponse.json({
      reply:
        "I could not reach AI right now. Take one 10-minute reset, then do a single 30-minute deep-focus block on your highest-priority topic.",
      fallback: true,
    });
  }
}
