import { describe, expect, it } from "vitest";
import { buildExecSummary, detectStreak, selectWorstAnomaly } from "./summarize";
import { detectAnomalies } from "./anomalies";
import { buildNumberCards } from "./build-number-cards";
import type { ParsedTable } from "./types";

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

function tableFromColumns(
  columns: { name: string; type: "count" | "percent" | "currency"; values: (number | "")[] }[],
): ParsedTable {
  const rowCount = columns[0].values.length;
  if (columns.some((col) => col.values.length !== rowCount)) {
    throw new Error("tableFromColumns: all columns must have the same number of values");
  }
  const rows = Array.from({ length: rowCount }, (_, i) => {
    const row: Record<string, number | string> = {};
    columns.forEach((col) => {
      row[col.name] = col.values[i];
    });
    return row;
  });
  return { columns: columns.map(({ name, type }) => ({ name, type })), rows };
}

describe("buildExecSummary", () => {
  it("returns null when there are no metric cards", () => {
    expect(buildExecSummary([], 0)).toBeNull();
  });

  it("picks the largest mover as the headline and the next two as movers", () => {
    const table = tableFromColumns([
      { name: "Signups", type: "count", values: [100, 90, 80, 70, 60] }, // -40%
      { name: "Revenue", type: "currency", values: [1000, 1005, 995, 1010, 900] }, // -10%
      { name: "Churn", type: "percent", values: [0.05, 0.05, 0.05, 0.05, 0.5] }, // +900%
    ]);
    const cards = buildNumberCards(table);
    const summary = buildExecSummary(cards, table.rows.length)!;

    const churnCard = cards.find((c) => c.name === "Churn")!;
    const signupsCard = cards.find((c) => c.name === "Signups")!;
    const revenueCard = cards.find((c) => c.name === "Revenue")!;

    expect(summary.headline).toBe(churnCard.sentence);
    expect(summary.movers).toEqual([signupsCard.sentence, revenueCard.sentence]);
  });

  it("picks the longest streak across all metrics", () => {
    const table = tableFromColumns([
      { name: "Signups", type: "count", values: [100, 90, 80, 70, 60] }, // 4-period decline
      { name: "Revenue", type: "currency", values: [1000, 1005, 995, 1010, 900] }, // no streak
    ]);
    const cards = buildNumberCards(table);
    const summary = buildExecSummary(cards, table.rows.length)!;

    expect(summary.streak).toEqual({
      cardName: "Signups",
      streak: { length: 4, direction: "down" },
    });
  });

  it("picks the worst anomaly across all metrics", () => {
    const table = tableFromColumns([
      { name: "Normal", type: "count", values: [100, 105, 98, 102, 101, 99, 100, 103, 98, 101, 99, 102] },
      {
        name: "Score",
        type: "count",
        values: [100, 102, 98, 101, 99, 103, 97, 100, 101, 99, 102, 5000],
      },
    ]);
    const cards = buildNumberCards(table);
    const summary = buildExecSummary(cards, table.rows.length)!;

    expect(summary.worstAnomaly?.cardName).toBe("Score");
    expect(summary.worstAnomaly?.anomaly.type).toBe("outlier");
  });

  it("flags a data-quality caveat when a metric had rows excluded for missing data", () => {
    const table = tableFromColumns([
      { name: "Signups", type: "count", values: [100, "", 80, 70, 60] },
    ]);
    const cards = buildNumberCards(table);
    const summary = buildExecSummary(cards, table.rows.length)!;

    expect(summary.dataQualityCaveats).toEqual([
      '1 row(s) were excluded from "Signups" because of missing or unreadable data.',
    ]);
  });
});
