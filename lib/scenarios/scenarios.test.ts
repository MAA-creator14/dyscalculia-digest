import { describe, expect, it } from "vitest";
import { interpretTable } from "@/lib/compute/interpret";
import { suggestIndicator } from "@/lib/story/indicators";
import { getScenario, SCENARIOS } from "./scenarios";

describe("practice scenarios", () => {
  it.each(SCENARIOS.map((s) => [s.id, s] as const))("%s: the engine surfaces the planted insight", (_id, scenario) => {
    const result = interpretTable(scenario.csv);
    if (!result.ok) throw new Error(result.error.message);
    const summary = result.execSummary!;
    const { slot, metric } = scenario.insight;

    if (slot === "headline") {
      const card = result.cards.find((c) => c.name === metric)!;
      expect(summary.headline).toBe(card.sentence);
    } else if (slot === "streak") {
      expect(summary.streak?.cardName).toBe(metric);
    } else {
      expect(summary.worstAnomaly?.cardName).toBe(metric);
    }
  });

  it.each(SCENARIOS.map((s) => [s.id, s] as const))("%s: parses every row and has a valid check", (_id, scenario) => {
    const result = interpretTable(scenario.csv);
    if (!result.ok) throw new Error(result.error.message);
    expect(result.execSummary!.dataQualityCaveats).toEqual([]);
    expect(result.shape.periodsTrustworthy).toBe(true);
    expect(scenario.check.options[scenario.check.correctIndex]).toBeDefined();
  });

  it("has unique ids that getScenario finds", () => {
    expect(new Set(SCENARIOS.map((s) => s.id)).size).toBe(SCENARIOS.length);
    expect(getScenario(SCENARIOS[0].id)).toBe(SCENARIOS[0]);
    expect(getScenario("nope")).toBeUndefined();
  });
});

describe("practice scenarios — story answer keys", () => {
  it.each(SCENARIOS.map((s) => [s.id, s] as const))("%s: story key matches the cards and the suggestions", (_id, scenario) => {
    const result = interpretTable(scenario.csv);
    if (!result.ok) throw new Error(result.error.message);
    const names = result.cards.map((c) => c.name);
    const { tags, outcome, drivers } = scenario.story;

    // Every metric is tagged, and nothing else is.
    expect(Object.keys(tags).sort()).toEqual([...names].sort());
    expect(tags[outcome]).toBe("lagging");
    expect(drivers.length).toBeGreaterThanOrEqual(1);
    expect(drivers.length).toBeLessThanOrEqual(3);
    for (const driver of drivers) expect(tags[driver]).toBe("leading");

    // The name-based suggestion agrees with our key, so practice never teaches two answers.
    for (const card of result.cards) expect(suggestIndicator(card)?.kind).toBe(tags[card.name]);
  });
});
