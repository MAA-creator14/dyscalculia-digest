import type { NumberCardData } from "@/lib/compute/types";
import type { Audience, SectionKind, StoryAnswers, StorySection } from "./types";

export type ComposedStory = Record<SectionKind, string>;

/** Ends free text with a full stop if the PM didn't, so templated sentences read cleanly. */
export function asSentence(text: string): string {
  const trimmed = text.trim();
  if (trimmed === "") return "";
  return /[.!?…]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

const HOOK_PROMISE: Record<Audience, string> = {
  leadership: "Here's what's behind it, and the decision we need from you.",
  team: "Here's what moved first, what we think is going on, and what we'll do next.",
  partners: "Here's what's driving it, and what it means for your work.",
  other: "Here's what's driving it, and what we're asking for.",
};

const ASK_LABEL: Record<Audience, string> = {
  leadership: "Decision needed:",
  team: "Next step:",
  partners: "What we're asking of you:",
  other: "What we're asking for:",
};

function byName(cards: NumberCardData[], name: string | null): NumberCardData | undefined {
  return name === null ? undefined : cards.find((c) => c.name === name);
}

/**
 * A suggested "one thing to remember", built from the outcome card's own deterministic wording —
 * no new arithmetic (see PLAN.md's deterministic/LLM split).
 */
export function suggestRemember(outcome: NumberCardData): string {
  if (outcome.delta.direction === "flat") return `${outcome.name} hasn't moved — it's still ${outcome.formattedLast}.`;
  const word = outcome.delta.direction === "up" ? "higher" : "lower";
  if (outcome.fractionDescription) {
    return `${outcome.name} is ${outcome.fractionDescription} ${word} than when we started.`;
  }
  return `${outcome.name} is now ${outcome.formattedLast}, ${word} than the ${outcome.formattedFirst} we started at.`;
}

/**
 * Builds the Hook / Line / Sinker text deterministically from the PM's answers and the cards'
 * precomputed sentences. Every number here comes from a card (`sentence`, `formattedFirst/Last`)
 * or from the PM's own words — nothing is calculated, and the hypothesis is always marked as
 * the PM's belief ("We think…"), never presented as a finding.
 */
export function composeStory(cards: NumberCardData[], answers: StoryAnswers): ComposedStory {
  const audience: Audience = answers.audience ?? "other";
  const outcome = byName(cards, answers.outcome);
  const drivers = answers.drivers.map((name) => byName(cards, name)).filter((c): c is NumberCardData => c !== undefined);

  // Hook: one lagging result, then a promise of what's coming.
  const hookLines: string[] = [];
  if (outcome) {
    hookLines.push(outcome.sentence);
    if (outcome.streak && audience !== "leadership") {
      const word = outcome.streak.direction === "up" ? "risen" : "fallen";
      hookLines.push(`It has ${word} ${outcome.streak.length} periods in a row.`);
    }
  }
  hookLines.push(HOOK_PROMISE[audience]);

  // Line: the leading indicators that explain it, the PM's hypothesis, and the stakes.
  const lineLines: string[] = [];
  if (drivers.length > 0) {
    lineLines.push("What moved first:");
    for (const driver of drivers) lineLines.push(`• ${driver.sentence}`);
  }
  if (answers.hypothesisUnknown || answers.hypothesis.trim() === "") {
    lineLines.push("We don't know why yet — finding out is part of the next step.");
  } else {
    lineLines.push(`We think: ${asSentence(answers.hypothesis)}`);
  }
  if (answers.ifNothingChanges.trim() !== "") {
    lineLines.push(`If nothing changes: ${asSentence(answers.ifNothingChanges)}`);
  }
  if (audience === "partners" && outcome) {
    lineLines.push(`What this means for you: ${outcome.name} is the number to watch with us.`);
  }

  // Sinker: the one thing to remember, the exact figure, and the ask.
  const ask = answers.decision.trim() === "" ? null : `${ASK_LABEL[audience]} ${asSentence(answers.decision)}`;
  const remember = answers.remember.trim() === "" ? null : asSentence(answers.remember);
  const figure = outcome ? `The number to remember: ${outcome.name} is now ${outcome.formattedLast}.` : null;
  const sinkerLines = (audience === "leadership" ? [ask, remember, figure] : [remember, figure, ask]).filter(
    (line): line is string => line !== null,
  );

  return {
    hook: hookLines.join(" "),
    line: lineLines.join("\n"),
    sinker: sinkerLines.join("\n"),
  };
}

/**
 * Refreshes section templates after answers change. A section the PM hasn't edited follows its
 * new template; an edited one keeps their text (they can "Reset to template" themselves).
 */
export function updateSections(
  previous: Record<SectionKind, StorySection> | null,
  composed: ComposedStory,
): Record<SectionKind, StorySection> {
  const next = {} as Record<SectionKind, StorySection>;
  for (const kind of ["hook", "line", "sinker"] as const) {
    const old = previous?.[kind];
    next[kind] =
      old && old.edited
        ? { ...old, template: composed[kind] }
        : { kind, template: composed[kind], text: composed[kind], edited: false };
  }
  return next;
}

/** Sets one section's text, tracking whether it still matches the template ("Reset" shows when it doesn't). */
export function withSectionText(
  sections: Record<SectionKind, StorySection>,
  kind: SectionKind,
  text: string,
): Record<SectionKind, StorySection> {
  const section = sections[kind];
  return { ...sections, [kind]: { ...section, text, edited: text !== section.template } };
}
