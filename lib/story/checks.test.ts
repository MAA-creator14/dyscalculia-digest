import { describe, expect, it } from "vitest";
import { interpretTable } from "@/lib/compute/interpret";
import { getScenario } from "@/lib/scenarios/scenarios";
import { storyChecks } from "./checks";
import { emptyAnswers } from "./types";

function load(id: string) {
  const result = interpretTable(getScenario(id)!.csv);
  if (!result.ok) throw new Error(result.error.message);
  return result;
}

describe("storyChecks", () => {
  it("notes a driver moving the opposite way to the outcome, and always the causation reminder", () => {
    const { cards, shape } = load("churn-creeping-up");
    const ids = storyChecks(cards, { ...emptyAnswers(), outcome: "Monthly churn rate", drivers: ["NPS"] }, shape).map((c) => c.id);
    expect(ids).toContain("opposite-NPS");
    expect(ids.at(-1)).toBe("causation");
  });

  it("flags an unusual value in the outcome", () => {
    const { cards, shape } = load("enterprise-deal-spike");
    const ids = storyChecks(cards, { ...emptyAnswers(), outcome: "Revenue", drivers: ["New customers"] }, shape).map((c) => c.id);
    expect(ids).toContain("outcome-anomaly");
  });

  it("notes a Hook tagged leading, and a story with no drivers", () => {
    const { cards, shape } = load("activation-after-pricing");
    const answers = { ...emptyAnswers(), outcome: "Activation rate", tags: { "Activation rate": "leading" as const } };
    const ids = storyChecks(cards, answers, shape).map((c) => c.id);
    expect(ids).toEqual(expect.arrayContaining(["hook-is-leading", "no-drivers"]));
  });

  it("warns when rows aren't trustworthy periods", () => {
    const { cards, shape } = load("activation-after-pricing");
    const ids = storyChecks(cards, emptyAnswers(), { ...shape, periodsTrustworthy: false }).map((c) => c.id);
    expect(ids).toContain("periods");
  });
});
