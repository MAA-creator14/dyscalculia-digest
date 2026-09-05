import { buildNumberCards } from "@/lib/compute/build-number-cards";
import { parseDelimitedText } from "@/lib/compute/parse-table";
import type { NumberCardData, ParseError } from "@/lib/compute/types";

export interface InterpretResponse {
  ok: true;
  cards: NumberCardData[];
}

export interface InterpretErrorResponse {
  ok: false;
  error: ParseError;
}

/**
 * Raw pasted/uploaded table text -> deterministic computation. No LLM involved
 * here — see PLAN.md's deterministic/LLM guardrail. Fails loudly with a specific
 * error when the input can't be confidently parsed, rather than guessing.
 */
export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: { message: "Request body must be JSON." } } satisfies InterpretErrorResponse,
      { status: 400 },
    );
  }

  const text = (body as { text?: unknown })?.text;
  if (typeof text !== "string" || text.trim() === "") {
    return Response.json(
      { ok: false, error: { message: "Paste or upload a table before submitting." } } satisfies InterpretErrorResponse,
      { status: 400 },
    );
  }

  const parsed = parseDelimitedText(text);
  if (!parsed.ok) {
    return Response.json({ ok: false, error: parsed.error } satisfies InterpretErrorResponse, {
      status: 422,
    });
  }

  const cards = buildNumberCards(parsed.table);
  return Response.json({ ok: true, cards } satisfies InterpretResponse);
}
