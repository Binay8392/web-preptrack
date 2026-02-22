"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

interface AIRecommendationCardProps {
  exam: string;
  weakSubjects: string[];
  lastPerformance: number;
  studyTime: number;
}

interface RecommendationResponse {
  suggestion: string;
  prioritySubject: string;
  motivation: string;
  plan: string;
  limited?: boolean;
}

export function AIRecommendationCard(props: AIRecommendationCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RecommendationResponse | null>(null);

  const weakSubjectsKey = props.weakSubjects.join("|");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/ai/recommendation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            exam: props.exam,
            weakSubjects: props.weakSubjects,
            lastPerformance: props.lastPerformance,
            studyTime: props.studyTime,
          }),
        });
        if (!response.ok) {
          const body = (await response.json()) as { error?: string };
          if (response.status === 401) {
            throw new Error("Session expired. Please sign in again.");
          }
          throw new Error(body.error ?? "Could not generate recommendation.");
        }
        const body = (await response.json()) as RecommendationResponse;
        if (!cancelled) setData(body);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Request failed.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [props.exam, props.lastPerformance, props.studyTime, weakSubjectsKey, props.weakSubjects]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-cyan-100">
        <Sparkles className="size-4" />
        <p className="text-xs font-semibold uppercase tracking-[0.18em]">AI Recommendation</p>
      </div>

      {loading ? <p className="text-sm text-slate-300">Generating personalized recommendation...</p> : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      {data ? (
        <div className="space-y-2 text-sm">
          <p className="text-slate-100">{data.suggestion}</p>
          <p className="text-slate-300">
            Priority subject: <span className="font-semibold text-cyan-100">{data.prioritySubject}</span>
          </p>
          <p className="text-slate-300">{data.plan}</p>
          <p className="text-emerald-200">{data.motivation}</p>
          {data.limited ? (
            <p className="text-xs text-amber-200">Free plan reached daily AI limit. Upgrade to Pro for unlimited use.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
