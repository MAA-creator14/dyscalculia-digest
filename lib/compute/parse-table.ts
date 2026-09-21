import type { CellValue, Column, ColumnType, CurrencySymbol, ParseError, ParseResult } from "./types";

type SlashConvention = "MDY" | "DMY";

function isPercent(raw: string): boolean {
  return /^-?[\d,]+(\.\d+)?%$/.test(raw);
}

function parsePercent(raw: string): number {
  const n = parseFloat(raw.replace("%", "").replace(/,/g, ""));
  return n / 100;
}

function isCurrency(raw: string): boolean {
  return /^-?[£$][\d,]+(\.\d{1,2})?$/.test(raw);
}

function parseCurrency(raw: string): number {
  const negative = raw.trim().startsWith("-");
  const n = parseFloat(raw.replace(/[-£$,]/g, ""));
  return negative ? -n : n;
}

function isCount(raw: string): boolean {
  return /^-?[\d,]+$/.test(raw);
}

function parseCount(raw: string): number {
  return parseInt(raw.replace(/,/g, ""), 10);
}

function isRatio(raw: string): boolean {
  return /^-?[\d,]+\.\d+$/.test(raw);
}

function parseRatio(raw: string): number {
  return parseFloat(raw.replace(/,/g, ""));
}

function isIsoDate(raw: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) && !Number.isNaN(Date.parse(raw));
}

function parseIsoDate(raw: string): Date {
  return new Date(`${raw}T00:00:00Z`);
}

function isSlashDate(raw: string): boolean {
  return /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(raw);
}

function possibleSlashConventions(a: number, b: number): Set<SlashConvention> {
  const conventions = new Set<SlashConvention>();
  if (a >= 1 && a <= 12 && b >= 1 && b <= 31) conventions.add("MDY");
  if (a >= 1 && a <= 31 && b >= 1 && b <= 12) conventions.add("DMY");
  return conventions;
}

function intersect<T>(a: Set<T>, b: Set<T>): Set<T> {
  return new Set([...a].filter((x) => b.has(x)));
}

function parseSlashDate(raw: string, convention: SlashConvention): Date {
  const [a, b, year] = raw.split("/").map(Number);
  const month = convention === "MDY" ? a : b;
  const day = convention === "MDY" ? b : a;
  return new Date(Date.UTC(year, month - 1, day));
}

function looksNumeric(raw: string): boolean {
  return isPercent(raw) || isCurrency(raw) || isCount(raw) || isRatio(raw);
}

interface RawCell {
  raw: string;
  rowIndex: number;
}

type ColumnInferenceResult =
  | { type: ColumnType; values: CellValue[]; currencySymbol?: CurrencySymbol }
  | { error: ParseError };

function currencySymbolOf(raw: string): CurrencySymbol {
  return raw.trim().replace(/^-/, "")[0] as CurrencySymbol;
}

function inferAndParseColumn(columnName: string, cells: RawCell[]): ColumnInferenceResult {
  const nonEmpty = cells.filter((c) => c.raw.trim() !== "");

  if (nonEmpty.length === 0) {
    return { type: "string", values: cells.map((c) => c.raw) };
  }

  if (nonEmpty.every((c) => isIsoDate(c.raw.trim()))) {
    return {
      type: "date",
      values: cells.map((c) => (c.raw.trim() === "" ? "" : parseIsoDate(c.raw.trim()))),
    };
  }

  if (nonEmpty.every((c) => isSlashDate(c.raw.trim()))) {
    let conventions: Set<SlashConvention> | null = null;
    for (const c of nonEmpty) {
      const [a, b] = c.raw.trim().split("/").map(Number);
      const possible = possibleSlashConventions(a, b);
      conventions = conventions ? intersect(conventions, possible) : possible;
    }
    if (conventions && conventions.size === 1) {
      const convention = [...conventions][0];
      return {
        type: "date",
        values: cells.map((c) =>
          c.raw.trim() === "" ? "" : parseSlashDate(c.raw.trim(), convention),
        ),
      };
    }
    // Ambiguous MM/DD vs DD/MM across the column: don't guess, fall through to string below.
  }

  if (nonEmpty.every((c) => isPercent(c.raw.trim()))) {
    return {
      type: "percent",
      values: cells.map((c) => (c.raw.trim() === "" ? "" : parsePercent(c.raw.trim()))),
    };
  }

  if (nonEmpty.every((c) => isCurrency(c.raw.trim()))) {
    const symbol = currencySymbolOf(nonEmpty[0].raw);
    const mixed = nonEmpty.find((c) => currencySymbolOf(c.raw) !== symbol);
    if (mixed) {
      return {
        error: {
          message: `Column "${columnName}" mixes currency symbols (${symbol} and ${currencySymbolOf(mixed.raw)}); row ${mixed.rowIndex + 2} has "${mixed.raw}". Use one currency per column.`,
          columnName,
          rowIndex: mixed.rowIndex,
          rawValue: mixed.raw,
        },
      };
    }
    return {
      type: "currency",
      currencySymbol: symbol,
      values: cells.map((c) => (c.raw.trim() === "" ? "" : parseCurrency(c.raw.trim()))),
    };
  }

  if (nonEmpty.every((c) => isCount(c.raw.trim()))) {
    return {
      type: "count",
      values: cells.map((c) => (c.raw.trim() === "" ? "" : parseCount(c.raw.trim()))),
    };
  }

  if (nonEmpty.every((c) => isRatio(c.raw.trim()) || isCount(c.raw.trim()))) {
    return {
      type: "ratio",
      values: cells.map((c) => {
        const trimmed = c.raw.trim();
        if (trimmed === "") return "";
        return isCount(trimmed) ? parseCount(trimmed) : parseRatio(trimmed);
      }),
    };
  }

  const numericCount = nonEmpty.filter((c) => looksNumeric(c.raw.trim())).length;
  if (numericCount > 0 && numericCount < nonEmpty.length) {
    const bad = nonEmpty.find((c) => !looksNumeric(c.raw.trim()))!;
    return {
      error: {
        message: `Column "${columnName}" looks numeric but row ${bad.rowIndex + 2} has a value ("${bad.raw}") that doesn't match the format of the other rows.`,
        columnName,
        rowIndex: bad.rowIndex,
        rawValue: bad.raw,
      },
    };
  }

  return { type: "string", values: cells.map((c) => c.raw) };
}

function detectDelimiter(line: string): "," | "\t" {
  return line.includes("\t") ? "\t" : ",";
}

function splitLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

/**
 * Parses pasted or uploaded CSV/TSV text into a normalized table, inferring a type
 * per column (date/percent/currency/count/ratio/string). Assumes UK/US-style number
 * formats (period decimal, comma thousands separator) — see PLAN.md.
 *
 * Fails loudly with a specific, row/column-located message when a column looks
 * numeric but contains a value that doesn't match — this function never silently
 * guesses a number.
 */
export function parseDelimitedText(input: string): ParseResult {
  const lines = input.replace(/\r\n/g, "\n").split("\n").filter((l) => l.trim() !== "");

  if (lines.length < 2) {
    return { ok: false, error: { message: "Need a header row plus at least one data row." } };
  }

  const delimiter = detectDelimiter(lines[0]);
  const headerCells = splitLine(lines[0], delimiter).map((h) => h.trim());

  if (new Set(headerCells).size !== headerCells.length) {
    return { ok: false, error: { message: "Duplicate column names in the header row." } };
  }

  const dataLines = lines.slice(1).map((l) => splitLine(l, delimiter));

  for (let i = 0; i < dataLines.length; i++) {
    if (dataLines[i].length !== headerCells.length) {
      return {
        ok: false,
        error: {
          message: `Row ${i + 2} has ${dataLines[i].length} value(s) but the header has ${headerCells.length} column(s).`,
          rowIndex: i,
        },
      };
    }
  }

  const columns: Column[] = [];
  const columnValues: CellValue[][] = [];

  for (let colIdx = 0; colIdx < headerCells.length; colIdx++) {
    const name = headerCells[colIdx];
    const cells: RawCell[] = dataLines.map((row, rowIndex) => ({ raw: row[colIdx], rowIndex }));
    const result = inferAndParseColumn(name, cells);
    if ("error" in result) {
      return { ok: false, error: result.error };
    }
    columns.push(
      result.currencySymbol ? { name, type: result.type, currencySymbol: result.currencySymbol } : { name, type: result.type },
    );
    columnValues.push(result.values);
  }

  const rows: Record<string, CellValue>[] = dataLines.map((_, rowIndex) => {
    const row: Record<string, CellValue> = {};
    columns.forEach((col, colIdx) => {
      row[col.name] = columnValues[colIdx][rowIndex];
    });
    return row;
  });

  return { ok: true, table: { columns, rows } };
}
