import { describe, expect, it } from "vitest";
import { SAMPLES } from "./__fixtures__/samples";
import { interpretTable, type InterpretResult } from "./interpret";

function interpret(text: string): InterpretResult {
  const result = interpretTable(text);
  if (!result.ok) throw new Error(result.error.message);
  return result;
}

const sample = (id: string) => SAMPLES.find((s) => s.id === id)!.csv;

describe("interpretTable", () => {
  it("returns a trustworthy shape for a clean weekly series", () => {
    const data = interpret(sample("weekly-kpi"));
    expect(data.shape.periodsTrustworthy).toBe(true);
    expect(data.shape.columns.map((c) => c.name)).toContain("Signups");
  });

  it("returns text columns that never become cards, and no periods, for a channel breakdown", () => {
    const data = interpret(sample("channel-breakdown"));
    expect(data.shape.periodsTrustworthy).toBe(false);
    expect(data.shape.columns).toContainEqual({ name: "Channel", type: "string" });
    expect(data.cards.map((c) => c.name)).not.toContain("Channel");
  });

  it("adds no cell values beyond what cards and period labels already carry", () => {
    const data = interpret(sample("retention-triangle"));
    const shapeJson = JSON.stringify(data.shape);
    expect(shapeJson).not.toContain("Jan 2026");
    expect(shapeJson).not.toContain("41%");
  });

  it("rejects empty input with a specific message", () => {
    const result = interpretTable("   ");
    expect(result.ok).toBe(false);
  });
});
