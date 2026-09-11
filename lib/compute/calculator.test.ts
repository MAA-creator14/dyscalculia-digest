import { describe, expect, it } from "vitest";
import { compareNumbers } from "./calculator";

describe("compareNumbers", () => {
  it("describes an increase with a fraction and redundant direction coding", () => {
    const result = compareNumbers(1204, 1436);
    expect(result.directionMeta).toEqual({ icon: "up", color: "positive", word: "up" });
    expect(result.fractionDescription).toBe("about a fifth");
    expect(result.sentence).toBe("1,436 is about a fifth higher than 1,204 (19.3%).");
  });

  it("describes a decrease", () => {
    const result = compareNumbers(200, 150);
    expect(result.directionMeta).toEqual({ icon: "down", color: "negative", word: "down" });
    expect(result.sentence).toBe("150 is about a quarter lower than 200 (25.0%).");
  });

  it("reports no change without a fraction", () => {
    const result = compareNumbers(50, 50);
    expect(result.directionMeta).toEqual({ icon: "flat", color: "neutral", word: "unchanged" });
    expect(result.fractionDescription).toBeNull();
    expect(result.sentence).toBe("50 and 50 are the same.");
  });

  it("falls back to an absolute difference when the starting number is zero", () => {
    const result = compareNumbers(0, 10);
    expect(result.delta.percent).toBeNull();
    expect(result.fractionDescription).toBeNull();
    expect(result.sentence).toBe("10 is higher than 0 by 10.");
  });

  it("handles negative numbers", () => {
    const result = compareNumbers(-10, -20);
    expect(result.directionMeta.word).toBe("down");
    expect(result.sentence).toBe("-20 is about double lower than -10 (100.0%).");
  });
});
