"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuth } from "@/lib/auth/server";
import { createStudySession } from "@/lib/firestore/service";

const studySessionSchema = z.object({
  duration: z.number().int().min(1).max(24 * 60),
  subjectId: z.string().optional(),
  subjectName: z.string().optional(),
});

export async function logStudySessionAction(payload: z.infer<typeof studySessionSchema>) {
  const session = await requireAuth();
  const parsed = studySessionSchema.safeParse(payload);
  if (!parsed.success) throw new Error("Invalid study session payload.");

  await createStudySession(session.uid, parsed.data);
  revalidatePath("/dashboard");
  revalidatePath("/study-plan");
  revalidatePath("/progress");
}
