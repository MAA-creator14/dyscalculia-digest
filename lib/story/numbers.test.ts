import { describe, expect, it } from "vitest";
import { extractNumberTokens, sameNumbers } from "./numbers";

describe("extractNumberTokens", () => {
  it("finds percents, grouped counts and currency, without trailing punctuation", () => {
    expect(extractNumberTokens("Signups went up from 1,210 to 1,330, then $41,200.00 and 44.0% (27.7%).")).toEqual(
      ["$41,200.00", "1,210", "1,330", "27.7%", "44.0%"].sort(),
    );
  });

  it("returns nothing for text without digits", () => {
    expect(extractNumberTokens("about a quarter lower")).toEqual([]);
  });
});

describe("sameNumbers", () => {
  const original = "Activation rate went down from 44.0% to 31.8% — about a quarter lower (27.7%).";

  it("accepts a rewording that keeps every number", () => {
    expect(sameNumbers(original, "Activation fell about a quarter (27.7%): from 44.0% to 31.8%.")).toBe(true);
  });

  it("rejects a changed, rounded, dropped or added number", () => {
    expect(sameNumbers(original, "Activation went down from 44.0% to 31.8%, about 28% lower.")).toBe(false);
    expect(sameNumbers(original, "Activation went down from 44% to 31.8% (27.7%).")).toBe(false);
    expect(sameNumbers(original, "Activation went down from 44.0% to 31.8%.")).toBe(false);
    expect(sameNumbers(original, "In 4 weeks activation went down from 44.0% to 31.8% (27.7%).")).toBe(false);
  });
});
