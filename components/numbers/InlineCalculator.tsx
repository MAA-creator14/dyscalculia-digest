"use client";

import { useId, useState } from "react";
import { compareNumbers } from "@/lib/compute/calculator";
import { TrendBadge } from "./TrendBadge";

/**
 * Persistent, always-available ad hoc comparison widget (see PLAN.md Flow D)
 * — "never require mental math": wherever a user needs to compare two
 * numbers, this covers it without leaving the page. Mounted once in the root
 * layout so it's reachable from every screen.
 */
export function InlineCalculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [fromText, setFromText] = useState("");
  const [toText, setToText] = useState("");
  const fromId = useId();
  const toId = useId();

  const from = Number(fromText);
  const to = Number(toText);
  const hasResult = fromText.trim() !== "" && toText.trim() !== "" && Number.isFinite(from) && Number.isFinite(to);
  const result = hasResult ? compareNumbers(from, to) : null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen && (
        <div className="mb-2 w-72 rounded-xl border border-border bg-surface p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground/60">Compare two numbers</p>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close calculator"
              className="text-foreground/50 hover:text-foreground"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 flex items-end gap-2">
            <div className="flex-1">
              <label htmlFor={fromId} className="text-xs text-foreground/60">
                From
              </label>
              <input
                id={fromId}
                type="number"
                inputMode="decimal"
                value={fromText}
                onChange={(e) => setFromText(e.target.value)}
                className="font-numeral mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex-1">
              <label htmlFor={toId} className="text-xs text-foreground/60">
                To
              </label>
              <input
                id={toId}
                type="number"
                inputMode="decimal"
                value={toText}
                onChange={(e) => setToText(e.target.value)}
                className="font-numeral mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              />
            </div>
          </div>

          <div className="mt-3 min-h-16 border-t border-border pt-3" aria-live="polite">
            {result ? (
              <div className="flex flex-col gap-1.5">
                <TrendBadge meta={result.directionMeta} />
                <p className="text-sm text-foreground/90">{result.sentence}</p>
              </div>
            ) : (
              <p className="text-sm text-foreground/50">Enter two numbers to compare them.</p>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="rounded-full bg-foreground px-4 py-3 text-sm font-semibold text-background shadow-lg"
      >
        {isOpen ? "Close calculator" : "Calculator"}
      </button>
    </div>
  );
}
