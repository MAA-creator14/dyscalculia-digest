import type { ColumnType, ParsedTable } from "./types";

export type PeriodShapeReason =
  | "ok"
  | "no-date-column"
  | "single-row"
  | "blank-date"
  | "repeated-dates"
  | "dates-not-ascending";

export interface DatasetShape {
  /** True only when rows are one series of distinct, time-ordered periods — the one shape where "trend" claims are true. */
  periodsTrustworthy: boolean;
  reason: PeriodShapeReason;
  rowCount: number;
  /** Every column, including text ones that never become a NumberCard (cohort, channel, segment). */
  columns: { name: string; type: ColumnType }[];
}

/**
 * Deterministically decides whether a table's rows can be read as ordered periods (see PRD
 * rev 2, Story 0). Suggestions and glossary examples that talk about change over time are
 * gated on this: a date column alone isn't enough — repeated dates (one row per segment) or
 * a ticket export would otherwise be narrated as a trend. Returns column names/types only,
 * never cell values.
 */
export function assessDatasetShape(table: ParsedTable): DatasetShape {
  const columns = table.columns.map(({ name, type }) => ({ name, type }));
  const rowCount = table.rows.length;
  const base = { rowCount, columns };

  const dateColumn = table.columns.find((column) => column.type === "date");
  if (!dateColumn) return { ...base, periodsTrustworthy: false, reason: "no-date-column" };
  if (rowCount < 2) return { ...base, periodsTrustworthy: false, reason: "single-row" };

  const times = table.rows.map((row) => {
    const value = row[dateColumn.name];
    return value instanceof Date ? value.getTime() : Number.NaN;
  });
  if (times.some(Number.isNaN)) return { ...base, periodsTrustworthy: false, reason: "blank-date" };

  for (let i = 1; i < times.length; i++) {
    if (times[i] === times[i - 1]) return { ...base, periodsTrustworthy: false, reason: "repeated-dates" };
    if (times[i] < times[i - 1]) return { ...base, periodsTrustworthy: false, reason: "dates-not-ascending" };
  }

  return { ...base, periodsTrustworthy: true, reason: "ok" };
}
