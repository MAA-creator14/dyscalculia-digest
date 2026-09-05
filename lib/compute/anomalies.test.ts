import { describe, expect, it } from "vitest";
import {
  detectAnomalies,
  detectOutliers,
  detectSignFlips,
  detectSuddenZero,
  mean,
  stdDev,
} from "./anomalies";

describe("mean and stdDev", () => {
  it("computes mean", () => {
    expect(mean([1, 2, 3, 4])).toBe(2.5);
  });

  it("computes population standard deviation", () => {
    expect(stdDev([2, 2, 2, 2])).toBe(0);
    expect(stdDev([1, 2, 3])).toBeCloseTo(0.8165, 3);
  });
});

describe("detectOutliers", () => {
  it("does not flag anything with fewer than 3 values", () => {
    expect(detectOutliers([1, 1000])).toEqual([]);
  });

  it("does not flag a normal, consistent series (cautious default)", () => {
    const values = [100, 105, 98, 102, 101, 99];
    expect(detectOutliers(values)).toEqual([]);
  });

  it("flags a clear statistical outlier given enough data points", () => {
    // With very few points, population stddev is dominated by the outlier itself,
    // capping its own z-score — a real limitation of small-n z-scores, not a bug.
    // A realistic-length series (e.g. a few months of weekly data) crosses the
    // cautious z=3 threshold for a genuine spike like this.
    const values = [100, 102, 98, 101, 99, 103, 97, 100, 101, 99, 102, 5000];
    const flags = detectOutliers(values);
    expect(flags).toHaveLength(1);
    expect(flags[0].index).toBe(11);
    expect(flags[0].type).toBe("outlier");
  });

  it("does not flag a single spike in a very small sample (cautious default)", () => {
    // With only 6 points, z-score for a lone outlier caps around 2.24 regardless
    // of magnitude, so the cautious z=3 default intentionally misses it here.
    const values = [100, 102, 98, 101, 99, 5000];
    expect(detectOutliers(values)).toEqual([]);
  });

  it("respects a custom z-threshold", () => {
    const values = [100, 110, 90, 100, 100];
    const strict = detectOutliers(values, { zThreshold: 0.5 });
    expect(strict.length).toBeGreaterThan(0);
  });
});

describe("detectSignFlips", () => {
  it("flags positive-to-negative and negative-to-positive transitions", () => {
    const flags = detectSignFlips([10, -5, 3]);
    expect(flags).toHaveLength(2);
    expect(flags[0]).toMatchObject({ index: 1, type: "sign_flip" });
    expect(flags[1]).toMatchObject({ index: 2, type: "sign_flip" });
  });

  it("does not flag a series that stays positive", () => {
    expect(detectSignFlips([10, 20, 5])).toEqual([]);
  });
});

describe("detectSuddenZero", () => {
  it("flags a drop to zero after a non-zero value", () => {
    const flags = detectSuddenZero([50, 0, 10]);
    expect(flags).toHaveLength(1);
    expect(flags[0].index).toBe(1);
  });

  it("does not flag a series that starts at zero", () => {
    expect(detectSuddenZero([0, 5, 10])).toEqual([]);
  });
});

describe("detectAnomalies", () => {
  it("combines and sorts all anomaly types by index", () => {
    const values = [100, -50, 0, 102, 99, 5000];
    const flags = detectAnomalies(values);
    const indices = flags.map((f) => f.index);
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
    expect(flags.some((f) => f.type === "sign_flip")).toBe(true);
    expect(flags.some((f) => f.type === "sudden_zero")).toBe(true);
  });
});
