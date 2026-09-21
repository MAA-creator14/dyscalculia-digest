import { describe, expect, it } from "vitest";
import { SAMPLES } from "@/lib/compute/__fixtures__/samples";
import { POST, type InterpretResponse } from "./route";

async function interpret(text: string): Promise<InterpretResponse> {
  const res = await POST(
    new Request("http://localhost/api/interpret", { method: "POST", body: JSON.stringify({ text }) }),
  );
  return (await res.json()) as InterpretResponse;
}

const sample = (id: string) => SAMPLES.find((s) => s.id === id)!.csv;

describe("POST /api/interpret shape field", () => {
  it("returns a trustworthy shape for a clean weekly series", async () => {
    const data = await interpret(sample("weekly-kpi"));
    expect(data.shape.periodsTrustworthy).toBe(true);
    expect(data.shape.columns.map((c) => c.name)).toContain("Signups");
  });

  it("returns text columns that never become cards, and no periods, for a channel breakdown", async () => {
    const data = await interpret(sample("channel-breakdown"));
    expect(data.shape.periodsTrustworthy).toBe(false);
    expect(data.shape.columns).toContainEqual({ name: "Channel", type: "string" });
    expect(data.cards.map((c) => c.name)).not.toContain("Channel");
  });

  it("adds no cell values beyond what cards and period labels already carry", async () => {
    const data = await interpret(sample("retention-triangle"));
    const shapeJson = JSON.stringify(data.shape);
    expect(shapeJson).not.toContain("Jan 2026");
    expect(shapeJson).not.toContain("41%");
  });
});
