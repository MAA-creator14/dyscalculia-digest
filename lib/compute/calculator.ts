import { describeFraction, directionMeta, formatPercent, groupDigits } from "./format";
import { computeDelta } from "./metrics";
import type { Delta, DirectionMeta } from "./types";

export interface CalculatorResult {
  delta: Delta;
  directionMeta: DirectionMeta;
  /** Friendly fraction phrase for the change, null when percent change is undefined or there's no change. */
  fractionDescription: string | null;
  /** Deterministically composed plain-language sentence — no LLM involved (see PLAN.md Flow D). */
  sentence: string;
}

/**
 * Ad hoc comparison of two numbers (see PLAN.md Flow D): reuses the same
 * delta/fraction machinery as NumberCard so the inline calculator never asks
 * an LLM to do arithmetic — it's the same deterministic engine, just fed two
 * numbers typed on the spot instead of two cells from a table.
 */
export function compareNumbers(from: number, to: number): CalculatorResult {
  const delta = computeDelta(from, to);
  const meta = directionMeta(delta.absolute);

  if (delta.direction === "flat") {
    return {
      delta,
      directionMeta: meta,
      fractionDescription: null,
      sentence: `${groupDigits(from)} and ${groupDigits(to)} are the same.`,
    };
  }

  const comparisonWord = delta.direction === "up" ? "higher" : "lower";

  if (delta.percent === null) {
    return {
      delta,
      directionMeta: meta,
      fractionDescription: null,
      sentence: `${groupDigits(to)} is ${comparisonWord} than ${groupDigits(from)} by ${groupDigits(
        Math.abs(delta.absolute),
      )}.`,
    };
  }

  const fraction = describeFraction(delta.percent);
  return {
    delta,
    directionMeta: meta,
    fractionDescription: fraction,
    sentence: `${groupDigits(to)} is ${fraction} ${comparisonWord} than ${groupDigits(from)} (${formatPercent(
      Math.abs(delta.percent),
    )}).`,
  };
}
