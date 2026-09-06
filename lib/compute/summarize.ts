import { topMovers, type LabeledDelta } from "./metrics";
import type { AnomalyFlag, ExecSummaryData, NumberCardData, StreakInfo } from "./types";

/**
 * Longest run of consecutive increases or decreases ending at the last value
 * (e.g. "third week in a row of decline"). Requires at least 2 consecutive
 * moves in the same direction to count as a streak.
 */
export function detectStreak(values: number[]): StreakInfo | null {
  if (values.length < 2) return null;

  let dir: "up" | "down" | null = null;
  let length = 0;

  for (let i = values.length - 1; i > 0; i--) {
    const diff = values[i] - values[i - 1];
    const currentDir = diff > 0 ? "up" : diff < 0 ? "down" : null;
    if (currentDir === null) break;
    if (dir === null) {
      dir = currentDir;
      length = 1;
    } else if (currentDir === dir) {
      length++;
    } else {
      break;
    }
  }

  if (dir === null || length < 2) return null;
  return { length, direction: dir };
}

/** Picks the single most severe anomaly to lead with in an exec summary, or null if there are none. */
export function selectWorstAnomaly(anomalies: AnomalyFlag[]): AnomalyFlag | null {
  if (anomalies.length === 0) return null;
  return [...anomalies].sort((a, b) => b.severity - a.severity)[0];
}

/**
 * Deterministically selects what's noteworthy across a whole dataset for the exec
 * summary: the single biggest mover (headline), the next 2 largest movers, the
 * longest streak across all metrics, the single worst anomaly across all metrics,
 * and a data-quality caveat for any metric with missing/dropped values. This is a
 * ranking function, not an LLM judgment call (see PLAN.md's deterministic/LLM split)
 * — callers may rephrase the wording later, but must never change which items were
 * picked or invent a takeaway this function didn't select.
 */
export function buildExecSummary(cards: NumberCardData[], totalRows: number): ExecSummaryData | null {
  if (cards.length === 0) return null;

  const labeled: LabeledDelta[] = cards.map((card) => ({ label: card.name, delta: card.delta }));
  const ranked = topMovers(labeled, cards.length);
  const cardByName = new Map(cards.map((card) => [card.name, card]));

  const headline = cardByName.get(ranked[0].label)!.sentence;
  const movers = ranked.slice(1, 3).map((r) => cardByName.get(r.label)!.sentence);

  let streak: { cardName: string; streak: StreakInfo } | null = null;
  for (const card of cards) {
    if (card.streak && (!streak || card.streak.length > streak.streak.length)) {
      streak = { cardName: card.name, streak: card.streak };
    }
  }

  let worstAnomaly: { cardName: string; anomaly: AnomalyFlag } | null = null;
  for (const card of cards) {
    const worst = selectWorstAnomaly(card.anomalies);
    if (worst && (!worstAnomaly || worst.severity > worstAnomaly.anomaly.severity)) {
      worstAnomaly = { cardName: card.name, anomaly: worst };
    }
  }

  const dataQualityCaveats = cards
    .filter((card) => card.values.length < totalRows)
    .map(
      (card) =>
        `${totalRows - card.values.length} row(s) were excluded from "${card.name}" because of missing or unreadable data.`,
    );

  return { headline, movers, streak, worstAnomaly, dataQualityCaveats };
}
