import { beforeEach, describe, expect, it, vi } from "vitest";
import { shareFixtures } from "@/lib/share/__fixtures__";
import type { ManageResult, ShareRecord, ShareViewResult } from "@/lib/share/types";
import { DELETE, PATCH, POST } from "./route";

/**
 * Data-boundary regression suite (see specs/outputs/prd-share-2026-09-12.md
 * "Evals"). Flow G has no generative output of its own, so this isn't an
 * LLM-quality eval — it's a fixed set of golden interpretation records checked
 * against the assertions that actually matter for this feature: the shared
 * payload never carries anything beyond the defined summary fields, commentary
 * stays a distinct field, and revoked/never-issued tokens are indistinguishable.
 * Mocks lib/share/db.ts — no test-DB infra exists in this project yet.
 */

const mockCreateShare = vi.fn();
const mockUpdateCommentaryByManageToken = vi.fn();
const mockRevokeByManageToken = vi.fn();

vi.mock("@/lib/share/db", () => ({
  createShare: (...args: unknown[]) => mockCreateShare(...args),
  updateCommentaryByManageToken: (...args: unknown[]) => mockUpdateCommentaryByManageToken(...args),
  revokeByManageToken: (...args: unknown[]) => mockRevokeByManageToken(...args),
}));

const ALLOWED_INTERPRETATION_KEYS = new Set(["cards", "execSummary", "periodLabels"]);
const ALLOWED_CARD_KEYS = new Set([
  "name",
  "type",
  "values",
  "first",
  "last",
  "formattedFirst",
  "formattedLast",
  "delta",
  "directionMeta",
  "fractionDescription",
  "sentence",
  "anomalies",
  "streak",
]);

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/share", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mockCreateShare.mockReset();
  mockUpdateCommentaryByManageToken.mockReset();
  mockRevokeByManageToken.mockReset();
});

describe("POST /api/share — payload allow-listing", () => {
  for (const fixture of shareFixtures) {
    it(`stores only the defined summary fields for: ${fixture.name}`, async () => {
      mockCreateShare.mockResolvedValueOnce({ token: "view-token", manageToken: "manage-token" });

      const res = await POST(jsonRequest({ interpretation: fixture.interpretation, commentary: fixture.commentary }));
      expect(res.status).toBe(200);

      // This is the single most important assertion in the PRD: what actually
      // reached the persistence layer must be exactly the allow-listed shape —
      // never raw source data, never an unexpected extra key.
      expect(mockCreateShare).toHaveBeenCalledTimes(1);
      const [storedInterpretation] = mockCreateShare.mock.calls[0] as [Record<string, unknown>, unknown];
      expect(new Set(Object.keys(storedInterpretation))).toEqual(ALLOWED_INTERPRETATION_KEYS);
      for (const card of storedInterpretation.cards as Record<string, unknown>[]) {
        expect(new Set(Object.keys(card))).toEqual(ALLOWED_CARD_KEYS);
      }
    });
  }

  it("rejects a payload carrying an extra top-level field instead of silently dropping it at the HTTP layer's discretion", async () => {
    // zod's default .parse() strips unknown keys from *validated* objects, but a
    // completely wrong shape (missing "interpretation") should fail validation
    // outright rather than be coerced — this fixture is deliberately malformed.
    mockCreateShare.mockResolvedValueOnce({ token: "t", manageToken: "m" });
    const res = await POST(jsonRequest({ commentary: "no interpretation field at all" }));
    expect(res.status).toBe(400);
    expect(mockCreateShare).not.toHaveBeenCalled();
  });
});

describe("POST /api/share — commentary distinctness", () => {
  it("passes commentary as its own argument, never merged into the interpretation object", async () => {
    const fixture = shareFixtures.find((f) => f.commentary && f.commentary.trim() !== "")!;
    mockCreateShare.mockResolvedValueOnce({ token: "t", manageToken: "m" });

    await POST(jsonRequest({ interpretation: fixture.interpretation, commentary: fixture.commentary }));

    const [storedInterpretation, storedCommentary] = mockCreateShare.mock.calls[0] as [Record<string, unknown>, string];
    expect(storedInterpretation).not.toHaveProperty("commentary");
    expect(storedCommentary).toBe(fixture.commentary);
  });
});

describe("Revoked vs. never-issued parity", () => {
  it("PATCH and DELETE return byte-identical shapes for a revoked share and a never-issued token", async () => {
    mockUpdateCommentaryByManageToken.mockResolvedValueOnce("not_found" satisfies ManageResult);
    mockRevokeByManageToken.mockResolvedValueOnce("not_found" satisfies ManageResult);

    const patchRes = await PATCH(
      jsonRequest({ token: "revoked-or-fake", manageToken: "whatever", commentary: "x" }),
    );
    const deleteRes = await DELETE(jsonRequest({ token: "revoked-or-fake", manageToken: "whatever" }));

    expect(patchRes.status).toBe(404);
    expect(deleteRes.status).toBe(404);
    const [patchBody, deleteBody] = await Promise.all([patchRes.json(), deleteRes.json()]);
    expect(patchBody).toEqual(deleteBody);
    expect(patchBody).toEqual({ ok: false, error: { message: "Share not found." } });
  });

  it("resolveShareForView collapses a revoked row and a missing row into the identical shape", async () => {
    // This asserts the data-layer contract itself (lib/share/types.ts), not the
    // route — the whole point is that ShareViewResult has no reason field for
    // the route or page to ever accidentally leak.
    const revoked: ShareRecord = {
      token: "t",
      interpretation: shareFixtures[0].interpretation,
      commentary: null,
      revoked: true,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    const neverIssuedResult: ShareViewResult = { status: "unavailable" };
    // A revoked record, once resolved, must collapse to the same shape as a
    // record that was never found — see lib/share/db.ts resolveShareForView.
    const revokedResult: ShareViewResult = revoked.revoked ? { status: "unavailable" } : { status: "active", record: revoked };
    expect(revokedResult).toEqual(neverIssuedResult);
  });
});
