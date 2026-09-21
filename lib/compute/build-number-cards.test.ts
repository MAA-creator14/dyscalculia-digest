import { describe, expect, it } from "vitest";
import { buildNumberCards } from "./build-number-cards";
import { parseDelimitedText } from "./parse-table";
import type { NumberCardData } from "./types";

function parseOrThrow(input: string) {
  const result = parseDelimitedText(input);
  if (!result.ok) throw new Error(result.error.message);
  return result.table;
}

/** "Week" columns are themselves numeric, so tests must select by name rather
 * than assuming index 0 is the metric under test. */
function byName(cards: NumberCardData[], name: string): NumberCardData {
  const card = cards.find((c) => c.name === name);
  if (!card) throw new Error(`No card named "${name}"`);
  return card;
}

describe("buildNumberCards", () => {
  it("builds a card per numeric column, skipping string/date columns", () => {
    const table = parseOrThrow(
      ["Week,Signups,Region", "1,1204,EMEA", "2,1436,APAC"].join("\n"),
    );
    const cards = buildNumberCards(table);
    expect(cards.map((c) => c.name)).toEqual(["Week", "Signups"]);
  });

  it("computes first/last, delta, and a sentence with equal-weight raw + fraction framing", () => {
    const table = parseOrThrow(["Week,Signups", "1,1204", "2,1436"].join("\n"));
    const card = byName(buildNumberCards(table), "Signups");

    expect(card.first).toBe(1204);
    expect(card.last).toBe(1436);
    expect(card.delta.direction).toBe("up");
    expect(card.directionMeta).toEqual({ icon: "up", color: "positive", word: "up" });
    expect(card.fractionDescription).toBe("about a fifth");
    expect(card.sentence).toContain("1,204");
    expect(card.sentence).toContain("1,436");
    expect(card.sentence).toContain("about a fifth");
    expect(card.sentence).toContain("19.3%");
  });

  it("handles a flat (unchanged) metric", () => {
    const table = parseOrThrow(["Metric,Value", "A,100", "B,100"].join("\n"));
    const [card] = buildNumberCards(table);
    expect(card.delta.direction).toBe("flat");
    expect(card.sentence).toContain("stayed flat");
  });

  it("handles a previous value of 0 without a fraction claim", () => {
    const table = parseOrThrow(["Week,Signups", "1,0", "2,50"].join("\n"));
    const card = byName(buildNumberCards(table), "Signups");
    expect(card.fractionDescription).toBeNull();
    expect(card.sentence).not.toContain("%");
  });

  it("drops blank cells from a column instead of breaking on them", () => {
    const table = parseOrThrow(["Week,Signups", "1,100", "2,", "3,150"].join("\n"));
    const card = byName(buildNumberCards(table), "Signups");
    expect(card.values).toEqual([100, 150]);
    expect(card.first).toBe(100);
    expect(card.last).toBe(150);
  });

  it("formats currency and percent columns distinctly from plain counts", () => {
    const table = parseOrThrow(
      ["Week,Revenue,Growth", "1,$4500.00,10%", "2,$5200.00,15%"].join("\n"),
    );
    const cards = buildNumberCards(table);
    const revenue = byName(cards, "Revenue");
    const growth = byName(cards, "Growth");
    expect(revenue.formattedFirst).toBe("$4,500.00");
    expect(growth.formattedFirst).toBe("10.0%");
  });

  it("keeps a £ column as £ on the card", () => {
    const table = parseOrThrow(["Week,Revenue", "1,£4500.00", "2,£5200.00"].join("\n"));
    const revenue = byName(buildNumberCards(table), "Revenue");
    expect(revenue.formattedFirst).toBe("£4,500.00");
    expect(revenue.formattedLast).toBe("£5,200.00");
    expect(revenue.sentence).toContain("£4,500.00");
    expect(revenue.sentence).not.toContain("$");
  });

  it("surfaces anomalies and streaks on the card", () => {
    const table = parseOrThrow(
      [
        "Week,Value",
        "1,100",
        "2,90",
        "3,80",
        "4,70",
      ].join("\n"),
    );
    const card = byName(buildNumberCards(table), "Value");
    expect(card.streak).toEqual({ length: 3, direction: "down" });
    expect(Array.isArray(card.anomalies)).toBe(true);
  });
});
