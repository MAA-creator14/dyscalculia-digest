"use client";

import { useState } from "react";
import type { ExecSummaryData } from "@/lib/compute/types";

const STREAK_WORD: Record<"up" | "down", string> = {
  up: "in a row of increases",
  down: "in a row of decline",
};

function toPlainText(summary: ExecSummaryData): string {
  const lines = [summary.headline, ...summary.movers];
  if (summary.streak) {
    lines.push(
      `${summary.streak.cardName}: ${summary.streak.streak.length} periods ${STREAK_WORD[summary.streak.streak.direction]}.`,
    );
  }
  if (summary.worstAnomaly) {
    lines.push(`${summary.worstAnomaly.cardName}: ${summary.worstAnomaly.anomaly.reason}`);
  }
  lines.push(...summary.dataQualityCaveats);
  return lines.join("\n");
}

/**
 * Synthesized summary of the whole dataset, shown above the NumberCard stream
 * (see PLAN.md Flow B). Every sentence here is either a card's own deterministically
 * composed sentence or a plainly-templated fact — this component never phrases
 * anything itself, it only lays out what `buildExecSummary` already selected.
 */
export function ExecSummary({ summary }: { summary: ExecSummaryData }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(toPlainText(summary));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-semibold text-foreground/60">Summary</p>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground/70 hover:bg-background"
        >
          {copied ? "Copied" : "Copy as text"}
        </button>
      </div>

      <p className="mt-2 text-lg font-medium text-foreground">{summary.headline}</p>

      {summary.movers.length > 0 && (
        <ul className="mt-3 space-y-1">
          {summary.movers.map((sentence) => (
            <li key={sentence} className="text-sm text-foreground/80">
              {sentence}
            </li>
          ))}
        </ul>
      )}

      {summary.streak && (
        <p className="mt-3 text-sm text-foreground/70">
          <span className="font-medium">{summary.streak.cardName}:</span> {summary.streak.streak.length}{" "}
          periods {STREAK_WORD[summary.streak.streak.direction]}.
        </p>
      )}

      {summary.worstAnomaly && (
        <p className="mt-1 text-sm text-negative">
          <span className="font-medium">{summary.worstAnomaly.cardName}:</span>{" "}
          {summary.worstAnomaly.anomaly.reason}
        </p>
      )}

      {summary.dataQualityCaveats.length > 0 && (
        <ul className="mt-3 space-y-1">
          {summary.dataQualityCaveats.map((caveat) => (
            <li key={caveat} className="text-xs text-foreground/50">
              {caveat}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
