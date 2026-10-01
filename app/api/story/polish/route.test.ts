import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const mockGenerate = vi.fn();
vi.mock("ai", () => ({ generateText: (...args: unknown[]) => mockGenerate(...args) }));

const TEXT = "Activation rate went down from 44.0% to 31.8% — about a quarter lower (27.7%).";

function req(body: unknown): Request {
  return new Request("http://localhost/api/story/polish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function modelSays(text: string) {
  mockGenerate.mockResolvedValue({ text, usage: { inputTokens: 1, outputTokens: 1 } });
}

beforeEach(() => {
  mockGenerate.mockReset();
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/story/polish", () => {
  it("returns a rewrite that keeps every number", async () => {
    modelSays("Activation fell about a quarter (27.7%), from 44.0% to 31.8%.");
    const res = await POST(req({ section: "hook", text: TEXT, audience: "leadership" }));
    expect(await res.json()).toEqual({ ok: true, text: "Activation fell about a quarter (27.7%), from 44.0% to 31.8%." });
  });

  it("sends only the section text and audience to the model", async () => {
    modelSays(TEXT);
    await POST(req({ section: "line", text: TEXT, audience: "team", cards: [{ name: "Secret", values: [1] }] }));
    const call = mockGenerate.mock.calls[0][0] as { prompt: string };
    expect(call.prompt).toContain(TEXT);
    expect(call.prompt).not.toContain("Secret");
  });

  it("rejects a rewrite that changes a number", async () => {
    modelSays("Activation fell about 28%, from 44.0% to 31.8%.");
    const body = await (await POST(req({ section: "hook", text: TEXT, audience: "team" }))).json();
    expect(body).toMatchObject({ ok: false, reason: "changed-numbers" });
  });

  it("rejects a rewrite that adds a number", async () => {
    modelSays(`In 4 weeks: ${TEXT}`);
    const body = await (await POST(req({ section: "hook", text: TEXT, audience: "team" }))).json();
    expect(body).toMatchObject({ ok: false, reason: "changed-numbers" });
  });

  it("rejects a bad body and non-JSON without calling the model", async () => {
    for (const body of [{ section: "intro", text: TEXT, audience: "team" }, { section: "hook", text: "", audience: "team" }, "nope"]) {
      const res = await POST(req(body));
      expect(res.status).toBe(400);
    }
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it("reports the model being unavailable without leaking details", async () => {
    mockGenerate.mockRejectedValue(new Error("gateway down"));
    const res = await POST(req({ section: "sinker", text: TEXT, audience: "other" }));
    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({ ok: false, reason: "unavailable" });
  });
});
