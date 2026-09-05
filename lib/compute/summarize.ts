import type { AnomalyFlag, StreakInfo } from "./types";

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
