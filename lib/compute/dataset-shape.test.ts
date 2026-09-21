import { describe, expect, it } from "vitest";
import { SAMPLES } from "./__fixtures__/samples";
import { assessDatasetShape, type PeriodShapeReason } from "./dataset-shape";
import { parseDelimitedText } from "./parse-table";
import type { ParsedTable } from "./types";

function parse(csv: string): ParsedTable {
  const result = parseDelimitedText(csv);
  if (!result.ok) throw new Error(result.error.message);
  return result.table;
}

// Ground truth for the prototype's sample datasets, as the shape guard should judge them. Note the
// "known gaps": month-name and ambiguous-slash dates type as text, so they are (safely) not trusted.
const EXPECTED: Record<string, PeriodShapeReason> = {
  "weekly-kpi": "ok",
  "monthly-names": "no-date-column",
  "uk-slash-unambiguous": "ok",
  "uk-slash-ambiguous": "no-date-column",
  "retention-triangle": "no-date-column",
  "retention-long": "no-date-column",
  "channel-breakdown": "no-date-column",
  "single-snapshot": "single-row",
  "suffix-money": "ok",
  "two-period": "ok",
  "ticket-list": "repeated-dates",
  "saas-full": "ok",
  "zero-start": "ok",
  "flat-series": "ok",
  "segment-long": "repeated-dates",
};

describe("assessDatasetShape on the sample datasets", () => {
  for (const sample of SAMPLES) {
    if (sample.id === "accounting-negatives") continue; // fails to parse; covered by the parser
    it(`${sample.id}: ${EXPECTED[sample.id]}`, () => {
      const shape = assessDatasetShape(parse(sample.csv));
      expect(shape.reason).toBe(EXPECTED[sample.id]);
      expect(shape.periodsTrustworthy).toBe(EXPECTED[sample.id] === "ok");
    });
  }

  it("never trusts a dataset whose rows aren't ordered periods", () => {
    for (const sample of SAMPLES) {
      if (sample.id === "accounting-negatives") continue;
      const shape = assessDatasetShape(parse(sample.csv));
      if (!sample.trendValid) expect(shape.periodsTrustworthy, sample.id).toBe(false);
    }
  });
});

describe("assessDatasetShape", () => {
  it("rejects descending dates", () => {
    const shape = assessDatasetShape(parse(["Week,Signups", "2026-01-12,10", "2026-01-05,12"].join("\n")));
    expect(shape).toMatchObject({ periodsTrustworthy: false, reason: "dates-not-ascending" });
  });

  it("rejects a blank date cell", () => {
    const shape = assessDatasetShape(parse(["Week,Signups", "2026-01-05,10", ",12", "2026-01-19,14"].join("\n")));
    expect(shape).toMatchObject({ periodsTrustworthy: false, reason: "blank-date" });
  });

  it("lists every column including text ones, with types and no values", () => {
    const shape = assessDatasetShape(parse(["Cohort,M0,M1", "Jan 2026,100%,41%", "Feb 2026,100%,44%"].join("\n")));
    expect(shape.columns).toEqual([
      { name: "Cohort", type: "string" },
      { name: "M0", type: "percent" },
      { name: "M1", type: "percent" },
    ]);
    expect(shape.rowCount).toBe(2);
    expect(JSON.stringify(shape)).not.toContain("Jan 2026");
  });
});
