import type { Delta, Direction } from "./types";

export function direction(absolute: number): Direction {
  if (absolute > 0) return "up";
  if (absolute < 0) return "down";
  return "flat";
}

/** Absolute + percent change from `previous` to `current`. Percent is null when previous is 0 (undefined change). */
export function computeDelta(previous: number, current: number): Delta {
  const absolute = current - previous;
  const percent = previous === 0 ? null : absolute / previous;
  return { absolute, percent, direction: direction(absolute) };
}

/** Sequential deltas between consecutive values. First entry is always null (no prior value). */
export function computeSeriesDeltas(values: number[]): (Delta | null)[] {
  return values.map((v, i) => (i === 0 ? null : computeDelta(values[i - 1], v)));
}

export function sum(values: number[]): number {
  return values.reduce((total, v) => total + v, 0);
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return sum(values) / values.length;
}

/** Competition-style rank (1 = highest value; ties share a rank). */
export function rankDescending(values: number[]): number[] {
  const sorted = [...values].sort((a, b) => b - a);
  return values.map((v) => sorted.indexOf(v) + 1);
}

export interface LabeledDelta {
  label: string;
  delta: Delta;
}

function magnitude(delta: Delta): number {
  return Math.abs(delta.percent ?? delta.absolute);
}

/** The `n` items with the largest change, ranked by percent change (falling back to absolute when percent is undefined). */
export function topMovers(items: LabeledDelta[], n: number): LabeledDelta[] {
  return [...items].sort((a, b) => magnitude(b.delta) - magnitude(a.delta)).slice(0, n);
}
