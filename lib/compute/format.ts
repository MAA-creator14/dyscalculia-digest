import type { DirectionMeta } from "./types";

/** Thousands-grouped numeral, e.g. 1204 -> "1,204". */
export function groupDigits(n: number): string {
  return n.toLocaleString("en-US");
}

/** `fraction` is a proportion (0.193), formatted as a percent string ("19.3%"). */
export function formatPercent(fraction: number, decimals = 1): string {
  return `${(fraction * 100).toFixed(decimals)}%`;
}

/** Assumes a single currency ($) per the MVP's UK/US-locale assumption (see PLAN.md). */
export function formatCurrency(value: number): string {
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Redundant coding (icon + color + word) for a change, so direction is never conveyed by color alone. */
export function directionMeta(absoluteChange: number): DirectionMeta {
  if (absoluteChange > 0) return { icon: "up", color: "positive", word: "up" };
  if (absoluteChange < 0) return { icon: "down", color: "negative", word: "down" };
  return { icon: "flat", color: "neutral", word: "unchanged" };
}

const FRACTION_BREAKPOINTS: { value: number; phrase: string }[] = [
  { value: 0.05, phrase: "about a twentieth" },
  { value: 0.1, phrase: "about a tenth" },
  { value: 0.125, phrase: "about an eighth" },
  { value: 0.2, phrase: "about a fifth" },
  { value: 0.25, phrase: "about a quarter" },
  { value: 1 / 3, phrase: "about a third" },
  { value: 0.4, phrase: "about two fifths" },
  { value: 0.5, phrase: "about half" },
  { value: 0.6, phrase: "about three fifths" },
  { value: 2 / 3, phrase: "about two thirds" },
  { value: 0.75, phrase: "about three quarters" },
  { value: 0.8, phrase: "about four fifths" },
  { value: 0.9, phrase: "about nine tenths" },
];

const MULTIPLE_NAMES: Record<number, string> = {
  2: "double",
  3: "triple",
  4: "quadruple",
  5: "quintuple",
};

/**
 * Deterministically buckets a percent change into a friendly fraction phrase
 * (e.g. 0.193 -> "about a fifth"), so the LLM narration layer never has to
 * guess or compute the fraction itself — see PLAN.md's deterministic/LLM split.
 * `percent` is a proportion (0.193 for 19.3%); sign is ignored, direction is
 * the caller's job to add ("higher"/"lower").
 */
export function describeFraction(percent: number): string {
  const value = Math.abs(percent);

  if (value >= 1) {
    const multiple = 1 + value;
    const rounded = Math.round(multiple * 2) / 2;
    if (Number.isInteger(rounded) && MULTIPLE_NAMES[rounded]) {
      return `about ${MULTIPLE_NAMES[rounded]}`;
    }
    return `about ${rounded} times`;
  }

  let closest = FRACTION_BREAKPOINTS[0];
  let closestDiff = Math.abs(value - closest.value);
  for (const bp of FRACTION_BREAKPOINTS) {
    const diff = Math.abs(value - bp.value);
    if (diff < closestDiff) {
      closest = bp;
      closestDiff = diff;
    }
  }

  if (closestDiff <= 0.03) {
    return closest.phrase;
  }

  const roundedPercent = Math.round(value * 20) * 5; // nearest 5%
  return `roughly ${roundedPercent}%`;
}
