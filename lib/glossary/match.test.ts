import { describe, expect, it } from "vitest";
import { SAMPLES } from "@/lib/compute/__fixtures__/samples";
import { buildNumberCards } from "@/lib/compute/build-number-cards";
import { assessDatasetShape } from "@/lib/compute/dataset-shape";
import { parseDelimitedText } from "@/lib/compute/parse-table";
import { GLOSSARY } from "./entries";
import { describeTableSupport, exampleFor } from "./match";

function load(id: string) {
  const sample = SAMPLES.find((s) => s.id === id)!;
  const parsed = parseDelimitedText(sample.csv);
  if (!parsed.ok) throw new Error(parsed.error.message);
  return { sample, cards: buildNumberCards(parsed.table), shape: assessDatasetShape(parsed.table) };
}
const entry = (key: string) => GLOSSARY.find((e) => e.key === key)!;
const parseable = SAMPLES.filter((s) => s.id !== "accounting-negatives");

describe("glossary content", () => {
  it("gives every entry a definition, a data-needed line and a generic example (Story 4/6)", () => {
    for (const e of GLOSSARY) {
      expect(e.definition.length, e.key).toBeGreaterThan(20);
      expect(e.dataNeeded.length, e.key).toBeGreaterThan(20);
      expect(e.genericExample.length, e.key).toBeGreaterThan(20);
    }
  });
});

describe("exampleFor (Story 5)", () => {
  it("uses the PM's own churn, CAC and LTV columns when name, type and period shape all fit", () => {
    const { cards, shape } = load("saas-full");
    for (const key of ["churn", "cac", "ltv"]) {
      const result = exampleFor(entry(key), cards, shape);
      expect(result.kind, key).toBe("own-data");
    }
    const churn = exampleFor(entry("churn"), cards, shape);
    expect(churn).toMatchObject({ kind: "own-data", column: "Churn rate" });
    // Uses the card's own deterministic sentence — no new arithmetic (AC5)
    expect(churn.kind === "own-data" && churn.sentence).toBe(cards.find((c) => c.name === "Churn rate")!.sentence);
  });

  it("keeps £ as £ in an own-data example (AC6)", () => {
    const { cards, shape } = load("saas-full");
    const cac = exampleFor(entry("cac"), cards, shape);
    expect(cac.kind === "own-data" && cac.sentence).toContain("£");
    expect(cac.kind === "own-data" && cac.sentence).not.toContain("$");
  });

  it("falls back to generic on a per-channel table even though CAC matches by name and type (AC4)", () => {
    const { cards, shape } = load("channel-breakdown");
    expect(cards.some((c) => c.name === "CAC" && c.type === "currency")).toBe(true);
    expect(exampleFor(entry("cac"), cards, shape).kind).toBe("generic");
  });

  it("never matches on type alone (AC3)", () => {
    const { cards, shape } = load("weekly-kpi"); // has a percent column ("Activation rate")
    expect(cards.some((c) => c.type === "percent")).toBe(true);
    expect(exampleFor(entry("churn"), cards, shape).kind).toBe("generic");
    expect(exampleFor(entry("retention"), cards, shape).kind).toBe("generic");
  });

  it("never works cohort on the user's data", () => {
    const { cards, shape } = load("saas-full");
    expect(exampleFor(entry("cohort"), cards, shape).kind).toBe("generic");
  });

  it("is generic before any dataset exists", () => {
    for (const e of GLOSSARY) expect(exampleFor(e, null, null).kind).toBe("generic");
  });

  it("never produces an own-data example unless the dataset genuinely supports it and its rows are periods", () => {
    for (const s of parseable) {
      const { cards, shape } = load(s.id);
      for (const e of GLOSSARY) {
        if (exampleFor(e, cards, shape).kind === "own-data") {
          expect(s.supports, `${s.id}/${e.key}`).toContain(e.key);
          expect(s.trendValid, `${s.id}/${e.key}`).toBe(true);
        }
      }
    }
  });
});

describe("describeTableSupport (Story 6)", () => {
  it("says nothing before any dataset exists", () => {
    expect(describeTableSupport(entry("retention"), null)).toEqual([]);
  });

  it("acknowledges a text Cohort column that never became a card, without computing from it (AC3)", () => {
    const { shape } = load("retention-triangle");
    expect(describeTableSupport(entry("cohort"), shape)).toEqual(["Your table has a “Cohort” column, so its rows are grouped."]);
  });

  it("says plainly when a cohort table lacks retention figures (AC2)", () => {
    const { shape } = load("retention-triangle");
    expect(describeTableSupport(entry("retention"), shape)[0]).toContain("no per-cohort retention figures");
  });

  it("says plainly when the table can't support a metric, and shows no number (AC2, AC4)", () => {
    const { shape } = load("weekly-kpi");
    const lines = describeTableSupport(entry("ltv"), shape);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("can't be calculated from it");
    expect(lines[0]).not.toMatch(/\d/);
  });

  it("names the matching column when the table has one", () => {
    const { shape } = load("saas-full");
    expect(describeTableSupport(entry("churn"), shape)[0]).toContain("“Churn rate”");
  });
});
