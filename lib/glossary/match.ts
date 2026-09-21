import type { DatasetShape } from "@/lib/compute/dataset-shape";
import type { NumberCardData } from "@/lib/compute/types";
import { GLOSSARY, type GlossaryEntry } from "./entries";

export type ExampleResult =
  | { kind: "own-data"; column: string; sentence: string }
  | { kind: "generic" };

/**
 * Decides whether a glossary entry can be worked through on the PM's own numbers. All three must hold:
 *  - the column's name matches the entry AND its type fits (type alone falsely matched 22 of 66
 *    unsupported pairs in the prototype, so it is never enough);
 *  - the rows are verified ordered periods (a correct match on a per-channel table would still
 *    present a misleading first-row-to-last-row change);
 *  - the entry is one that can be computed from a card at all (cohort never is).
 * The example is the card's own deterministic sentence, so nothing new is calculated here.
 */
export function exampleFor(
  entry: GlossaryEntry,
  cards: NumberCardData[] | null,
  shape: DatasetShape | null,
): ExampleResult {
  if (!cards || !shape?.periodsTrustworthy || entry.ownDataTypes.length === 0) return { kind: "generic" };
  const card = cards.find((c) => entry.ownDataTypes.includes(c.type) && entry.columnName.test(c.name));
  return card ? { kind: "own-data", column: card.name, sentence: card.sentence } : { kind: "generic" };
}

/**
 * Plain statements about what the current table does and doesn't contain for an entry. Uses the
 * all-column metadata (including text columns like "Cohort" that never become cards) and only
 * reports what exists — it never computes from those columns.
 */
export function describeTableSupport(entry: GlossaryEntry, shape: DatasetShape | null): string[] {
  if (!shape) return [];
  const has = (pattern: RegExp) => shape.columns.find((column) => pattern.test(column.name))?.name;

  // Prefer the column whose type also fits (a "Churn rate" percent over a "Churned customers" count).
  const own =
    shape.columns.find((column) => entry.columnName.test(column.name) && entry.ownDataTypes.includes(column.type))?.name ??
    has(entry.columnName);
  if (entry.key === "cohort") {
    return own
      ? [`Your table has a “${own}” column, so its rows are grouped.`]
      : ["Your table has no column that says which group each row belongs to, so it can't be compared by cohort."];
  }
  if (own) return [`Your table has a “${own}” column that looks like ${entry.term.split(" (")[0].toLowerCase()}.`];

  const cohortColumn = has(GLOSSARY.find((e) => e.key === "cohort")!.columnName);
  const lacks = `Your table has no column that looks like ${entry.term.split(" (")[0].toLowerCase()}, so it can't be calculated from it.`;
  if (entry.key === "retention" && cohortColumn) {
    return [`Your table has a “${cohortColumn}” column but no per-cohort retention figures, so retention can't be calculated from it.`];
  }
  return [lacks];
}
