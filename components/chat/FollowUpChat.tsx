"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isToolUIPart, getToolName } from "ai";
import type { ExecSummaryData, NumberCardData } from "@/lib/compute/types";

/**
 * Chat input under the restated table (see PLAN.md Flow C). The model answers
 * dataset-specific questions only via tool calls bound to the already-computed
 * `cards`/`execSummary` — it never sees raw numbers as free text it could
 * misremember or recompute. Tool calls are shown as a small "Looked up" note so
 * a dataset-grounded answer is visibly distinguished from general knowledge.
 */
export function FollowUpChat({
  cards,
  execSummary,
  periodLabels,
}: {
  cards: NumberCardData[];
  execSummary: ExecSummaryData | null;
  periodLabels: string[] | null;
}) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input }, { body: { cards, execSummary, periodLabels } });
    setInput("");
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="text-sm font-semibold text-foreground/60">Ask a follow-up question</p>

      {messages.length > 0 && (
        <div className="mt-3 flex flex-col gap-3">
          {messages.map((message) => (
            <div key={message.id} className="text-sm">
              <p className="font-medium text-foreground/60">
                {message.role === "user" ? "You" : "Answer"}
              </p>
              {message.parts.map((part, index) => {
                if (part.type === "text") {
                  return (
                    <p key={index} className="whitespace-pre-wrap text-foreground/90">
                      {part.text}
                    </p>
                  );
                }
                if (isToolUIPart(part) && part.state === "output-available") {
                  return (
                    <p key={index} className="mt-1 text-xs text-foreground/50">
                      Looked up: {getToolName(part)}
                    </p>
                  );
                }
                return null;
              })}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={status !== "ready"}
          placeholder="e.g. which week had the biggest drop?"
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={status !== "ready" || !input.trim()}
          className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          Ask
        </button>
      </form>

      {status === "error" && (
        <p className="mt-2 text-sm text-negative">Something went wrong. Please try again.</p>
      )}
    </div>
  );
}
