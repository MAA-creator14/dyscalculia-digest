import type { AnomalyFlag } from "./types";

/** Cautious/under-flag default: only surface anomalies with strong statistical confidence (see PLAN.md). */
const DEFAULT_Z_THRESHOLD = 3;

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function stdDev(values: number[]): number {
  const m = mean(values);
  const variance = values.reduce((a, b) => a + (b - m) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function zScores(values: number[]): number[] {
  const m = mean(values);
  const sd = stdDev(values);
  if (sd === 0) return values.map(() => 0);
  return values.map((v) => (v - m) / sd);
}

export interface AnomalyOptions {
  zThreshold?: number;
}

/** Flags statistical outliers. Requires at least 3 values — a z-score isn't meaningful with fewer. */
export function detectOutliers(values: number[], options?: AnomalyOptions): AnomalyFlag[] {
  if (values.length < 3) return [];
  const threshold = options?.zThreshold ?? DEFAULT_Z_THRESHOLD;
  const scores = zScores(values);
  const flags: AnomalyFlag[] = [];
  scores.forEach((z, index) => {
    if (Math.abs(z) >= threshold) {
      flags.push({
        index,
        type: "outlier",
        reason: `Value ${values[index]} is ${Math.abs(z).toFixed(1)} standard deviations ${
          z > 0 ? "above" : "below"
        } the average of the other values.`,
        severity: Math.abs(z),
      });
    }
  });
  return flags;
}

/** Flags a value crossing from positive to negative or vice versa (e.g. profit to loss). */
export function detectSignFlips(values: number[]): AnomalyFlag[] {
  const flags: AnomalyFlag[] = [];
  for (let i = 1; i < values.length; i++) {
    const prev = values[i - 1];
    const curr = values[i];
    if (prev > 0 && curr < 0) {
      flags.push({
        index: i,
        type: "sign_flip",
        reason: `Value went from positive (${prev}) to negative (${curr}).`,
        severity: 2,
      });
    } else if (prev < 0 && curr > 0) {
      flags.push({
        index: i,
        type: "sign_flip",
        reason: `Value went from negative (${prev}) to positive (${curr}).`,
        severity: 2,
      });
    }
  }
  return flags;
}

/** Flags a value dropping to exactly 0 right after a non-zero period. */
export function detectSuddenZero(values: number[]): AnomalyFlag[] {
  const flags: AnomalyFlag[] = [];
  for (let i = 1; i < values.length; i++) {
    if (values[i] === 0 && values[i - 1] !== 0) {
      flags.push({
        index: i,
        type: "sudden_zero",
        reason: `Value dropped to 0 after being ${values[i - 1]} in the previous period.`,
        severity: 2.5,
      });
    }
  }
  return flags;
}

export function detectAnomalies(values: number[], options?: AnomalyOptions): AnomalyFlag[] {
  return [
    ...detectOutliers(values, options),
    ...detectSignFlips(values),
    ...detectSuddenZero(values),
  ].sort((a, b) => a.index - b.index);
}
