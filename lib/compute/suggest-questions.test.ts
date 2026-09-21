import { describe, expect, it } from "vitest";
import { buildChatTools } from "../ai/chat-tools";
import { SAMPLES } from "./__fixtures__/samples";
import { buildNumberCards } from "./build-number-cards";
import { assessDatasetShape } from "./dataset-shape";
import { derivePeriodLabels } from "./format";
import { parseDelimitedText } from "./parse-table";
import { suggestQuestions, type SuggestionRuleId } from "./suggest-questions";
import { buildExecSummary } from "./summarize";

const TREND_RULES: SuggestionRuleId[] = ["biggest-period-change", "biggest-mover", "streak"];

function run(csv: string) {
  const parsed = parseDelimitedText(csv);
  if (!parsed.ok) throw new Error(parsed.error.message);
  const cards = buildNumberCards(parsed.table);
  const shape = assessDatasetShape(parsed.table);
  return {
    cards,
    shape,
    execSummary: buildExecSummary(cards, parsed.table.rows.length),
    periodLabels: derivePeriodLabels(parsed.table),
    suggestions: suggestQuestions(cards, shape),
  };
}

const parseable = SAMPLES.filter((s) => s.id !== "accounting-negatives");
const sample = (id: string) => SAMPLES.find((s) => s.id === id)!.csv;

describe("suggestQuestions on the sample datasets", () => {
  it("never makes a trend claim over rows that aren't ordered periods (Story 1 AC6)", () => {
    for (const s of parseable.filter((x) => !x.trendValid)) {
      const { suggestions } = run(s.csv);
      const trendy = suggestions.filter((q) => TREND_RULES.includes(q.ruleId));
      expect(trendy, s.id).toEqual([]);
    }
  });

  it("suggests trend questions for a clean weekly series", () => {
    const { suggestions } = run(sample("weekly-kpi"));
    expect(suggestions.map((q) => q.ruleId)).toEqual(["biggest-period-change", "biggest-mover"]);
    expect(suggestions[0].metric).toBe("Revenue");
  });

  it("suggests nothing about a series that never moves (AC5)", () => {
    expect(run(sample("flat-series")).suggestions).toEqual([]);
  });

  it("shows no panel for a single-row snapshot", () => {
    expect(run(sample("single-snapshot")).suggestions).toEqual([]);
  });

  it("stays silent for text-typed dates (known gap)", () => {
    expect(run(sample("monthly-names")).suggestions).toEqual([]);
    expect(run(sample("uk-slash-ambiguous")).suggestions).toEqual([]);
  });

  it("caps at three and is deterministic (AC4)", () => {
    for (const s of parseable) {
      const first = run(s.csv).suggestions;
      expect(first.length, s.id).toBeLessThanOrEqual(3);
      expect(run(s.csv).suggestions, s.id).toEqual(first);
    }
  });

  it("only suggests questions a real chat tool answers without error (AC4)", async () => {
    let checked = 0;
    for (const s of parseable) {
      const { cards, execSummary, periodLabels, suggestions } = run(s.csv);
      const tools = buildChatTools({ cards, execSummary, periodLabels }) as unknown as Record<
        string,
        { execute: (input: unknown, options: unknown) => Promise<unknown> }
      >;
      for (const q of suggestions) {
        const input =
          q.tool === "getExecSummary"
            ? {}
            : q.tool === "getBiggestPeriodChange"
              ? { name: q.metric, direction: "either" }
              : { name: q.metric };
        const result = await tools[q.tool].execute(input, { toolCallId: "t", messages: [] });
        expect(result, `${s.id} / ${q.ruleId}`).not.toHaveProperty("error");
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });
});

describe("suggestQuestions anomaly rule", () => {
  it("allows an outlier question on non-period rows", () => {
    const rows = [...Array.from({ length: 11 }, (_, i) => `Item ${i},${100 + (i % 3)}`), "Item 11,5000"];
    const { suggestions, shape } = run(["Item,Value", ...rows].join("\n"));
    expect(shape.periodsTrustworthy).toBe(false);
    expect(suggestions.map((q) => q.ruleId)).toEqual(["unusual-value"]);
  });

  it("does not suggest a sign-flip question on non-period rows", () => {
    const { suggestions, cards } = run(["Item,Profit", "A,100", "B,-50", "C,80"].join("\n"));
    expect(cards[0].anomalies.some((a) => a.type === "sign_flip")).toBe(true);
    expect(suggestions).toEqual([]);
  });

  it("does allow a sign-flip question when rows are ordered periods", () => {
    const { suggestions } = run(
      ["Month,Profit", "2026-01-31,100", "2026-02-28,-50", "2026-03-31,80"].join("\n"),
    );
    expect(suggestions.map((q) => q.ruleId)).toContain("unusual-value");
  });
});
