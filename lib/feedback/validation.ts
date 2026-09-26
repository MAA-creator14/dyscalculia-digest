import { z } from "zod";
import { SUGGESTION_RULE_IDS } from "@/lib/compute/suggest-questions";
import { SCENARIOS } from "@/lib/scenarios/scenarios";

const SCENARIO_IDS = SCENARIOS.map((s) => s.id) as [string, ...string[]];

/**
 * Allow-list body: zod strips unrecognized keys, so a client that also sent question text or
 * dataset values would have them dropped before anything reaches the database.
 */
export const suggestionFeedbackBodySchema = z.object({
  eventId: z.string().uuid(),
  ruleId: z.enum(SUGGESTION_RULE_IDS),
  rating: z.enum(["up", "down"]),
});

export type SuggestionFeedback = z.infer<typeof suggestionFeedbackBodySchema>;

/**
 * Same allow-list approach as above. The scenario id must be a real practice scenario (or null
 * for own-data feedback), so the column can't be used to smuggle dataset content in.
 */
export const scenarioFeedbackBodySchema = z
  .object({
    eventId: z.string().uuid(),
    scenarioId: z.enum(SCENARIO_IDS).nullable(),
    answeredCorrectly: z.boolean().nullable(),
    confidence: z.number().int().min(1).max(5).nullable(),
    comment: z.string().trim().max(1000).nullable(),
  })
  .refine((f) => f.answeredCorrectly !== null || f.confidence !== null || (f.comment ?? "") !== "", {
    message: "Feedback is empty.",
  });

export type ScenarioFeedback = z.infer<typeof scenarioFeedbackBodySchema>;
