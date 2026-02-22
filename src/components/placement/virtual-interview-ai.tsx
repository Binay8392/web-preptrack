"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, User } from "lucide-react";

import type { InterviewDifficulty, InterviewType } from "@/lib/types";

interface InterviewHistoryItem {
  id: string;
  type: InterviewType;
  difficulty: InterviewDifficulty;
  company: string | null;
  finalScore?: number | null;
  createdAt?: string;
}

interface VirtualInterviewAIProps {
  targetRole: string;
  history: InterviewHistoryItem[];
}

interface ChatMessage {
  role: "ai" | "user" | "system";
  content: string;
}

interface EvaluationResult {
  score: number;
  strengths: string;
  weaknesses: string;
  modelAnswer: string;
  followUp: string;
  finalScore: number | null;
}

export function VirtualInterviewAI({ targetRole, history }: VirtualInterviewAIProps) {
  const [interviewType, setInterviewType] = useState<InterviewType>("technical-dsa");
  const [difficulty, setDifficulty] = useState<InterviewDifficulty>("Medium");
  const [company, setCompany] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questionId, setQuestionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentTopic, setCurrentTopic] = useState("");
  const [answer, setAnswer] = useState("");
  const [followUpSeed, setFollowUpSeed] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "system",
      content:
        "Select interview mode, start interview, answer like a real round, and get AI scoring + feedback.",
    },
  ]);
  const [loadingStart, setLoadingStart] = useState(false);
  const [loadingEval, setLoadingEval] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EvaluationResult | null>(null);

  const progressPercent = useMemo(() => Math.min(100, (answer.trim().length / 700) * 100), [answer]);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  const startInterview = async (seedQuestion?: string) => {
    setLoadingStart(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/ai/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: interviewType,
          difficulty,
          company: company.trim() || undefined,
          sessionId: sessionId ?? undefined,
          seedQuestion,
          targetRole,
        }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Could not start interview.");
      }

      const body = (await response.json()) as {
        sessionId: string;
        questionId: string;
        question: string;
        topic: string;
      };
      setSessionId(body.sessionId);
      setQuestionId(body.questionId);
      setCurrentQuestion(body.question);
      setCurrentTopic(body.topic);
      setTimer(0);
      setTimerRunning(true);
      setMessages((prev) => [...prev, { role: "ai", content: body.question }]);
      setAnswer("");
      setFollowUpSeed(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Interview start failed.");
    } finally {
      setLoadingStart(false);
    }
  };

  const evaluateAnswer = async () => {
    if (!sessionId || !questionId || !currentQuestion) {
      setError("Start an interview question first.");
      return;
    }
    if (answer.trim().length < 15) {
      setError("Please write a more complete answer.");
      return;
    }

    setLoadingEval(true);
    setError(null);
    try {
      setMessages((prev) => [...prev, { role: "user", content: answer.trim() }]);
      const response = await fetch("/api/ai/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionId,
          answer: answer.trim(),
        }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Evaluation failed.");
      }

      const body = (await response.json()) as EvaluationResult;
      setResult(body);
      setFollowUpSeed(body.followUp);
      setTimerRunning(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: `Score ${body.score}/10\nStrengths: ${body.strengths}\nWeaknesses: ${body.weaknesses}`,
        },
      ]);
      setAnswer("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evaluation failed.");
    } finally {
      setLoadingEval(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-xl border border-slate-300/15 bg-slate-900/30 p-4 md:grid-cols-2 xl:grid-cols-5">
        <label className="grid gap-1 text-xs text-slate-300 xl:col-span-2">
          Interview Mode
          <select
            value={interviewType}
            onChange={(event) => setInterviewType(event.target.value as InterviewType)}
            className="rounded-lg border border-slate-300/20 bg-slate-900/45 px-3 py-2 text-sm"
          >
            <option value="technical-dsa">Technical (DSA)</option>
            <option value="core-cs">Core CS (OS, DBMS, CN)</option>
            <option value="hr-behavioral">HR / Behavioral</option>
            <option value="system-design">System Design</option>
            <option value="company-specific">Company-Specific</option>
          </select>
        </label>

        <label className="grid gap-1 text-xs text-slate-300">
          Difficulty
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value as InterviewDifficulty)}
            className="rounded-lg border border-slate-300/20 bg-slate-900/45 px-3 py-2 text-sm"
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </label>

        <label className="grid gap-1 text-xs text-slate-300">
          Target Company
          <input
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            placeholder="Google / Amazon / etc"
            className="rounded-lg border border-slate-300/20 bg-slate-900/45 px-3 py-2 text-sm"
          />
        </label>

        <div className="grid place-items-end">
          <button
            type="button"
            onClick={() => void startInterview()}
            disabled={loadingStart}
            className="w-full rounded-lg border border-cyan-200/35 bg-cyan-300/15 px-3 py-2 text-sm font-semibold text-cyan-100 disabled:opacity-70"
          >
            {loadingStart ? "Starting..." : "Start Interview"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <section className="rounded-xl border border-slate-300/15 bg-slate-900/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Virtual Interview Chat</p>
            <p className="text-xs text-slate-300">
              Topic: <span className="text-cyan-100">{currentTopic || "N/A"}</span>
            </p>
          </div>

          <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-xl border border-slate-300/10 bg-slate-900/35 p-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex items-start gap-2 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role !== "user" ? (
                  <div className="grid size-8 place-items-center rounded-full border border-cyan-300/35 bg-cyan-400/15">
                    <Bot className="size-4 text-cyan-100" />
                  </div>
                ) : null}
                <div
                  className={`max-w-[80%] whitespace-pre-line rounded-xl px-3 py-2 text-sm ${
                    message.role === "ai"
                      ? "border border-cyan-300/20 bg-cyan-400/10 text-cyan-50"
                      : message.role === "user"
                        ? "border border-emerald-300/20 bg-emerald-400/10 text-emerald-50"
                        : "border border-slate-300/15 bg-slate-800/60 text-slate-200"
                  }`}
                >
                  {message.content}
                </div>
                {message.role === "user" ? (
                  <div className="grid size-8 place-items-center rounded-full border border-emerald-300/35 bg-emerald-400/15">
                    <User className="size-4 text-emerald-100" />
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-2">
            <textarea
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="Type your interview answer..."
              className="min-h-32 w-full rounded-xl border border-slate-300/20 bg-slate-900/45 px-4 py-3 text-sm outline-none ring-cyan-300/40 focus:ring-2"
            />
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-700/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void evaluateAnswer()}
                disabled={loadingEval}
                className="rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-300 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-70"
              >
                {loadingEval ? "Evaluating..." : "Submit Answer"}
              </button>
              {followUpSeed ? (
                <button
                  type="button"
                  onClick={() => void startInterview(followUpSeed)}
                  disabled={loadingStart}
                  className="rounded-lg border border-slate-300/20 bg-slate-500/20 px-4 py-2 text-sm text-slate-100"
                >
                  Ask Follow-up
                </button>
              ) : null}
              <p className="text-xs text-slate-400">Timer: {timer}s</p>
            </div>
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl border border-slate-300/15 bg-slate-900/30 p-4">
            <p className="text-sm font-semibold text-white">AI Evaluation</p>
            {result ? (
              <div className="mt-3 space-y-2 text-sm">
                <div className="rounded-lg border border-emerald-300/25 bg-emerald-500/10 p-2 text-center">
                  <p className="text-xs uppercase tracking-[0.12em] text-emerald-200">Score Reveal</p>
                  <p className="animate-pulse text-3xl font-bold text-emerald-100">{result.score}/10</p>
                </div>
                <p className="text-slate-200">
                  <span className="font-semibold text-cyan-100">Strengths:</span> {result.strengths}
                </p>
                <p className="text-slate-200">
                  <span className="font-semibold text-cyan-100">Weaknesses:</span> {result.weaknesses}
                </p>
                <p className="text-slate-200">
                  <span className="font-semibold text-cyan-100">Model Answer:</span> {result.modelAnswer}
                </p>
                <p className="text-slate-200">
                  <span className="font-semibold text-cyan-100">Follow-up:</span> {result.followUp}
                </p>
                <p className="text-xs text-slate-400">
                  Session average score: {result.finalScore ?? "N/A"} / 10
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-300">
                Submit an answer to reveal strengths, weaknesses, model answer, and follow-up.
              </p>
            )}
          </section>

          <section className="rounded-xl border border-slate-300/15 bg-slate-900/30 p-4">
            <p className="text-sm font-semibold text-white">Interview History</p>
            <div className="mt-2 space-y-2 text-sm">
              {history.length ? (
                history.slice(0, 8).map((item) => (
                  <div key={item.id} className="rounded-lg border border-slate-300/10 bg-slate-800/50 p-2">
                    <p className="text-xs uppercase tracking-[0.12em] text-cyan-100">
                      {item.type} · {item.difficulty}
                    </p>
                    <p className="text-slate-200">{item.company || "General"}</p>
                    <p className="text-xs text-slate-400">
                      Final Score: {item.finalScore ?? "pending"} / 10
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-300">No interview sessions yet.</p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
