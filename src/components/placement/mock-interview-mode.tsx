"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";

import { saveMockInterviewAction } from "@/actions/mock-interview";

interface MockInterviewModeProps {
  initialHistory: Array<{
    id: string;
    mode: "coding" | "hr" | "behavioral";
    score: number;
    feedbackSummary: string;
  }>;
}

const modePrompts: Record<"coding" | "hr" | "behavioral", string> = {
  coding: "Explain your approach for finding the longest substring without repeating characters.",
  hr: "Tell me about yourself and why you are interested in this role.",
  behavioral: "Describe a conflict in a team project and how you resolved it.",
};

export function MockInterviewMode({ initialHistory }: MockInterviewModeProps) {
  const [mode, setMode] = useState<"coding" | "hr" | "behavioral">("coding");
  const [answer, setAnswer] = useState("");
  const [seconds, setSeconds] = useState(12 * 60);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState(initialHistory);
  const [latest, setLatest] = useState<{ score: number; feedbackSummary: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (seconds === 0 && running) {
      setRunning(false);
    }
  }, [running, seconds]);

  const timerLabel = useMemo(() => {
    const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
    const ss = String(seconds % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }, [seconds]);

  const submitInterview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLatest(null);

    if (answer.trim().length < 20) {
      setError("Write at least 20 characters before submitting.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/ai/placement/mock-interview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode,
            answer,
          }),
        });

        if (!response.ok) {
          const body = (await response.json()) as { error?: string };
          throw new Error(body.error ?? "Unable to evaluate interview response.");
        }

        const body = (await response.json()) as { score: number; feedbackSummary: string };
        await saveMockInterviewAction({
          mode,
          score: body.score,
          feedbackSummary: body.feedbackSummary,
        });

        setLatest(body);
        setHistory((prev) => [
          {
            id: `local-${Date.now()}`,
            mode,
            score: body.score,
            feedbackSummary: body.feedbackSummary,
          },
          ...prev,
        ]);
        setAnswer("");
        setSeconds(12 * 60);
        setRunning(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Interview evaluation failed.");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[180px_1fr_auto] sm:items-center">
        <select
          value={mode}
          onChange={(event) => setMode(event.target.value as "coding" | "hr" | "behavioral")}
          className="rounded-lg border border-slate-300/20 bg-slate-900/45 px-3 py-2 text-sm"
        >
          <option value="coding">Coding Mock</option>
          <option value="hr">HR Mock</option>
          <option value="behavioral">Behavioral Mock</option>
        </select>
        <p className="text-sm text-slate-300">{modePrompts[mode]}</p>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Timer</p>
          <p className="text-xl font-bold text-cyan-100">{timerLabel}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setRunning((prev) => !prev)}
          className="rounded-lg border border-cyan-200/35 bg-cyan-300/15 px-3 py-2 text-xs font-semibold text-cyan-100"
        >
          {running ? "Pause Timer" : "Start Timer"}
        </button>
        <button
          type="button"
          onClick={() => {
            setRunning(false);
            setSeconds(12 * 60);
          }}
          className="rounded-lg border border-slate-300/20 bg-slate-500/15 px-3 py-2 text-xs font-semibold text-slate-200"
        >
          Reset Timer
        </button>
      </div>

      <form onSubmit={submitInterview} className="space-y-3">
        <textarea
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          placeholder="Write your mock interview response here..."
          className="min-h-36 w-full rounded-xl border border-slate-300/20 bg-slate-900/45 px-4 py-3 text-sm outline-none ring-cyan-300/40 focus:ring-2"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-300 px-4 py-2 text-sm font-bold text-slate-900 disabled:opacity-70"
        >
          {isPending ? "Evaluating..." : "Submit for AI Feedback"}
        </button>
      </form>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      {latest ? (
        <div className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 p-3 text-sm">
          <p className="font-semibold text-emerald-200">Score: {latest.score}/100</p>
          <p className="mt-1 text-slate-200">{latest.feedbackSummary}</p>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-sm font-semibold text-white">Recent Mock Interview Feedback</p>
        {history.length ? (
          history.slice(0, 5).map((item, index) => (
            <div key={`${item.id}-${index}`} className="rounded-lg border border-slate-300/15 bg-slate-900/25 p-3 text-sm">
              <p className="text-xs uppercase tracking-[0.12em] text-cyan-100/80">
                {item.mode} · {item.score}/100
              </p>
              <p className="mt-1 text-slate-200">{item.feedbackSummary}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-300">No mock interview records yet.</p>
        )}
      </div>
    </div>
  );
}
