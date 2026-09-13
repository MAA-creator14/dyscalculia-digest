import { describe, expect, it } from "vitest";
import { generateManageToken, generateToken, generateViewToken } from "./token";

const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;

describe("generateToken", () => {
  it("produces a base64url string with no padding characters", () => {
    const token = generateToken(24);
    expect(token).toMatch(BASE64URL_PATTERN);
    expect(token).not.toContain("=");
  });

  it("produces tokens of the expected length for a given byte length", () => {
    expect(generateToken(24)).toHaveLength(32);
    expect(generateToken(32)).toHaveLength(43);
  });

  it("is not derived from a sequence — repeated calls differ", () => {
    const tokens = new Set(Array.from({ length: 50 }, () => generateToken(24)));
    expect(tokens.size).toBe(50);
  });
});

describe("generateViewToken / generateManageToken", () => {
  it("gives the manage token strictly higher entropy than the view token", () => {
    const view = generateViewToken();
    const manage = generateManageToken();
    expect(manage.length).toBeGreaterThan(view.length);
  });

  it("never produces the same value for view and manage tokens in practice", () => {
    const pairs = Array.from({ length: 20 }, () => [generateViewToken(), generateManageToken()]);
    for (const [view, manage] of pairs) {
      expect(view).not.toBe(manage);
    }
  });
});
