import { describe, expect, it } from "vitest";
import {
  derivePeriodLabels,
  describeFraction,
  directionMeta,
  formatCurrency,
  formatPercent,
  groupDigits,
} from "./format";
import type { ParsedTable } from "./types";

describe("groupDigits", () => {
  it("adds thousands separators", () => {
    expect(groupDigits(1204)).toBe("1,204");
    expect(groupDigits(1204500)).toBe("1,204,500");
    expect(groupDigits(5)).toBe("5");
  });
});

describe("formatPercent", () => {
  it("formats a fraction as a percent string", () => {
    expect(formatPercent(0.193)).toBe("19.3%");
    expect(formatPercent(0.5, 0)).toBe("50%");
  });
});

describe("formatCurrency", () => {
  it("formats a dollar amount with two decimal places", () => {
    expect(formatCurrency(4500)).toBe("$4,500.00");
    expect(formatCurrency(1204.5)).toBe("$1,204.50");
  });

  it("puts the minus sign before the symbol for negative amounts", () => {
    expect(formatCurrency(-50)).toBe("-$50.00");
  });

  it("uses the given symbol, defaulting to $", () => {
    expect(formatCurrency(4500, "£")).toBe("£4,500.00");
    expect(formatCurrency(-50, "£")).toBe("-£50.00");
    expect(formatCurrency(4500)).toBe("$4,500.00");
  });
});

describe("directionMeta", () => {
  it("returns redundant up/down/flat coding", () => {
    expect(directionMeta(10)).toEqual({ icon: "up", color: "positive", word: "up" });
    expect(directionMeta(-10)).toEqual({ icon: "down", color: "negative", word: "down" });
    expect(directionMeta(0)).toEqual({ icon: "flat", color: "neutral", word: "unchanged" });
  });
});

describe("describeFraction", () => {
  it("matches common fractions under 100%", () => {
    expect(describeFraction(0.193)).toBe("about a fifth");
    expect(describeFraction(0.5)).toBe("about half");
    expect(describeFraction(0.25)).toBe("about a quarter");
    expect(describeFraction(1 / 3)).toBe("about a third");
  });

  it("ignores sign - direction is the caller's responsibility", () => {
    expect(describeFraction(-0.193)).toBe("about a fifth");
  });

  it("falls back to a rounded percent when no fraction is close", () => {
    expect(describeFraction(0.16)).toBe("roughly 15%");
  });

  it("describes changes of 100% or more as multiples", () => {
    expect(describeFraction(1.0)).toBe("about double");
    expect(describeFraction(2.0)).toBe("about triple");
  });
});

describe("derivePeriodLabels", () => {
  it("returns ISO date strings from the first date column", () => {
    const table: ParsedTable = {
      columns: [
        { name: "Week", type: "date" },
        { name: "Signups", type: "count" },
      ],
      rows: [
        { Week: new Date("2024-01-01T00:00:00Z"), Signups: 100 },
        { Week: new Date("2024-01-08T00:00:00Z"), Signups: 90 },
      ],
    };
    expect(derivePeriodLabels(table)).toEqual(["2024-01-01", "2024-01-08"]);
  });

  it("returns null when there is no date column", () => {
    const table: ParsedTable = {
      columns: [{ name: "Signups", type: "count" }],
      rows: [{ Signups: 100 }],
    };
    expect(derivePeriodLabels(table)).toBeNull();
  });
});
