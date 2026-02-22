"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuth } from "@/lib/auth/server";
import { createCommunityPost, getUser } from "@/lib/firestore/service";

const postSchema = z.object({
  type: z.enum(["job", "referral", "discussion"]).default("discussion"),
  content: z.string().trim().min(5).max(500),
});

export async function createPostAction(formData: FormData) {
  const session = await requireAuth();
  const parsed = postSchema.safeParse({
    type: formData.get("type"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    throw new Error("Post content should be 5-500 characters.");
  }

  const user = await getUser(session.uid);
  if (!user) {
    throw new Error("User record missing.");
  }

  await createCommunityPost({
    userId: session.uid,
    userName: user.name,
    userPhotoURL: user.photoURL,
    type: parsed.data.type,
    content: parsed.data.content,
  });

  revalidatePath("/community");
  revalidatePath("/dashboard");
}
