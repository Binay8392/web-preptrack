"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuth } from "@/lib/auth/server";
import { createMockInterviewRecord } from "@/lib/firestore/service";

const payloadSchema = z.object({
  mode: z.enum(["coding", "hr", "behavioral"]),
  score: z.number().int().min(0).max(100),
  feedbackSummary: z.string().min(1).max(1000),
});

export async function saveMockInterviewAction(payload: z.infer<typeof payloadSchema>) {
  const session = await requireAuth();
  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success) throw new Error("Invalid mock interview payload.");

  await createMockInterviewRecord(session.uid, parsed.data);
  revalidatePath("/mock-tests");
  revalidatePath("/dashboard");
  revalidatePath("/progress");
}
