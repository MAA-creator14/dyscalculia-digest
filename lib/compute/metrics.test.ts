import { describe, expect, it } from "vitest";
import { average, computeDelta, computeSeriesDeltas, rankDescending, sum, topMovers } from "./metrics";

describe("computeDelta", () => {
  it("computes absolute and percent change", () => {
    const delta = computeDelta(1204, 1436);
    expect(delta.absolute).toBe(232);
    expect(delta.percent).toBeCloseTo(0.1927, 3);
    expect(delta.direction).toBe("up");
  });

  it("returns a null percent when the previous value is 0", () => {
    const delta = computeDelta(0, 50);
    expect(delta.absolute).toBe(50);
    expect(delta.percent).toBeNull();
    expect(delta.direction).toBe("up");
  });

  it("flags no change as flat", () => {
    const delta = computeDelta(100, 100);
    expect(delta.direction).toBe("flat");
    expect(delta.percent).toBe(0);
  });

  it("handles a decrease", () => {
    const delta = computeDelta(200, 150);
    expect(delta.absolute).toBe(-50);
    expect(delta.percent).toBeCloseTo(-0.25, 5);
    expect(delta.direction).toBe("down");
  });
});

describe("computeSeriesDeltas", () => {
  it("returns null for the first entry and deltas for the rest", () => {
    const deltas = computeSeriesDeltas([100, 110, 99]);
    expect(deltas[0]).toBeNull();
    expect(deltas[1]?.absolute).toBe(10);
    expect(deltas[2]?.absolute).toBe(-11);
  });
});

describe("sum and average", () => {
  it("sums values", () => {
    expect(sum([1, 2, 3])).toBe(6);
  });

  it("averages values", () => {
    expect(average([2, 4, 6])).toBe(4);
  });

  it("averages an empty array as 0", () => {
    expect(average([])).toBe(0);
  });
});

describe("rankDescending", () => {
  it("ranks the highest value as 1", () => {
    expect(rankDescending([10, 30, 20])).toEqual([3, 1, 2]);
  });

  it("gives tied values the same rank", () => {
    expect(rankDescending([10, 30, 30, 20])).toEqual([4, 1, 1, 3]);
  });
});

describe("topMovers", () => {
  it("ranks by percent magnitude, largest first", () => {
    const items = [
      { label: "A", delta: computeDelta(100, 110) }, // +10%
      { label: "B", delta: computeDelta(100, 200) }, // +100%
      { label: "C", delta: computeDelta(100, 90) }, // -10%
    ];
    const top = topMovers(items, 2);
    expect(top.map((i) => i.label)).toEqual(["B", "A"]);
  });

  it("falls back to absolute magnitude when percent is undefined", () => {
    const items = [
      { label: "A", delta: computeDelta(0, 5) },
      { label: "B", delta: computeDelta(0, 50) },
    ];
    const top = topMovers(items, 1);
    expect(top[0].label).toBe("B");
  });
});
