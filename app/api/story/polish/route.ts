import { generateText } from "ai";
import { CHAT_MODEL } from "@/lib/ai/gateway";
import { sameNumbers } from "@/lib/story/numbers";
import { polishBodySchema, type PolishBody, type PolishResponse } from "@/lib/story/polish";

export const maxDuration = 30;

const SECTION_GOAL: Record<PolishBody["section"], string> = {
  hook: "the Hook: grab attention and make a promise of what's coming",
  line: "the Line: deliver on the promise — the evidence and the explanation",
  sinker: "the Sinker: the one thing they should remember, and the ask",
};

const AUDIENCE: Record<PolishBody["audience"], string> = {
  leadership: "senior leadership — short, decision-first",
  team: "the PM's own team — practical, what happens next",
  partners: "cross-functional partners — what it means for their work",
  other: "a general business audience",
};

const INSTRUCTIONS = `You improve the wording of one section of a product manager's data story, written in the Hook / Line / Sinker format.

Rules — follow all of them:
- Keep every number exactly as written: same digits, decimals, symbols and percent signs. Don't round, convert, drop or add any number, and don't write numbers as words or words as numbers.
- Don't add facts, causes, claims or metrics that aren't in the text. Don't calculate anything.
- Keep any "We think" or "We don't know why yet" wording, so a belief is never presented as a finding.
- Plain, short sentences. No jargon, no hype, no emoji. Keep bullet points ("• ") if the text has them.
- Reply with the rewritten section only — no preamble, quotes or explanation.`;

function log(level: "info" | "error", event: string, fields: Record<string, unknown>): void {
  console[level](JSON.stringify({ event, ...fields }));
}

/**
 * Optional "Improve with AI" for one story section (PLAN.md Flow F). Receives only that section's
 * text and the chosen audience — never cards or the table. The rewrite is rejected unless it
 * contains exactly the same numbers as the original, so the model can phrase but never compute.
 */
export async function POST(request: Request): Promise<Response> {
  const startedAt = Date.now();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, reason: "bad-request", message: "Request body must be JSON." } satisfies PolishResponse,
      { status: 400 },
    );
  }

  const parsed = polishBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, reason: "bad-request", message: "Polish request is missing or malformed." } satisfies PolishResponse,
      { status: 400 },
    );
  }
  const { section, text, audience } = parsed.data;

  try {
    const result = await generateText({
      model: CHAT_MODEL,
      instructions: INSTRUCTIONS,
      prompt: `This is ${SECTION_GOAL[section]}. The audience is ${AUDIENCE[audience]}.\n\nSection text:\n${text}`,
    });
    const rewrite = result.text.trim();
    const locked = rewrite !== "" && sameNumbers(text, rewrite);

    // Metadata only — never the story text.
    log("info", "story.polish", {
      section,
      audience,
      inputLength: text.length,
      outputLength: rewrite.length,
      accepted: locked,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      durationMs: Date.now() - startedAt,
    });

    if (!locked) {
      return Response.json({
        ok: false,
        reason: "changed-numbers",
        message: "The AI version changed or added a number, so we kept your wording.",
      } satisfies PolishResponse);
    }
    return Response.json({ ok: true, text: rewrite } satisfies PolishResponse);
  } catch (error) {
    log("error", "story.polish.error", {
      message: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startedAt,
    });
    return Response.json(
      { ok: false, reason: "unavailable", message: "Couldn't reach the AI model just now. Your wording is unchanged." } satisfies PolishResponse,
      { status: 502 },
    );
  }
}
