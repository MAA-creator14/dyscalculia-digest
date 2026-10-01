import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deleteDraft, draftKey, loadDraft, saveDraft } from "./draft-storage";
import { newDraft } from "./types";

const shape = { periodsTrustworthy: true, reason: "ok" as const, rowCount: 0, columns: [] };

function memoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    store,
  };
}

let storage: ReturnType<typeof memoryStorage>;
beforeEach(() => {
  storage = memoryStorage();
  vi.stubGlobal("window", { localStorage: storage });
});
afterEach(() => vi.unstubAllGlobals());

describe("draft storage", () => {
  it("round-trips a draft per source", () => {
    const own = newDraft({ mode: "own" }, { cards: [], execSummary: null, periodLabels: null, shape });
    const practice = newDraft({ mode: "practice", scenarioId: "x" }, { cards: [], execSummary: null, periodLabels: null, shape });
    expect(saveDraft(own)).toBe(true);
    saveDraft(practice);
    expect(loadDraft({ mode: "own" })?.source).toEqual({ mode: "own" });
    expect(loadDraft({ mode: "practice", scenarioId: "x" })?.aiConsent).toBe(true);
    expect(loadDraft({ mode: "own" })?.aiConsent).toBe(false);
    deleteDraft({ mode: "own" });
    expect(loadDraft({ mode: "own" })).toBeNull();
  });

  it("drops a draft from an older version instead of rendering it", () => {
    storage.setItem(draftKey({ mode: "own" }), JSON.stringify({ version: 0, cards: [] }));
    expect(loadDraft({ mode: "own" })).toBeNull();
    expect(storage.store.size).toBe(0);
  });

  it("fails soft when storage throws", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => {
          throw new Error("blocked");
        },
        setItem: () => {
          throw new Error("quota");
        },
        removeItem: () => {
          throw new Error("blocked");
        },
      },
    });
    expect(loadDraft({ mode: "own" })).toBeNull();
    expect(saveDraft(newDraft({ mode: "own" }, { cards: [], execSummary: null, periodLabels: null, shape }))).toBe(false);
    expect(() => deleteDraft({ mode: "own" })).not.toThrow();
  });
});
