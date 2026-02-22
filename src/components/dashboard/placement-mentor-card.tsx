"use client";

import { useEffect, useMemo, useState } from "react";
import { Cpu, Sparkles } from "lucide-react";

interface PlacementMentorCardProps {
  targetRole: string;
  weakDsaTopics: string[];
  dailyStudyTime: number;
  companyTargets: string[];
  mockInterviewScore: number;
}

interface PlacementMentorResponse {
  suggestion: string;
  priorityTopic: string;
  dailyPlan: string;
  interviewTip: string;
  companyAdvice: string;
  limited?: boolean;
}

export function PlacementMentorCard({
  targetRole,
  weakDsaTopics,
  dailyStudyTime,
  companyTargets,
  mockInterviewScore,
}: PlacementMentorCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PlacementMentorResponse | null>(null);

  const weakKey = useMemo(() => weakDsaTopics.join("|"), [weakDsaTopics]);
  const companyKey = useMemo(() => companyTargets.join("|"), [companyTargets]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/ai/placement", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetRole,
            weakDsaTopics,
            dailyStudyTime,
            companyTargets,
            mockInterviewScore,
          }),
        });

        if (!response.ok) {
          const body = (await response.json()) as { error?: string };
          if (response.status === 401) throw new Error("Session expired. Please sign in again.");
          throw new Error(body.error ?? "Unable to generate placement mentoring response.");
        }

        const body = (await response.json()) as PlacementMentorResponse;
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
  }, [
    companyKey,
    companyTargets,
    dailyStudyTime,
    mockInterviewScore,
    targetRole,
    weakDsaTopics,
    weakKey,
  ]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-cyan-100">
        <Sparkles className="size-4" />
        <p className="text-xs font-semibold uppercase tracking-[0.18em]">AI Placement Mentor</p>
      </div>

      {loading ? <p className="text-sm text-slate-300">Building your placement strategy...</p> : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      {data ? (
        <div className="space-y-2 text-sm">
          <p className="text-slate-100">{data.suggestion}</p>
          <p className="text-slate-300">
            Priority topic: <span className="font-semibold text-cyan-100">{data.priorityTopic}</span>
          </p>
          <p className="text-slate-300">{data.dailyPlan}</p>
          <p className="text-emerald-200">{data.interviewTip}</p>
          <p className="flex items-start gap-2 text-slate-300">
            <Cpu className="mt-0.5 size-4 shrink-0 text-cyan-200" />
            <span>{data.companyAdvice}</span>
          </p>
          {data.limited ? (
            <p className="text-xs text-amber-200">Free plan reached daily placement AI limit. Upgrade for unlimited.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
