import { describe, expect, it } from "vitest";
import { detectStreak, selectWorstAnomaly } from "./summarize";
import { detectAnomalies } from "./anomalies";

describe("detectStreak", () => {
  it("detects a multi-period decline ending at the last value", () => {
    const streak = detectStreak([100, 90, 80, 70]);
    expect(streak).toEqual({ length: 3, direction: "down" });
  });

  it("detects a multi-period increase", () => {
    const streak = detectStreak([50, 60, 70]);
    expect(streak).toEqual({ length: 2, direction: "up" });
  });

  it("returns null when the most recent move breaks the streak", () => {
    const streak = detectStreak([70, 80, 90, 85]);
    expect(streak).toBeNull();
  });

  it("returns null for a single up/down move (needs at least 2 to count as a streak)", () => {
    expect(detectStreak([100, 90])).toBeNull();
  });

  it("returns null for fewer than 2 values", () => {
    expect(detectStreak([100])).toBeNull();
  });
});

describe("selectWorstAnomaly", () => {
  it("returns null when there are no anomalies", () => {
    expect(selectWorstAnomaly([])).toBeNull();
  });

  it("picks the highest-severity anomaly", () => {
    const anomalies = detectAnomalies([100, -50, 0, 102, 99, 5000]);
    const worst = selectWorstAnomaly(anomalies);
    expect(worst).not.toBeNull();
    expect(anomalies.every((a) => a.severity <= (worst?.severity ?? 0))).toBe(true);
  });
});
