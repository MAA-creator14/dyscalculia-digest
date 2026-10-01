import type { DatasetShape } from "@/lib/compute/dataset-shape";
import type { NumberCardData } from "@/lib/compute/types";
import type { StoryAnswers } from "./types";

export interface StoryCheck {
  id: string;
  text: string;
}

/**
 * Gentle, non-blocking notes on the review screen. All deterministic: they point at things the
 * audience might ask about, and never judge the PM's story as wrong.
 */
export function storyChecks(cards: NumberCardData[], answers: StoryAnswers, shape: DatasetShape): StoryCheck[] {
  const checks: StoryCheck[] = [];
  const outcome = cards.find((c) => c.name === answers.outcome);

  if (outcome && answers.tags[outcome.name] === "leading") {
    checks.push({
      id: "hook-is-leading",
      text: `You tagged ${outcome.name} as leading. Hooks usually land best on a result the audience already cares about (a lagging indicator).`,
    });
  }

  if (answers.drivers.length === 0) {
    checks.push({
      id: "no-drivers",
      text: "There are no leading indicators in this story, so the Line rests on your explanation alone. If you can get an early-signal metric, it will make the story stronger.",
    });
  }

  for (const name of answers.drivers) {
    const driver = cards.find((c) => c.name === name);
    if (!driver || !outcome) continue;
    if (driver.delta.direction === "flat") {
      checks.push({
        id: `flat-${name}`,
        text: `${name} didn't change, so on its own it can't explain the change in ${outcome.name}.`,
      });
    } else if (outcome.delta.direction !== "flat" && driver.delta.direction !== outcome.delta.direction) {
      checks.push({
        id: `opposite-${name}`,
        text: `${name} went ${driver.delta.direction} while ${outcome.name} went ${outcome.delta.direction}. That can still be a real story — just say how the two connect.`,
      });
    }
  }

  if (outcome && outcome.anomalies.length > 0) {
    checks.push({
      id: "outcome-anomaly",
      text: `${outcome.name} has an unusual value in it. Mention it, so nobody is surprised when they see the chart.`,
    });
  }

  if (!shape.periodsTrustworthy) {
    checks.push({
      id: "periods",
      text: "The rows in this table don't look like one value per time period, so words like \"went up\" compare the first row with the last, not a trend over time.",
    });
  }

  checks.push({
    id: "causation",
    text: "Two numbers moving together isn't proof that one caused the other. Saying \"we think\" keeps the story honest.",
  });

  return checks;
}
