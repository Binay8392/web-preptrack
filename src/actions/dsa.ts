"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuth } from "@/lib/auth/server";
import { toggleDsaTopicCompletion } from "@/lib/firestore/service";

const payloadSchema = z.object({
  topicId: z.string().min(1),
  completed: z.boolean(),
});

export async function toggleDsaTopicAction(payload: z.infer<typeof payloadSchema>) {
  const session = await requireAuth();
  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success) throw new Error("Invalid DSA toggle payload.");

  await toggleDsaTopicCompletion(session.uid, parsed.data.topicId, parsed.data.completed);
  revalidatePath("/dsa");
  revalidatePath("/dashboard");
}
