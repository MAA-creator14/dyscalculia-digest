import type { DatasetShape } from "./dataset-shape";
import { topMovers } from "./metrics";
import type { NumberCardData } from "./types";

export const SUGGESTION_RULE_IDS = ["biggest-period-change", "biggest-mover", "streak", "unusual-value"] as const;
export type SuggestionRuleId = (typeof SUGGESTION_RULE_IDS)[number];

/** The Flow C chat tool that can answer the question from precomputed values (see lib/ai/chat-tools.ts). */
export type SuggestionTool = "getExecSummary" | "getBiggestPeriodChange" | "getMetric";

export interface SuggestedQuestion {
  /** Stable id, safe to record with a rating — carries no dataset content. */
  ruleId: SuggestionRuleId;
  text: string;
  tool: SuggestionTool;
  metric?: string;
}

const MAX_SUGGESTIONS = 3;

/** A series that never changes has nothing to ask about ("biggest change: 0" is valid but pointless). */
function hasMovement(card: NumberCardData): boolean {
  return new Set(card.values).size > 1;
}

/**
 * Picks up to three questions this dataset can already answer. Deterministic rules choose
 * *which* questions to show — no LLM decides what is worth asking (see PLAN.md's split) —
 * and returns `[]` when nothing qualifies, so the caller renders no panel at all.
 *
 * Trend questions (change by period, streaks, biggest mover) are gated on
 * `shape.periodsTrustworthy`: a date column alone isn't enough, since repeated dates or a
 * ticket list would make "which week changed most?" a false claim.
 */
export function suggestQuestions(cards: NumberCardData[], shape: DatasetShape): SuggestedQuestion[] {
  const suggestions: SuggestedQuestion[] = [];
  const trend = shape.periodsTrustworthy;
  const moving = cards.filter(hasMovement);

  if (trend) {
    const longEnough = moving.filter((card) => card.values.length >= 3);
    const [biggest] = topMovers(
      longEnough.map((card) => ({ label: card.name, delta: card.delta })),
      1,
    );
    if (biggest) {
      suggestions.push({
        ruleId: "biggest-period-change",
        text: `Which period had the biggest change in ${biggest.label}?`,
        tool: "getBiggestPeriodChange",
        metric: biggest.label,
      });
    }

    if (moving.length >= 2) {
      suggestions.push({
        ruleId: "biggest-mover",
        text: "Which metric changed the most?",
        tool: "getExecSummary",
      });
    }

    const streaky = moving
      .filter((card) => card.streak)
      .sort((a, b) => b.streak!.length - a.streak!.length)[0];
    if (streaky) {
      suggestions.push({
        ruleId: "streak",
        text: `How long has ${streaky.name} been going ${streaky.streak!.direction}?`,
        tool: "getMetric",
        metric: streaky.name,
      });
    }
  }

  // Outliers are meaningful on any shape; sign flips and sudden zeros describe change over time.
  const unusual = cards.find((card) =>
    card.anomalies.some((anomaly) => trend || anomaly.type === "outlier"),
  );
  if (unusual) {
    suggestions.push({
      ruleId: "unusual-value",
      text: `What stands out in ${unusual.name}?`,
      tool: "getMetric",
      metric: unusual.name,
    });
  }

  return suggestions.slice(0, MAX_SUGGESTIONS);
}
