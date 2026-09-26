"use client";

import { useId, useRef, useState } from "react";
import type { ScenarioFeedback } from "@/lib/feedback/validation";
import type { Scenario } from "@/lib/scenarios/scenarios";

const CONFIDENCE_LABELS = ["Not at all", "A little", "Somewhat", "Fairly", "Very"];

/**
 * End-of-task feedback for self-serve testing. With a practice scenario it asks the
 * comprehension check and a confidence rating; on the user's own data it only offers the
 * comment box. Nothing about the dataset itself is sent — see lib/feedback/schema.sql.
 */
export function FeedbackForm({ scenario }: { scenario?: Scenario }) {
  const [choice, setChoice] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  // Answers are revealed on first submit, whether or not the network cooperates — learning the
  // right answer must never depend on the feedback being recorded.
  const [submitted, setSubmitted] = useState(false);
  // One id per form, so "try again" after a network error can't record the same feedback twice.
  const eventId = useRef<string | null>(null);
  const commentId = useId();
  const groupName = useId();

  const hasSomething = choice !== null || confidence !== null || comment.trim() !== "";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!hasSomething) return;
    setSubmitted(true);
    setStatus("sending");
    eventId.current ??= crypto.randomUUID();
    const body: ScenarioFeedback = {
      eventId: eventId.current,
      scenarioId: scenario?.id ?? null,
      answeredCorrectly: scenario && choice !== null ? choice === scenario.check.correctIndex : null,
      confidence,
      comment: comment.trim() || null,
    };
    try {
      const res = await fetch("/api/scenario-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold text-foreground/60">{scenario ? "Check your answer" : "How did that go?"}</h2>

      {scenario && (
        <fieldset disabled={submitted} className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-foreground">{scenario.check.question}</legend>
          {scenario.check.options.map((option, index) => {
            const isCorrect = index === scenario.check.correctIndex;
            const chosen = choice === index;
            return (
              <label
                key={option}
                className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
                  submitted && isCorrect
                    ? "border-positive text-foreground"
                    : submitted && chosen
                      ? "border-negative text-foreground"
                      : "border-border"
                }`}
              >
                <input
                  type="radio"
                  name={`${groupName}-check`}
                  checked={chosen}
                  onChange={() => setChoice(index)}
                  className="mt-1"
                />
                <span>
                  {option}
                  {submitted && isCorrect && <span className="ml-2 font-semibold text-positive">✓ Correct answer</span>}
                  {submitted && chosen && !isCorrect && <span className="ml-2 font-semibold text-negative">✗ Your answer</span>}
                </span>
              </label>
            );
          })}
        </fieldset>
      )}

      {scenario && (
        <fieldset disabled={submitted} className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-foreground">
            How confident would you feel presenting this?
          </legend>
          <div className="flex flex-wrap gap-2">
            {CONFIDENCE_LABELS.map((label, index) => (
              <label
                key={label}
                className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm ${
                  confidence === index + 1 ? "border-foreground" : "border-border"
                }`}
              >
                <input
                  type="radio"
                  name={`${groupName}-confidence`}
                  checked={confidence === index + 1}
                  onChange={() => setConfidence(index + 1)}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor={commentId} className="text-sm font-medium text-foreground">
          What was confusing or missing? <span className="font-normal text-foreground/60">(optional)</span>
        </label>
        <textarea
          id={commentId}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={submitted}
          maxLength={1000}
          rows={3}
          className="w-full rounded-lg border border-border bg-background p-3 text-sm"
        />
        <p className="text-xs text-foreground/50">Please don&apos;t include real company figures here.</p>
      </div>

      <div aria-live="polite" className="flex items-center gap-3">
        {status !== "sent" && (
          <button
            type="submit"
            disabled={!hasSomething || status === "sending"}
            className="rounded-lg bg-positive px-4 py-2 text-sm font-semibold text-background disabled:opacity-50"
          >
            {status === "sending"
              ? "Sending…"
              : status === "error"
                ? "Try sending again"
                : scenario
                  ? "Check and send"
                  : "Send feedback"}
          </button>
        )}
        {status === "sent" && <p className="text-sm text-foreground/80">Thanks — that helps make this better.</p>}
        {status === "error" && (
          <p className="text-sm text-negative">Couldn&apos;t send that just now. Please try again.</p>
        )}
      </div>
    </form>
  );
}
