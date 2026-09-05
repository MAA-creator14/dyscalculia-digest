import { describe, expect, it } from "vitest";
import { describeFraction, directionMeta, formatCurrency, formatPercent, groupDigits } from "./format";

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
