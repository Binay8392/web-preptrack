"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, CircleDashed } from "lucide-react";

import { toggleDsaTopicAction } from "@/actions/dsa";
import type { DsaTopicDocument } from "@/lib/types";

interface DsaTrackerProps {
  topics: DsaTopicDocument[];
}

const difficultyStyle: Record<string, string> = {
  Easy: "text-emerald-200",
  Medium: "text-amber-200",
  Hard: "text-rose-200",
};

export function DsaTracker({ topics }: DsaTrackerProps) {
  const [state, setState] = useState(topics);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const progress = useMemo(() => {
    if (!state.length) return 0;
    return Math.round((state.filter((topic) => topic.completed).length / state.length) * 100);
  }, [state]);

  const toggleTopic = (topicId: string, completed: boolean) => {
    setError(null);
    setState((prev) =>
      prev.map((topic) => (topic.id === topicId ? { ...topic, completed } : topic)),
    );

    startTransition(async () => {
      try {
        await toggleDsaTopicAction({
          topicId,
          completed,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to update DSA topic.");
        setState(topics);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-white">DSA Progress: {progress}%</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-900/55">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {state.map((topic) => (
          <label
            key={topic.id}
            className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-300/15 bg-slate-900/30 px-3 py-2 text-sm"
          >
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={topic.completed}
                onChange={(event) => toggleTopic(topic.id, event.target.checked)}
                disabled={isPending}
              />
              <span className="text-slate-100">{topic.name}</span>
            </span>
            <span className={`text-xs font-semibold ${difficultyStyle[topic.difficulty] ?? "text-slate-300"}`}>
              {topic.difficulty}
            </span>
          </label>
        ))}
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-300">
        {progress >= 100 ? (
          <>
            <CheckCircle2 className="size-4 text-emerald-200" />
            All tracked DSA topics completed.
          </>
        ) : (
          <>
            <CircleDashed className="size-4 text-cyan-200" />
            Keep problem-solving streak active for daily readiness boost.
          </>
        )}
      </div>
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
