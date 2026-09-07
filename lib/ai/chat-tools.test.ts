import { describe, expect, it } from "vitest";
import { findBiggestPeriodChange, summarizeMetric, type ChatDataset } from "./chat-tools";
import { buildNumberCards } from "../compute/build-number-cards";
import type { ParsedTable } from "../compute/types";

function cardFor(values: number[]) {
  const table: ParsedTable = {
    columns: [{ name: "Signups", type: "count" }],
    rows: values.map((v) => ({ Signups: v })),
  };
  return buildNumberCards(table)[0];
}

const emptyDataset: ChatDataset = { cards: [], execSummary: null, periodLabels: null };

describe("summarizeMetric", () => {
  it("exposes the formatted values and delta, not just raw numbers", () => {
    const card = cardFor([100, 60]);
    const summary = summarizeMetric(card);
    expect(summary.first).toBe("100");
    expect(summary.last).toBe("60");
    expect(summary.delta.direction).toBe("down");
  });
});

describe("findBiggestPeriodChange", () => {
  it("finds the single largest drop across periods, not the overall first-vs-last delta", () => {
    // Overall delta is 100 -> 90 (small), but the biggest single-period move is 200 -> 50.
    const card = cardFor([100, 200, 50, 90]);
    const result = findBiggestPeriodChange(emptyDataset, card, "either");
    expect(result).toMatchObject({ from: 200, to: 50, absoluteChange: -150 });
  });

  it("uses period labels when available", () => {
    const card = cardFor([100, 90, 200]);
    const dataset: ChatDataset = {
      cards: [],
      execSummary: null,
      periodLabels: ["2024-01-01", "2024-01-08", "2024-01-15"],
    };
    const result = findBiggestPeriodChange(dataset, card, "either");
    expect(result).toMatchObject({ period: "2024-01-15", previousPeriod: "2024-01-08" });
  });

  it("falls back to 'period N' labels when there is no date column", () => {
    const card = cardFor([100, 90, 200]);
    const result = findBiggestPeriodChange(emptyDataset, card, "either");
    expect(result).toMatchObject({ period: "period 3", previousPeriod: "period 2" });
  });

  it("restricts to increases only when asked", () => {
    const card = cardFor([100, 50, 300]); // biggest overall move is the drop, but we want increases
    const result = findBiggestPeriodChange(emptyDataset, card, "increase");
    expect(result).toMatchObject({ from: 50, to: 300, absoluteChange: 250 });
  });

  it("restricts to decreases only when asked", () => {
    const card = cardFor([100, 300, 50]);
    const result = findBiggestPeriodChange(emptyDataset, card, "decrease");
    expect(result).toMatchObject({ from: 300, to: 50, absoluteChange: -250 });
  });

  it("returns an error when no matching change exists", () => {
    const card = cardFor([100, 110, 120]); // monotonic increase, no decrease exists
    const result = findBiggestPeriodChange(emptyDataset, card, "decrease");
    expect(result).toEqual({ error: 'No period-to-period decrease found for "Signups".' });
  });
});
