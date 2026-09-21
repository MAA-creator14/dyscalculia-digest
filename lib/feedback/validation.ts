import { z } from "zod";
import { SUGGESTION_RULE_IDS } from "@/lib/compute/suggest-questions";

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
