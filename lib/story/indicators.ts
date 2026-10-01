import type { NumberCardData } from "@/lib/compute/types";
import type { IndicatorKind } from "./types";

/**
 * Authored explainer content — never generated per request (same rule as lib/glossary/entries.ts).
 * The generic example is always labelled "not your data" in the UI.
 */
export const INDICATOR_EXPLAINER = {
  summary:
    "Leading indicators move first and you can act on them. Lagging indicators tell you the result after the fact.",
  leading:
    "A leading indicator is an early signal — something people do before the result shows up, like signing up, finishing onboarding or inviting a teammate. It's useful because you can still change it.",
  lagging:
    "A lagging indicator is the result — revenue, paying customers, churn, retention. It's what the business cares about, but by the time it moves, the cause has already happened.",
  genericExample:
    "A gym: classes booked in someone's first week is leading. Whether they renew their membership a year later is lagging. If first-week bookings drop, renewals will probably drop later — so you'd watch bookings to act early.",
  storyTip:
    "A good data story leads with one lagging result your audience cares about (the Hook), then uses one to three leading indicators to explain it (the Line).",
} as const;

export interface IndicatorSuggestion {
  kind: IndicatorKind;
  reason: string;
}

interface Rule {
  kind: IndicatorKind;
  pattern: RegExp;
  reason: string;
}

const EARLY_BEHAVIOUR = "Measures what people do early on, which usually moves before results do.";
const RESULT = "Sounds like a result — it tells you what has already happened.";
const SIGNAL = "Sounds like an early signal — it tends to move before results, and you can act on it.";

/** First match wins, so the specific early-behaviour patterns come before the broad "result" ones. */
const RULES: Rule[] = [
  { kind: "leading", pattern: /week[\s-]?1|first[\s-]week|day[\s-]?\d+/i, reason: EARLY_BEHAVIOUR },
  { kind: "leading", pattern: /\bnew (customers|users|accounts)\b/i, reason: "New customers usually show up before the revenue they bring." },
  { kind: "leading", pattern: /\bnps\b|satisfaction|\bcsat\b/i, reason: "How people feel tends to change before they leave or renew." },
  {
    kind: "lagging",
    pattern: /revenue|\bmrr\b|\barr\b|churn|retention|retained|renewal|\bpaid\b|conversion|customers|\bltv\b|profit|bookings|sales/i,
    reason: RESULT,
  },
  {
    kind: "leading",
    pattern:
      /onboarding|checklist|activation|activated|sign[\s-]?ups?|trials?\b|invites?|sessions?|visits?|engagement|feature|usage|created|pipeline|demos?|leads\b|active users/i,
    reason: SIGNAL,
  },
];

/**
 * Suggests leading/lagging from the metric's name only. It's always shown as "Suggested — you
 * decide": whether something leads or lags depends on what it's being compared with, so the PM's
 * tag always wins. Null when nothing matches — the UI then just asks.
 */
export function suggestIndicator(card: Pick<NumberCardData, "name">): IndicatorSuggestion | null {
  const rule = RULES.find((r) => r.pattern.test(card.name));
  return rule ? { kind: rule.kind, reason: rule.reason } : null;
}
