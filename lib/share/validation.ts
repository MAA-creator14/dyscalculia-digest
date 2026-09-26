import { z } from "zod";

/**
 * Deliberate exception to this codebase's usual manual `unknown`-cast narrowing
 * (see app/api/chat/route.ts): this is the first route
 * where externally-supplied JSON becomes *persisted* data, and the PRD's top
 * assertion — "the serialized payload's keys are exactly the defined summary
 * fields, never raw data" — needs real allow-list enforcement. zod's default
 * `.parse()` behavior strips unrecognized keys from objects, which a cast cannot.
 */

const directionSchema = z.enum(["up", "down", "flat"]);

const deltaSchema = z.object({
  absolute: z.number(),
  percent: z.number().nullable(),
  direction: directionSchema,
});

const anomalySchema = z.object({
  index: z.number(),
  type: z.enum(["outlier", "sign_flip", "sudden_zero"]),
  reason: z.string(),
  severity: z.number(),
});

const directionMetaSchema = z.object({
  icon: directionSchema,
  color: z.enum(["positive", "negative", "neutral"]),
  word: z.string(),
});

const streakInfoSchema = z.object({
  length: z.number(),
  direction: z.enum(["up", "down"]),
});

const numberCardSchema = z.object({
  name: z.string(),
  type: z.enum(["date", "percent", "currency", "count", "ratio", "string"]),
  values: z.array(z.number()),
  first: z.number(),
  last: z.number(),
  formattedFirst: z.string(),
  formattedLast: z.string(),
  delta: deltaSchema,
  directionMeta: directionMetaSchema,
  fractionDescription: z.string().nullable(),
  sentence: z.string(),
  anomalies: z.array(anomalySchema),
  streak: streakInfoSchema.nullable(),
});

const execSummarySchema = z.object({
  headline: z.string(),
  movers: z.array(z.string()),
  streak: z.object({ cardName: z.string(), streak: streakInfoSchema }).nullable(),
  worstAnomaly: z.object({ cardName: z.string(), anomaly: anomalySchema }).nullable(),
  dataQualityCaveats: z.array(z.string()),
});

const sharedInterpretationSchema = z.object({
  cards: z.array(numberCardSchema),
  execSummary: execSummarySchema.nullable(),
  periodLabels: z.array(z.string()).nullable(),
});

export const createShareBodySchema = z.object({
  interpretation: sharedInterpretationSchema,
  commentary: z.string().nullable().optional(),
});

export const manageShareBodySchema = z.object({
  token: z.string().min(1),
  manageToken: z.string().min(1),
});

export const updateCommentaryBodySchema = manageShareBodySchema.extend({
  commentary: z.string().nullable(),
});
