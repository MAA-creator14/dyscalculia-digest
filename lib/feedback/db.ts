import { getSql } from "@/lib/db";
import type { SuggestionFeedback } from "./validation";

/** Upsert by the anonymous per-suggestion id, so changing a rating updates the row (last choice wins). */
export async function recordSuggestionRating({ eventId, ruleId, rating }: SuggestionFeedback): Promise<void> {
  const sql = getSql();
  await sql`
    insert into suggestion_feedback (event_id, rule_id, rating)
    values (${eventId}, ${ruleId}, ${rating})
    on conflict (event_id) do update set rating = excluded.rating, updated_at = now()
  `;
}
