"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuth } from "@/lib/auth/server";
import { createMockTestAttempt } from "@/lib/firestore/service";

const mockAttemptSchema = z.object({
  examId: z.string().min(1),
  score: z.number().int().min(0),
  totalQuestions: z.number().int().min(1),
  weakSubjects: z.array(z.string()).default([]),
  mode: z.enum(["exam", "placement"]).default("exam"),
  segment: z.enum(["coding", "aptitude", "hr", "behavioral"]).default("coding"),
});

export async function saveMockTestAttemptAction(payload: z.infer<typeof mockAttemptSchema>) {
  const session = await requireAuth();
  const parsed = mockAttemptSchema.safeParse(payload);
  if (!parsed.success) throw new Error("Invalid mock test payload.");

  await createMockTestAttempt(session.uid, parsed.data);
  revalidatePath("/dashboard");
  revalidatePath("/mock-tests");
  revalidatePath("/progress");
}
