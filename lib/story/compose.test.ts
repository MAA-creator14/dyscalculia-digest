import { describe, expect, it } from "vitest";
import { interpretTable } from "@/lib/compute/interpret";
import { getScenario } from "@/lib/scenarios/scenarios";
import { extractNumberTokens } from "./numbers";
import { asSentence, composeStory, suggestRemember, updateSections } from "./compose";
import { emptyAnswers, type StoryAnswers } from "./types";

function cardsFor(id: string) {
  const result = interpretTable(getScenario(id)!.csv);
  if (!result.ok) throw new Error(result.error.message);
  return result.cards;
}

const cards = cardsFor("activation-after-pricing");
const paid = cards.find((c) => c.name === "Paid conversions")!;
const activation = cards.find((c) => c.name === "Activation rate")!;

function answers(overrides: Partial<StoryAnswers> = {}): StoryAnswers {
  return {
    ...emptyAnswers(),
    audience: "team",
    decision: "Roll back the pricing page copy for two weeks",
    outcome: "Paid conversions",
    drivers: ["Activation rate"],
    hypothesis: "the new pricing page hides the free tier",
    ifNothingChanges: "Paid conversions keep sliding into next quarter",
    remember: "Activation fell first, and paid conversions followed",
    ...overrides,
  };
}

describe("composeStory", () => {
  it("builds the Hook from the outcome's own sentence and the Line from the drivers'", () => {
    const story = composeStory(cards, answers());
    expect(story.hook.startsWith(paid.sentence)).toBe(true);
    expect(story.line).toContain(`• ${activation.sentence}`);
    expect(story.line).toContain("We think: the new pricing page hides the free tier.");
    expect(story.line).toContain("If nothing changes: Paid conversions keep sliding into next quarter.");
    expect(story.sinker).toContain(`Paid conversions is now ${paid.formattedLast}.`);
    expect(story.sinker).toContain("Next step: Roll back the pricing page copy for two weeks.");
  });

  it("never invents a number: every figure comes from a card or the PM's own words", () => {
    const story = composeStory(cards, answers());
    const allowed = new Set([
      ...cards.flatMap((c) => [...extractNumberTokens(c.sentence), c.formattedFirst, c.formattedLast]),
      ...cards.map((c) => String(c.streak?.length ?? "")),
    ]);
    for (const token of extractNumberTokens(`${story.hook}\n${story.line}\n${story.sinker}`)) {
      expect(allowed).toContain(token);
    }
  });

  it("says plainly when the PM doesn't know why", () => {
    const story = composeStory(cards, answers({ hypothesis: "", hypothesisUnknown: true }));
    expect(story.line).toContain("We don't know why yet");
    expect(story.line).not.toContain("We think");
  });

  it("puts the ask first for leadership", () => {
    const story = composeStory(cards, answers({ audience: "leadership" }));
    expect(story.sinker.split("\n")[0]).toBe("Decision needed: Roll back the pricing page copy for two weeks.");
  });
});

describe("suggestRemember", () => {
  it("reuses the card's fraction wording", () => {
    expect(suggestRemember(paid)).toBe(`Paid conversions is ${paid.fractionDescription} lower than when we started.`);
  });
});

describe("asSentence", () => {
  it("adds a full stop only when missing", () => {
    expect(asSentence(" hello ")).toBe("hello.");
    expect(asSentence("hello?")).toBe("hello?");
    expect(asSentence("  ")).toBe("");
  });
});

describe("updateSections", () => {
  it("keeps the PM's edits but refreshes untouched sections", () => {
    const first = updateSections(null, { hook: "h1", line: "l1", sinker: "s1" });
    const edited = { ...first, hook: { ...first.hook, text: "my hook", edited: true } };
    const next = updateSections(edited, { hook: "h2", line: "l2", sinker: "s2" });
    expect(next.hook).toEqual({ kind: "hook", template: "h2", text: "my hook", edited: true });
    expect(next.line.text).toBe("l2");
  });
});
