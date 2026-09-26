import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const mockRecord = vi.fn();
vi.mock("@/lib/feedback/db", () => ({
  recordScenarioFeedback: (...args: unknown[]) => mockRecord(...args),
}));

const EVENT_ID = "3f2b8c1e-5d4a-4b6f-9a7e-1c2d3e4f5a6b";
const VALID = {
  eventId: EVENT_ID,
  scenarioId: "churn-creeping-up",
  answeredCorrectly: true,
  confidence: 4,
  comment: "The streak line helped.",
};

function req(body: unknown): Request {
  return new Request("http://localhost/api/scenario-feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => mockRecord.mockReset());

describe("POST /api/scenario-feedback", () => {
  it("records valid scenario feedback", async () => {
    const res = await POST(req(VALID));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(mockRecord).toHaveBeenCalledWith(VALID);
  });

  it("accepts comment-only feedback on the user's own data (no scenario)", async () => {
    const body = { eventId: EVENT_ID, scenarioId: null, answeredCorrectly: null, confidence: null, comment: "Confusing" };
    const res = await POST(req(body));
    expect(res.status).toBe(200);
    expect(mockRecord).toHaveBeenCalledWith(body);
  });

  it("drops extra fields so dataset content never reaches the database", async () => {
    await POST(req({ ...VALID, cards: [{ name: "Revenue", values: [1, 2, 3] }], csv: "a,b\n1,2" }));
    expect(Object.keys(mockRecord.mock.calls[0][0]).sort()).toEqual([
      "answeredCorrectly",
      "comment",
      "confidence",
      "eventId",
      "scenarioId",
    ]);
  });

  it("rejects unknown scenarios, out-of-range confidence, overlong comments, empty feedback and non-JSON", async () => {
    for (const body of [
      { ...VALID, scenarioId: "made-up" },
      { ...VALID, confidence: 6 },
      { ...VALID, comment: "x".repeat(1001) },
      { eventId: EVENT_ID, scenarioId: null, answeredCorrectly: null, confidence: null, comment: "  " },
      { ...VALID, eventId: "not-a-uuid" },
      "not json",
    ]) {
      const res = await POST(req(body));
      expect(res.status).toBe(400);
    }
    expect(mockRecord).not.toHaveBeenCalled();
  });

  it("returns a 500 with a message when the database write fails", async () => {
    mockRecord.mockRejectedValueOnce(new Error("db down"));
    const res = await POST(req(VALID));
    expect(res.status).toBe(500);
    expect((await res.json()).ok).toBe(false);
  });
});
