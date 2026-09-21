import { recordSuggestionRating } from "@/lib/feedback/db";
import { suggestionFeedbackBodySchema } from "@/lib/feedback/validation";

export interface SuggestionFeedbackResponse {
  ok: true;
}

export interface SuggestionFeedbackErrorResponse {
  ok: false;
  error: { message: string };
}

/**
 * Thumbs-up/down on a suggested question (PRD Story 3). Stores only the rule id, the rating and an
 * anonymous per-suggestion id — see lib/feedback/schema.sql. Same `{ ok }` convention as the other routes.
 */
export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: { message: "Request body must be JSON." } } satisfies SuggestionFeedbackErrorResponse,
      { status: 400 },
    );
  }

  const parsed = suggestionFeedbackBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: { message: "Rating payload is missing or malformed." } } satisfies SuggestionFeedbackErrorResponse,
      { status: 400 },
    );
  }

  try {
    await recordSuggestionRating(parsed.data);
  } catch {
    return Response.json(
      { ok: false, error: { message: "Could not record the rating." } } satisfies SuggestionFeedbackErrorResponse,
      { status: 500 },
    );
  }
  return Response.json({ ok: true } satisfies SuggestionFeedbackResponse);
}
