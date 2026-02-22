"use client";

import { useMemo, useState } from "react";

import type { ExamDocument } from "@/lib/types";

interface OnboardingFormProps {
  exams: ExamDocument[];
}

export function OnboardingForm({ exams }: OnboardingFormProps) {
  const [goalType, setGoalType] = useState<"exam" | "placement">("exam");

  const helperText = useMemo(() => {
    if (goalType === "placement") {
      return "Placement mode enables DSA, aptitude, company tracker, mock interview, and AI placement mentor.";
    }
    return "Exam mode enables syllabus roadmap, exam countdown, and subject-wise readiness tracking.";
  }, [goalType]);

  return (
    <>
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-slate-100">Preparation Goal</span>
        <select
          name="goalType"
          value={goalType}
          onChange={(event) => setGoalType(event.target.value as "exam" | "placement")}
          required
          className="rounded-xl border border-slate-300/20 bg-slate-900/45 px-4 py-3 text-sm outline-none ring-cyan-300/40 focus:ring-2"
        >
          <option value="exam">Exam Preparation</option>
          <option value="placement">Placement Preparation</option>
        </select>
        <p className="text-xs text-cyan-100/80">{helperText}</p>
      </label>

      {goalType === "exam" ? (
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-100">Exam</span>
          <select
            name="examId"
            required
            className="rounded-xl border border-slate-300/20 bg-slate-900/45 px-4 py-3 text-sm outline-none ring-cyan-300/40 focus:ring-2"
          >
            <option value="">Select an exam</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.name} ({exam.category})
              </option>
            ))}
          </select>
        </label>
      ) : (
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-100">Target Role</span>
          <input
            type="text"
            name="targetRole"
            defaultValue="Software Developer"
            required
            className="rounded-xl border border-slate-300/20 bg-slate-900/45 px-4 py-3 text-sm outline-none ring-cyan-300/40 focus:ring-2"
          />
        </label>
      )}
    </>
  );
}
