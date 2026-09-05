export type ColumnType = "date" | "percent" | "currency" | "count" | "ratio" | "string";

export type CellValue = string | number | Date;

export interface Column {
  name: string;
  type: ColumnType;
}

export interface ParsedTable {
  columns: Column[];
  /** Each row maps column name -> normalized value (number/Date for computable types, string otherwise). */
  rows: Record<string, CellValue>[];
}

export interface ParseError {
  message: string;
  columnName?: string;
  rowIndex?: number;
  rawValue?: string;
}

export type ParseResult =
  | { ok: true; table: ParsedTable }
  | { ok: false; error: ParseError };

export type Direction = "up" | "down" | "flat";

export interface Delta {
  absolute: number;
  /** null when the previous value is 0 (percent change is undefined). */
  percent: number | null;
  direction: Direction;
}

export type AnomalyType = "outlier" | "sign_flip" | "sudden_zero";

export interface AnomalyFlag {
  index: number;
  type: AnomalyType;
  /** Deterministic, factually-correct explanation the LLM is allowed to rephrase but not contradict. */
  reason: string;
  /** Higher = more severe, used to pick the "worst" anomaly for the exec summary. */
  severity: number;
}
