import { describe, expect, it } from "vitest";
import { suggestIndicator } from "./indicators";

describe("suggestIndicator", () => {
  it.each([
    ["Revenue", "lagging"],
    ["MRR", "lagging"],
    ["Monthly churn rate", "lagging"],
    ["Month-3 retention", "lagging"],
    ["Paid conversions", "lagging"],
    ["Active customers", "lagging"],
    ["Signups", "leading"],
    ["Activation rate", "leading"],
    ["Week-1 active users", "leading"],
    ["New customers", "leading"],
    ["Invites sent", "leading"],
    ["Trial projects created", "leading"],
    ["NPS", "leading"],
  ])("%s → %s", (name, kind) => {
    expect(suggestIndicator({ name })?.kind).toBe(kind);
  });

  it("returns null rather than guessing when nothing matches", () => {
    expect(suggestIndicator({ name: "Widgets" })).toBeNull();
  });
});
