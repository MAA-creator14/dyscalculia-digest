import { createShare, revokeByManageToken, updateCommentaryByManageToken } from "@/lib/share/db";
import { createShareBodySchema, manageShareBodySchema, updateCommentaryBodySchema } from "@/lib/share/validation";

export interface CreateShareResponse {
  ok: true;
  token: string;
  manageToken: string;
}

export interface ShareErrorResponse {
  ok: false;
  error: { message: string };
}

/**
 * Only POST/PATCH/DELETE — no GET. The read path is served by
 * app/share/[token]/page.tsx calling lib/share/db.ts directly, so a reader's
 * browser makes zero requests beyond the initial page HTML (see PRD §"How It
 * Works"). Follows the same `{ ok: true, ... } | { ok: false, error }`
 * convention as app/api/interpret/route.ts.
 */
export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: { message: "Request body must be JSON." } } satisfies ShareErrorResponse,
      { status: 400 },
    );
  }

  const parsed = createShareBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: { message: "Interpretation payload is missing or malformed." } } satisfies ShareErrorResponse,
      { status: 400 },
    );
  }

  const { token, manageToken } = await createShare(parsed.data.interpretation, parsed.data.commentary);
  return Response.json({ ok: true, token, manageToken } satisfies CreateShareResponse);
}

export async function PATCH(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: { message: "Request body must be JSON." } } satisfies ShareErrorResponse,
      { status: 400 },
    );
  }

  const parsed = updateCommentaryBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: { message: "token, manageToken, and commentary are required." } } satisfies ShareErrorResponse,
      { status: 400 },
    );
  }

  const result = await updateCommentaryByManageToken(parsed.data.token, parsed.data.manageToken, parsed.data.commentary);
  if (result === "not_found") {
    // Deliberately generic — collapses "token doesn't exist" and "wrong manageToken"
    // into one shape so a leaked view-token can't be used to probe for a manage endpoint.
    return Response.json({ ok: false, error: { message: "Share not found." } } satisfies ShareErrorResponse, {
      status: 404,
    });
  }
  return Response.json({ ok: true } as const);
}

export async function DELETE(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: { message: "Request body must be JSON." } } satisfies ShareErrorResponse,
      { status: 400 },
    );
  }

  const parsed = manageShareBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: { message: "token and manageToken are required." } } satisfies ShareErrorResponse,
      { status: 400 },
    );
  }

  const result = await revokeByManageToken(parsed.data.token, parsed.data.manageToken);
  if (result === "not_found") {
    return Response.json({ ok: false, error: { message: "Share not found." } } satisfies ShareErrorResponse, {
      status: 404,
    });
  }
  return Response.json({ ok: true } as const);
}
