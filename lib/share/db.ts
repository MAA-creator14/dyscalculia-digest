import { neon } from "@neondatabase/serverless";
import { generateManageToken, generateViewToken } from "./token";
import type { ManageResult, ShareRecord, SharedInterpretation, ShareViewResult } from "./types";

/**
 * Lazy singleton. A top-level `neon(process.env.DATABASE_URL)` call throws at
 * build time, before Marketplace-provisioned env vars exist — see vercel-storage
 * guidance. Deliberately a plain function + `let`, not a Proxy: Proxy wrappers
 * around DB clients can break libraries that inspect the client object's shape.
 */
let sqlClient: ReturnType<typeof neon> | null = null;
function getSql() {
  if (!sqlClient) {
    sqlClient = neon(process.env.DATABASE_URL!);
  }
  return sqlClient;
}

interface ShareRow {
  token: string;
  manage_token: string;
  interpretation: SharedInterpretation;
  commentary: string | null;
  revoked: boolean;
  created_at: string;
  updated_at: string;
}

function toRecord(row: ShareRow): ShareRecord {
  return {
    token: row.token,
    interpretation: row.interpretation,
    commentary: row.commentary,
    revoked: row.revoked,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Whitespace-only commentary normalizes to "none," implemented once here so both
 * the create and edit paths satisfy Story 1 AC1 regardless of caller.
 */
function normalizeCommentary(commentary: string | null | undefined): string | null {
  if (commentary == null) return null;
  return commentary.trim() === "" ? null : commentary;
}

export async function createShare(
  interpretation: SharedInterpretation,
  commentary: string | null | undefined,
): Promise<{ token: string; manageToken: string }> {
  const sql = getSql();
  const token = generateViewToken();
  const manageToken = generateManageToken();
  await sql`
    insert into share_links (token, manage_token, interpretation, commentary)
    values (${token}, ${manageToken}, ${JSON.stringify(interpretation)}, ${normalizeCommentary(commentary)})
  `;
  return { token, manageToken };
}

export async function getShareByToken(token: string): Promise<ShareRecord | null> {
  const sql = getSql();
  const rows = (await sql`
    select token, manage_token, interpretation, commentary, revoked, created_at, updated_at
    from share_links where token = ${token}
  `) as ShareRow[];
  return rows[0] ? toRecord(rows[0]) : null;
}

/**
 * The single choke point implementing revoked/never-issued parity (Story 3 AC2):
 * both cases collapse into the identical `{ status: "unavailable" }`, with no
 * reason field, so the page component can't leak the distinction even by accident.
 */
export async function resolveShareForView(token: string): Promise<ShareViewResult> {
  const record = await getShareByToken(token);
  if (!record || record.revoked) {
    return { status: "unavailable" };
  }
  return { status: "active", record };
}

export async function updateCommentaryByManageToken(
  token: string,
  manageToken: string,
  commentary: string | null,
): Promise<ManageResult> {
  const sql = getSql();
  // "and revoked = false" enforces Story 1 AC3: commentary is editable "up until
  // revocation" — a revoked share collapses into the same "not_found" result as
  // a wrong manageToken, since there's nothing more for the caller to learn either way.
  const rows = (await sql`
    update share_links
    set commentary = ${normalizeCommentary(commentary)}, updated_at = now()
    where token = ${token} and manage_token = ${manageToken} and revoked = false
    returning token
  `) as { token: string }[];
  return rows.length > 0 ? "ok" : "not_found";
}

export async function revokeByManageToken(token: string, manageToken: string): Promise<ManageResult> {
  const sql = getSql();
  const rows = (await sql`
    update share_links
    set revoked = true, updated_at = now()
    where token = ${token} and manage_token = ${manageToken}
    returning token
  `) as { token: string }[];
  return rows.length > 0 ? "ok" : "not_found";
}
