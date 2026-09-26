import { recordScenarioFeedback } from "@/lib/feedback/db";
import { scenarioFeedbackBodySchema } from "@/lib/feedback/validation";

export interface ScenarioFeedbackResponse {
  ok: true;
}

export interface ScenarioFeedbackErrorResponse {
  ok: false;
  error: { message: string };
}

/**
 * Self-serve test feedback: the practice-scenario check, a confidence rating, and an optional
 * comment. Stores no dataset content — see lib/feedback/schema.sql. Same `{ ok }` convention as
 * the other routes.
 */
export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: { message: "Request body must be JSON." } } satisfies ScenarioFeedbackErrorResponse,
      { status: 400 },
    );
  }

  const parsed = scenarioFeedbackBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: { message: "Feedback payload is missing or malformed." } } satisfies ScenarioFeedbackErrorResponse,
      { status: 400 },
    );
  }

  try {
    await recordScenarioFeedback(parsed.data);
  } catch {
    return Response.json(
      { ok: false, error: { message: "Could not record the feedback." } } satisfies ScenarioFeedbackErrorResponse,
      { status: 500 },
    );
  }
  return Response.json({ ok: true } satisfies ScenarioFeedbackResponse);
}
