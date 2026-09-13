import { randomBytes } from "node:crypto";

/**
 * CSPRNG-sourced token, not derived from a sequence/timestamp — this is what makes
 * a token non-enumerable (see PRD "Evals" section and Story 2/3 acceptance criteria),
 * not any secrecy of the generation scheme itself.
 */
export function generateToken(byteLength: number): string {
  return randomBytes(byteLength).toString("base64url");
}

/** 192 bits — read-only credential, embedded in the shareable URL. */
export function generateViewToken(): string {
  return generateToken(24);
}

/** 256 bits — deliberately higher entropy than the view token, since it grants
 * edit+revoke and, unlike the view token, is never meant to circulate at all. */
export function generateManageToken(): string {
  return generateToken(32);
}
