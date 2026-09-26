import { getSql } from "@/lib/db";
import type { ScenarioFeedback, SuggestionFeedback } from "./validation";

/** Upsert by the anonymous per-suggestion id, so changing a rating updates the row (last choice wins). */
export async function recordSuggestionRating({ eventId, ruleId, rating }: SuggestionFeedback): Promise<void> {
  const sql = getSql();
  await sql`
    insert into suggestion_feedback (event_id, rule_id, rating)
    values (${eventId}, ${ruleId}, ${rating})
    on conflict (event_id) do update set rating = excluded.rating, updated_at = now()
  `;
}

/** One row per submission; the client generates the id, so a retried request doesn't double-count. */
export async function recordScenarioFeedback({
  eventId,
  scenarioId,
  answeredCorrectly,
  confidence,
  comment,
}: ScenarioFeedback): Promise<void> {
  const sql = getSql();
  await sql`
    insert into scenario_feedback (event_id, scenario_id, answered_correctly, confidence, comment)
    values (${eventId}, ${scenarioId}, ${answeredCorrectly}, ${confidence}, ${comment || null})
    on conflict (event_id) do nothing
  `;
}
