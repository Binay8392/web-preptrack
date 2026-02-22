"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuth } from "@/lib/auth/server";
import { createCompanyApplication } from "@/lib/firestore/service";

const applicationSchema = z.object({
  companyName: z.string().trim().min(2).max(120),
  role: z.string().trim().min(2).max(120),
  status: z.enum(["applied", "oa", "interview", "offer", "rejected"]),
  round: z.string().trim().min(1).max(120),
  result: z.string().trim().max(120).default("pending"),
});

export async function createCompanyApplicationAction(formData: FormData) {
  const session = await requireAuth();
  const parsed = applicationSchema.safeParse({
    companyName: formData.get("companyName"),
    role: formData.get("role"),
    status: formData.get("status"),
    round: formData.get("round"),
    result: formData.get("result"),
  });

  if (!parsed.success) throw new Error("Invalid company application payload.");

  await createCompanyApplication(session.uid, parsed.data);
  revalidatePath("/company-tracker");
  revalidatePath("/dashboard");
}
