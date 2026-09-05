import { detectAnomalies } from "./anomalies";
import { describeFraction, directionMeta, formatCurrency, formatPercent, groupDigits } from "./format";
import { computeDelta } from "./metrics";
import { detectStreak } from "./summarize";
import type { ColumnType, Delta, NumberCardData, ParsedTable } from "./types";

const METRIC_TYPES: ColumnType[] = ["count", "currency", "percent", "ratio"];

function formatValue(type: ColumnType, value: number): string {
  switch (type) {
    case "currency":
      return formatCurrency(value);
    case "percent":
      return formatPercent(value);
    default:
      return groupDigits(value);
  }
}

function buildSentence(
  name: string,
  formattedFirst: string,
  formattedLast: string,
  delta: Delta,
): string {
  if (delta.direction === "flat") {
    return `${name} stayed flat at ${formattedLast}.`;
  }

  const verb = delta.direction === "up" ? "went up" : "went down";

  if (delta.percent === null) {
    return `${name} ${verb} from ${formattedFirst} to ${formattedLast}.`;
  }

  const comparisonWord = delta.direction === "up" ? "higher" : "lower";
  const fraction = describeFraction(delta.percent);
  return `${name} ${verb} from ${formattedFirst} to ${formattedLast} — ${fraction} ${comparisonWord} (${formatPercent(
    Math.abs(delta.percent),
  )}).`;
}

/**
 * Turns a parsed table into one NumberCard per numeric column: raw + formatted
 * first/last values, a deterministically composed sentence, redundant direction
 * coding, anomalies, and any streak. No LLM involved — see PLAN.md's guardrail.
 * Columns with no usable numeric values (e.g. entirely blank) are skipped;
 * blank cells within an otherwise-numeric column are dropped from that column's
 * series rather than breaking the computation.
 */
export function buildNumberCards(table: ParsedTable): NumberCardData[] {
  const cards: NumberCardData[] = [];

  for (const column of table.columns) {
    if (!METRIC_TYPES.includes(column.type)) continue;

    const values = table.rows
      .map((row) => row[column.name])
      .filter((v): v is number => typeof v === "number");

    if (values.length === 0) continue;

    const first = values[0];
    const last = values[values.length - 1];
    const delta = computeDelta(first, last);
    const formattedFirst = formatValue(column.type, first);
    const formattedLast = formatValue(column.type, last);

    cards.push({
      name: column.name,
      type: column.type,
      values,
      first,
      last,
      formattedFirst,
      formattedLast,
      delta,
      directionMeta: directionMeta(delta.absolute),
      fractionDescription: delta.percent === null ? null : describeFraction(delta.percent),
      sentence: buildSentence(column.name, formattedFirst, formattedLast, delta),
      anomalies: detectAnomalies(values),
      streak: detectStreak(values),
    });
  }

  return cards;
}
