"use client";

import { FormEvent, useState, useTransition } from "react";
import { SendHorizonal } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const starter: ChatMessage = {
  role: "assistant",
  content:
    "I am MindWell. Share what feels difficult right now and I will help you create a focused, low-stress next step.",
};

export function MindWellChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([starter]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;

    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");

    startTransition(async () => {
      try {
        const response = await fetch("/api/ai/mindwell", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: text }),
        });
        if (!response.ok) {
          const body = (await response.json()) as { error?: string };
          if (response.status === 401) {
            throw new Error("Session expired. Please sign in again.");
          }
          throw new Error(body.error ?? "MindWell request failed.");
        }
        const body = (await response.json()) as { reply: string };
        setMessages((prev) => [...prev, { role: "assistant", content: body.reply }]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Request failed.");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="max-h-[460px] space-y-3 overflow-y-auto rounded-xl border border-slate-300/15 bg-slate-900/30 p-4">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`max-w-[90%] rounded-xl px-4 py-3 text-sm ${
              message.role === "user"
                ? "ml-auto bg-cyan-400/20 text-cyan-100"
                : "bg-slate-700/40 text-slate-100 border border-slate-300/10"
            }`}
          >
            {message.content}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="I feel distracted and anxious about my exam..."
          className="flex-1 rounded-xl border border-slate-300/20 bg-slate-900/45 px-4 py-3 text-sm outline-none ring-cyan-300/40 focus:ring-2"
        />
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-300 px-4 py-3 text-sm font-semibold text-slate-900 disabled:opacity-70"
        >
          <SendHorizonal className="size-4" />
          {isPending ? "Sending..." : "Send"}
        </button>
      </form>

      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
