"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { logStudySessionAction } from "@/actions/study";
import { formatMinutes } from "@/lib/utils";

interface SubjectOption {
  id: string;
  name: string;
}

interface StudyTimerProps {
  subjects: SubjectOption[];
}

export function StudyTimer({ subjects }: StudyTimerProps) {
  const availableSubjects = useMemo(
    () => (subjects.length ? subjects : [{ id: "general", name: "General Study" }]),
    [subjects],
  );
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [subjectId, setSubjectId] = useState(availableSubjects[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [isRunning]);

  const minutes = useMemo(() => Math.max(1, Math.round(seconds / 60)), [seconds]);

  const selectedSubject = useMemo(
    () => availableSubjects.find((item) => item.id === subjectId),
    [availableSubjects, subjectId],
  );

  const persistSession = () => {
    if (seconds < 60) {
      setError("Study at least 1 minute before saving a session.");
      return;
    }

    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        await logStudySessionAction({
          duration: minutes,
          subjectId: selectedSubject?.id,
          subjectName: selectedSubject?.name,
        });
        setSuccess(`Saved ${formatMinutes(minutes)} study session.`);
        setSeconds(0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to save session.");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-300/80">Study Timer</p>
          <p className="font-heading mt-1 text-4xl font-bold text-white">
            {String(Math.floor(seconds / 3600)).padStart(2, "0")}:
            {String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}:
            {String(seconds % 60).padStart(2, "0")}
          </p>
        </div>
      </div>

      <label className="grid gap-1 text-xs text-slate-300">
        Subject
        <select
          value={subjectId}
          onChange={(event) => setSubjectId(event.target.value)}
          className="rounded-lg border border-slate-300/20 bg-slate-900/45 px-3 py-2 text-sm"
        >
          {availableSubjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setIsRunning((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-lg border border-cyan-200/35 bg-cyan-400/15 px-3 py-2 text-xs font-semibold text-cyan-100"
        >
          {isRunning ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          {isRunning ? "Pause" : "Start"}
        </button>
        <button
          type="button"
          onClick={persistSession}
          disabled={isPending}
          className="rounded-lg border border-emerald-200/35 bg-emerald-300/15 px-3 py-2 text-xs font-semibold text-emerald-100 disabled:opacity-70"
        >
          {isPending ? "Saving..." : "Save Session"}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsRunning(false);
            setSeconds(0);
            setError(null);
            setSuccess(null);
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300/20 bg-slate-500/15 px-3 py-2 text-xs font-semibold text-slate-100"
        >
          <RotateCcw className="size-3.5" />
          Reset
        </button>
      </div>

      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
      {success ? <p className="text-xs text-emerald-300">{success}</p> : null}
    </div>
  );
}
