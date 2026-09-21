"use client";

import { useState } from "react";
import type { SuggestionFeedback } from "@/lib/feedback/validation";
import type { SuggestedQuestion, SuggestionRuleId } from "@/lib/compute/suggest-questions";

type Rating = SuggestionFeedback["rating"];

interface RatingState {
  eventId: string;
  rating: Rating;
}

/**
 * Up to three questions this dataset can already answer, chosen by deterministic rules in
 * lib/compute/suggest-questions.ts (no LLM decides what is worth asking). Clicking one sends it
 * into the same follow-up chat, which answers from precomputed values only. Each suggestion can
 * be rated; a rating records only the rule id + rating (see lib/feedback/schema.sql).
 */
export function SuggestedQuestions({
  suggestions,
  disabled,
  onAsk,
}: {
  suggestions: SuggestedQuestion[];
  disabled: boolean;
  onAsk: (question: SuggestedQuestion) => void;
}) {
  const [ratings, setRatings] = useState<Partial<Record<SuggestionRuleId, RatingState>>>({});

  if (suggestions.length === 0) return null;

  function rate(ruleId: SuggestionRuleId, rating: Rating) {
    // Same anonymous id for the life of this suggestion, so changing a rating updates one row (last choice wins).
    const eventId = ratings[ruleId]?.eventId ?? crypto.randomUUID();
    setRatings((prev) => ({ ...prev, [ruleId]: { eventId, rating } }));
    // Fails soft: the UI already shows the chosen state, and a network error must never interrupt the PM.
    fetch("/api/suggestion-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, ruleId, rating }),
    }).catch(() => {});
  }

  return (
    <section aria-labelledby="suggested-questions-heading" className="rounded-xl border border-border bg-surface p-5">
      <h2 id="suggested-questions-heading" className="text-sm font-semibold text-foreground/60">
        Questions this data can answer
      </h2>
      <ul className="mt-3 flex flex-col gap-3">
        {suggestions.map((question) => {
          const current = ratings[question.ruleId]?.rating;
          return (
            <li key={question.ruleId} className="flex flex-col gap-1.5">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onAsk(question)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-left text-sm font-medium text-foreground hover:border-foreground/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-50"
              >
                {question.text}
              </button>
              <div role="group" aria-label={`Rate: ${question.text}`} className="flex items-center gap-2 text-xs text-foreground/60">
                <span>Was this useful?</span>
                {(["up", "down"] as const).map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    aria-pressed={current === rating}
                    onClick={() => rate(question.ruleId, rating)}
                    className={`rounded border px-2 py-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground ${
                      current === rating
                        ? "border-foreground font-semibold text-foreground"
                        : "border-border hover:border-foreground/40"
                    }`}
                  >
                    {current === rating ? "✓ " : ""}
                    {rating === "up" ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
