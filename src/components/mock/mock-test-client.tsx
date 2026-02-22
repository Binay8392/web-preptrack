"use client";

import { useMemo, useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";

import { saveMockTestAttemptAction } from "@/actions/mock-tests";
import { MockPerformanceChart } from "@/components/charts/mock-performance-chart";

interface Question {
  id: string;
  subject: string;
  question: string;
  options: string[];
  answerIndex: number;
}

interface PreviousAttempt {
  label: string;
  score: number;
}

interface MockTestClientProps {
  examId: string;
  examName: string;
  subjects: string[];
  previousAttempts: PreviousAttempt[];
  mode?: "exam" | "placement";
  defaultSegment?: "coding" | "aptitude";
}

export function MockTestClient({
  examId,
  examName,
  subjects,
  previousAttempts,
  mode = "exam",
  defaultSegment = "coding",
}: MockTestClientProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [difficulty, setDifficulty] = useState<"Beginner" | "Intermediate" | "Advanced">("Intermediate");
  const [segment, setSegment] = useState<"coding" | "aptitude">(defaultSegment);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [history, setHistory] = useState(previousAttempts);
  const [isGenerating, startGenerating] = useTransition();
  const [isSubmitting, startSubmitting] = useTransition();

  const unanswered = useMemo(
    () => questions.filter((question) => answers[question.id] === undefined).length,
    [questions, answers],
  );

  const generateTest = () => {
    setError(null);
    setMessage(null);
    startGenerating(async () => {
      try {
        const response = await fetch("/api/ai/mock-test", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            exam: examName,
            subjects:
              mode === "placement" && segment === "aptitude"
                ? ["Quantitative Aptitude", "Logical Reasoning", "Verbal Ability"]
                : subjects.length
                  ? subjects.slice(0, 4)
                  : ["Core Concepts"],
            difficulty,
            count: 10,
          }),
        });

        if (!response.ok) {
          const body = (await response.json()) as { error?: string };
          throw new Error(body.error ?? "Unable to generate mock test.");
        }

        const body = (await response.json()) as { questions: Question[] };
        setQuestions(body.questions ?? []);
        setAnswers({});
      } catch (err) {
        setError(err instanceof Error ? err.message : "Generation failed.");
      }
    });
  };

  const submitTest = () => {
    if (!questions.length) return;
    if (unanswered > 0) {
      setError(`Please answer all questions before submitting (${unanswered} remaining).`);
      return;
    }

    setError(null);
    setMessage(null);

    startSubmitting(async () => {
      const score = questions.reduce((sum, question) => {
        return sum + (answers[question.id] === question.answerIndex ? 1 : 0);
      }, 0);

      const perSubject = new Map<string, { total: number; correct: number }>();
      for (const question of questions) {
        const current = perSubject.get(question.subject) ?? { total: 0, correct: 0 };
        current.total += 1;
        if (answers[question.id] === question.answerIndex) current.correct += 1;
        perSubject.set(question.subject, current);
      }

      const weakSubjects = Array.from(perSubject.entries())
        .filter(([, item]) => item.correct / Math.max(item.total, 1) < 0.6)
        .map(([subject]) => subject);

      try {
        await saveMockTestAttemptAction({
          examId,
          score,
          totalQuestions: questions.length,
          weakSubjects,
          mode,
          segment,
        });

        const percent = Math.round((score / questions.length) * 100);
        setHistory((prev) => [...prev, { label: `T${prev.length + 1}`, score: percent }].slice(-12));
        setMessage(`Mock test submitted. Score: ${score}/${questions.length} (${percent}%).`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save test result.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        {mode === "placement" ? (
          <select
            value={segment}
            onChange={(event) => setSegment(event.target.value as "coding" | "aptitude")}
            className="rounded-lg border border-slate-300/20 bg-slate-900/45 px-3 py-2 text-sm"
          >
            <option value="coding">Coding Round</option>
            <option value="aptitude">Aptitude Round</option>
          </select>
        ) : null}
        <select
          value={difficulty}
          onChange={(event) => setDifficulty(event.target.value as "Beginner" | "Intermediate" | "Advanced")}
          className="rounded-lg border border-slate-300/20 bg-slate-900/45 px-3 py-2 text-sm"
        >
          <option>Beginner</option>
          <option>Intermediate</option>
          <option>Advanced</option>
        </select>
        <button
          type="button"
          onClick={generateTest}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 rounded-lg border border-cyan-200/35 bg-cyan-300/15 px-3 py-2 text-sm font-semibold text-cyan-100 disabled:opacity-70"
        >
          <RefreshCw className={`size-4 ${isGenerating ? "animate-spin" : ""}`} />
          {isGenerating ? "Generating..." : "Generate AI Mock Test"}
        </button>
      </div>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}

      {questions.length > 0 ? (
        <div className="space-y-5">
          {questions.map((question, index) => (
            <article key={question.id} className="rounded-xl border border-slate-300/15 bg-slate-900/25 p-4">
              <p className="mb-2 text-xs uppercase tracking-[0.14em] text-cyan-100/80">{question.subject}</p>
              <p className="text-sm font-medium text-slate-100">
                Q{index + 1}. {question.question}
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {question.options.map((option, optionIndex) => (
                  <label
                    key={`${question.id}-${optionIndex}`}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300/15 bg-slate-900/35 px-3 py-2 text-xs text-slate-200"
                  >
                    <input
                      type="radio"
                      name={question.id}
                      checked={answers[question.id] === optionIndex}
                      onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }))}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </article>
          ))}
          <button
            type="button"
            onClick={submitTest}
            disabled={isSubmitting}
            className="rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-300 px-5 py-3 text-sm font-bold text-slate-900 disabled:opacity-70"
          >
            {isSubmitting ? "Submitting..." : "Submit Mock Test"}
          </button>
        </div>
      ) : null}

      <div>
        <p className="mb-3 text-sm font-semibold text-white">Mock Test Performance</p>
        <MockPerformanceChart data={history} />
      </div>
    </div>
  );
}
