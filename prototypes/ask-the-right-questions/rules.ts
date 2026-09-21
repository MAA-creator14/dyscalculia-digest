import type { NumberCardData, ParsedTable } from "../../lib/compute/types";
import type { GlossaryKey } from "./datasets";

/* ---------- Part A: suggested questions ---------- */

export type SuggestionKind = "biggest-period-change" | "biggest-mover" | "streak" | "unusual-value";
export type ToolName = "getExecSummary" | "getBiggestPeriodChange" | "getMetric";

export interface Suggestion {
  kind: SuggestionKind;
  text: string;
  tool: ToolName;
  metric?: string;
  /** Makes a claim about change over time (true only if rows really are ordered periods). */
  temporal: boolean;
}

export interface PeriodShape {
  trustworthy: boolean;
  reason: string;
}

/** v1 guard: needs the parsed table, which the client does NOT currently receive. */
export function assessPeriodShape(table: ParsedTable): PeriodShape {
  if (table.rows.length < 2) return { trustworthy: false, reason: "fewer than 2 rows" };
  const dateCol = table.columns.find((c) => c.type === "date");
  if (!dateCol) return { trustworthy: false, reason: "no date column" };
  const times = table.rows.map((r) => (r[dateCol.name] instanceof Date ? (r[dateCol.name] as Date).getTime() : NaN));
  if (times.some(Number.isNaN)) return { trustworthy: false, reason: "blank date cell" };
  for (let i = 1; i < times.length; i++) {
    if (times[i] === times[i - 1]) return { trustworthy: false, reason: "repeated dates" };
    if (times[i] < times[i - 1]) return { trustworthy: false, reason: "dates not ascending" };
  }
  return { trustworthy: true, reason: "unique, ascending dates" };
}

const mag = (c: NumberCardData) => Math.abs(c.delta.percent ?? c.delta.absolute);

/**
 * v0 = the spec as written (Story 1 AC1/AC2): trend questions fire when a date column exists
 * and there are >=2 periods. v1 = same rules gated by `assessPeriodShape`.
 */
export function suggestQuestions(
  cards: NumberCardData[],
  periodLabels: string[] | null,
  opts: { trendOk: boolean },
): Suggestion[] {
  const out: Suggestion[] = [];
  const trend = opts.trendOk;

  if (trend) {
    const long = cards.filter((c) => c.values.length >= 3);
    if (long.length > 0) {
      const top = [...long].sort((a, b) => mag(b) - mag(a))[0];
      out.push({
        kind: "biggest-period-change",
        text: `Which period had the biggest change in ${top.name}?`,
        tool: "getBiggestPeriodChange",
        metric: top.name,
        temporal: true,
      });
    }
    if (cards.length >= 2) {
      out.push({ kind: "biggest-mover", text: "Which metric changed the most?", tool: "getExecSummary", temporal: true });
    }
    const streaky = cards.filter((c) => c.streak).sort((a, b) => b.streak!.length - a.streak!.length)[0];
    if (streaky) {
      out.push({
        kind: "streak",
        text: `How long has ${streaky.name} been going ${streaky.streak!.direction}?`,
        tool: "getMetric",
        metric: streaky.name,
        temporal: true,
      });
    }
  }

  const withAnomaly = cards.find((c) =>
    c.anomalies.some((a) => (trend ? true : a.type === "outlier")),
  );
  if (withAnomaly) {
    out.push({
      kind: "unusual-value",
      text: `What stands out in ${withAnomaly.name}?`,
      tool: "getMetric",
      metric: withAnomaly.name,
      temporal: withAnomaly.anomalies.some((a) => a.type !== "outlier"),
    });
  }
  return out.slice(0, 3);
}

/* ---------- Part D: glossary own-data matching ---------- */

const NAME: Record<GlossaryKey, RegExp> = {
  retention: /retention|retained/i,
  cohort: /cohort/i,
  churn: /churn/i,
  cac: /\bcac\b|acquisition cost/i,
  ltv: /\bltv\b|lifetime value/i,
};
const TYPES: Record<GlossaryKey, NumberCardData["type"][]> = {
  retention: ["percent", "ratio"],
  cohort: [],
  churn: ["percent", "ratio"],
  cac: ["currency"],
  ltv: ["currency"],
};

/** Cards-only matcher (what the client has today): name AND type must both fit. */
export function matchFromCards(key: GlossaryKey, cards: NumberCardData[]): string | null {
  const hit = cards.find((c) => TYPES[key].includes(c.type) && NAME[key].test(c.name));
  return hit ? hit.name : null;
}

/** Type-only matcher, to show why name matching is required. */
export function naiveTypeOnlyMatch(key: GlossaryKey, cards: NumberCardData[]): string | null {
  const hit = cards.find((c) => TYPES[key].includes(c.type));
  return hit ? hit.name : null;
}

/** Table-aware matcher: also sees string columns (cohort lives there). */
export function matchFromTable(key: GlossaryKey, table: ParsedTable): string | null {
  if (key === "cohort") {
    const col = table.columns.find((c) => c.type === "string" && NAME.cohort.test(c.name));
    return col ? col.name : null;
  }
  return null;
}
