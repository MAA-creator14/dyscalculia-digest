import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const mockRecord = vi.fn();
vi.mock("@/lib/feedback/db", () => ({
  recordSuggestionRating: (...args: unknown[]) => mockRecord(...args),
}));

const EVENT_ID = "3f2b8c1e-5d4a-4b6f-9a7e-1c2d3e4f5a6b";

function req(body: unknown): Request {
  return new Request("http://localhost/api/suggestion-feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => mockRecord.mockReset());

describe("POST /api/suggestion-feedback", () => {
  it("records a valid rating", async () => {
    const res = await POST(req({ eventId: EVENT_ID, ruleId: "streak", rating: "up" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(mockRecord).toHaveBeenCalledWith({ eventId: EVENT_ID, ruleId: "streak", rating: "up" });
  });

  it("stores only the rule id, rating and anonymous id — extra fields never reach the database (Story 3 AC2)", async () => {
    await POST(
      req({
        eventId: EVENT_ID,
        ruleId: "biggest-mover",
        rating: "down",
        text: "Which period had the biggest change in Revenue?",
        cards: [{ name: "Revenue", values: [1, 2, 3] }],
      }),
    );
    expect(mockRecord).toHaveBeenCalledTimes(1);
    expect(Object.keys(mockRecord.mock.calls[0][0]).sort()).toEqual(["eventId", "rating", "ruleId"]);
  });

  it("rejects an unknown rule id, a bad rating, a non-uuid id, and non-JSON", async () => {
    for (const body of [
      { eventId: EVENT_ID, ruleId: "made-up", rating: "up" },
      { eventId: EVENT_ID, ruleId: "streak", rating: "meh" },
      { eventId: "not-a-uuid", ruleId: "streak", rating: "up" },
      "not json",
    ]) {
      const res = await POST(req(body));
      expect(res.status).toBe(400);
    }
    expect(mockRecord).not.toHaveBeenCalled();
  });

  it("returns a 500 with a message when the database write fails", async () => {
    mockRecord.mockRejectedValueOnce(new Error("db down"));
    const res = await POST(req({ eventId: EVENT_ID, ruleId: "streak", rating: "up" }));
    expect(res.status).toBe(500);
    expect((await res.json()).ok).toBe(false);
  });
});
