import { buildNumberCards } from "./build-number-cards";
import { assessDatasetShape, type DatasetShape } from "./dataset-shape";
import { derivePeriodLabels } from "./format";
import { parseDelimitedText } from "./parse-table";
import { buildExecSummary } from "./summarize";
import type { ExecSummaryData, NumberCardData, ParseError } from "./types";

export interface InterpretResult {
  ok: true;
  cards: NumberCardData[];
  execSummary: ExecSummaryData | null;
  periodLabels: string[] | null;
  /** Table shape for suggestions/glossary gating: column names+types and whether rows are trustworthy periods. No cell values. */
  shape: DatasetShape;
}

export interface InterpretError {
  ok: false;
  error: ParseError;
}

/**
 * Raw pasted/uploaded table text -> deterministic computation. Runs in the browser, so the
 * raw table never leaves the user's device. No LLM involved — see PLAN.md's
 * deterministic/LLM guardrail. Fails loudly with a specific error when the input can't be
 * confidently parsed, rather than guessing.
 */
export function interpretTable(text: string): InterpretResult | InterpretError {
  if (text.trim() === "") {
    return { ok: false, error: { message: "Paste or upload a table before submitting." } };
  }

  const parsed = parseDelimitedText(text);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  const cards = buildNumberCards(parsed.table);
  return {
    ok: true,
    cards,
    execSummary: buildExecSummary(cards, parsed.table.rows.length),
    periodLabels: derivePeriodLabels(parsed.table),
    shape: assessDatasetShape(parsed.table),
  };
}
