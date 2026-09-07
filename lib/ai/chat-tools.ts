import { tool } from "ai";
import { z } from "zod";
import { computeSeriesDeltas } from "../compute/metrics";
import type { ExecSummaryData, NumberCardData } from "../compute/types";

export interface ChatDataset {
  cards: NumberCardData[];
  execSummary: ExecSummaryData | null;
  /** Per-row labels (e.g. dates), aligned with each card's `values` index. Null when the table had no date column. */
  periodLabels: string[] | null;
}

export type PeriodChangeDirection = "increase" | "decrease" | "either";

export interface MetricSummary {
  name: string;
  type: NumberCardData["type"];
  first: string;
  last: string;
  delta: NumberCardData["delta"];
  fractionDescription: string | null;
  anomalies: NumberCardData["anomalies"];
  streak: NumberCardData["streak"];
}

export interface PeriodChangeResult {
  metric: string;
  period: string;
  previousPeriod: string;
  from: number;
  to: number;
  absoluteChange: number;
}

export interface ToolError {
  error: string;
}

function findCard(dataset: ChatDataset, name: string): NumberCardData | undefined {
  const target = name.trim().toLowerCase();
  return dataset.cards.find((card) => card.name.toLowerCase() === target);
}

function labelFor(dataset: ChatDataset, index: number): string {
  return dataset.periodLabels?.[index] ?? `period ${index + 1}`;
}

function notFound(name: string): ToolError {
  return { error: `No metric named "${name}". Call listMetrics to see what's available.` };
}

export function summarizeMetric(card: NumberCardData): MetricSummary {
  return {
    name: card.name,
    type: card.type,
    first: card.formattedFirst,
    last: card.formattedLast,
    delta: card.delta,
    fractionDescription: card.fractionDescription,
    anomalies: card.anomalies,
    streak: card.streak,
  };
}

/**
 * Finds the single period-to-period change with the largest magnitude for a
 * metric (e.g. "which week had the biggest drop") — not just the overall
 * first-vs-last delta a NumberCard shows. Pure and unit-tested like the rest
 * of `lib/compute/` (see PLAN.md's deterministic/LLM split guardrail); the
 * chat tool below only exposes this, it never lets the model do the finding.
 */
export function findBiggestPeriodChange(
  dataset: ChatDataset,
  card: NumberCardData,
  direction: PeriodChangeDirection,
): PeriodChangeResult | ToolError {
  const deltas = computeSeriesDeltas(card.values);
  let best: { index: number; absolute: number } | null = null;

  for (let index = 0; index < deltas.length; index++) {
    const delta = deltas[index];
    if (!delta) continue;
    if (direction === "increase" && delta.absolute <= 0) continue;
    if (direction === "decrease" && delta.absolute >= 0) continue;
    if (!best || Math.abs(delta.absolute) > Math.abs(best.absolute)) {
      best = { index, absolute: delta.absolute };
    }
  }

  if (!best) {
    return { error: `No period-to-period ${direction === "either" ? "change" : direction} found for "${card.name}".` };
  }

  return {
    metric: card.name,
    period: labelFor(dataset, best.index),
    previousPeriod: labelFor(dataset, best.index - 1),
    from: card.values[best.index - 1],
    to: card.values[best.index],
    absoluteChange: best.absolute,
  };
}

/**
 * Tool definitions exposing only precomputed dataset values (see PLAN.md's
 * deterministic/LLM split guardrail): every tool here returns a value
 * `lib/compute/` already computed for the current dataset. None of them let
 * the model perform, influence, or invent arithmetic of its own — the model's
 * only job is to call the right tool and phrase what it returns.
 */
export function buildChatTools(dataset: ChatDataset) {
  return {
    listMetrics: tool({
      description: "List every metric (column) available in this dataset, with its type.",
      inputSchema: z.object({}),
      execute: async () => dataset.cards.map((card) => ({ name: card.name, type: card.type })),
    }),

    getMetric: tool({
      description:
        "Get the precomputed summary for one metric: first/last value, overall delta, direction, any anomalies, and any streak.",
      inputSchema: z.object({
        name: z.string().describe("Exact metric name, from listMetrics"),
      }),
      execute: async ({ name }) => {
        const card = findCard(dataset, name);
        return card ? summarizeMetric(card) : notFound(name);
      },
    }),

    getBiggestPeriodChange: tool({
      description:
        "Find the single period-to-period change with the largest magnitude for a metric (e.g. 'which week had the biggest drop') — not just the overall first-vs-last delta.",
      inputSchema: z.object({
        name: z.string().describe("Exact metric name, from listMetrics"),
        direction: z
          .enum(["increase", "decrease", "either"])
          .default("either")
          .describe("Restrict to increases, decreases, or either"),
      }),
      execute: async ({ name, direction }) => {
        const card = findCard(dataset, name);
        return card ? findBiggestPeriodChange(dataset, card, direction) : notFound(name);
      },
    }),

    getExecSummary: tool({
      description:
        "Get the precomputed executive summary of the whole dataset: headline, top movers, longest streak, and worst anomaly.",
      inputSchema: z.object({}),
      execute: async () =>
        dataset.execSummary ?? { error: "No exec summary is available for this dataset." },
    }),
  };
}
