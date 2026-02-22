"use client";

import { useState } from "react";

import type { ExamDocument, PrepLevel } from "@/lib/types";

interface GoalSwitcherFormProps {
  exams: ExamDocument[];
  currentGoalType: "exam" | "placement";
  currentExamId: string | null;
  currentTargetRole: string | null;
  currentTargetDate: string | null;
  currentDailyStudyTime: number | null;
  currentLevel: PrepLevel | null;
}

export function GoalSwitcherForm({
  exams,
  currentGoalType,
  currentExamId,
  currentTargetRole,
  currentTargetDate,
  currentDailyStudyTime,
  currentLevel,
}: GoalSwitcherFormProps) {
  const [goalType, setGoalType] = useState<"exam" | "placement">(currentGoalType);

  return (
    <>
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-slate-100">Goal Type</span>
        <select
          name="goalType"
          value={goalType}
          onChange={(event) => setGoalType(event.target.value as "exam" | "placement")}
          className="rounded-xl border border-slate-300/20 bg-slate-900/45 px-4 py-3 text-sm"
        >
          <option value="exam">Exam Preparation</option>
          <option value="placement">Placement Preparation</option>
        </select>
      </label>

      {goalType === "exam" ? (
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-100">Exam</span>
          <select
            name="examId"
            defaultValue={currentExamId ?? ""}
            required
            className="rounded-xl border border-slate-300/20 bg-slate-900/45 px-4 py-3 text-sm"
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
            defaultValue={currentTargetRole ?? "Software Developer"}
            required
            className="rounded-xl border border-slate-300/20 bg-slate-900/45 px-4 py-3 text-sm"
          />
        </label>
      )}

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-slate-100">Target Date</span>
        <input
          type="date"
          name="targetDate"
          min={new Date().toISOString().slice(0, 10)}
          defaultValue={currentTargetDate ?? new Date().toISOString().slice(0, 10)}
          required
          className="rounded-xl border border-slate-300/20 bg-slate-900/45 px-4 py-3 text-sm"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-slate-100">Daily Study Hours</span>
        <input
          type="number"
          name="dailyStudyTime"
          min={1}
          max={16}
          defaultValue={currentDailyStudyTime ?? 2}
          required
          className="rounded-xl border border-slate-300/20 bg-slate-900/45 px-4 py-3 text-sm"
        />
      </label>

      <fieldset className="grid gap-2">
        <legend className="text-sm font-semibold text-slate-100">Current Level</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {(["Beginner", "Intermediate", "Advanced"] as const).map((level) => (
            <label key={level} className="cursor-pointer rounded-xl border border-slate-300/20 bg-slate-900/35 p-3">
              <input
                type="radio"
                name="level"
                value={level}
                required={level === "Beginner"}
                defaultChecked={(currentLevel ?? "Beginner") === level}
                className="mr-2"
              />
              <span className="text-sm">{level}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}
