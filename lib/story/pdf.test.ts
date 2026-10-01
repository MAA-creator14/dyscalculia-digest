import { describe, expect, it } from "vitest";
import { interpretTable } from "@/lib/compute/interpret";
import { getScenario } from "@/lib/scenarios/scenarios";
import { buildStoryPdf, pdfFileName, pdfSafe } from "./pdf";
import type { StorySection } from "./types";

function section(kind: StorySection["kind"], text: string): StorySection {
  return { kind, template: text, text, edited: false };
}

describe("pdfSafe", () => {
  it("turns arrows into words and drops characters the PDF fonts can't draw", () => {
    expect(pdfSafe("44.0% → 31.8% 🚀 — “ok” £5 • done…")).toBe("44.0% to 31.8%  — “ok” £5 • done…");
  });
});

describe("pdfFileName", () => {
  it("slugs the title", () => {
    expect(pdfFileName("Tell the story: Revenue's fine… isn't it?")).toBe("tell-the-story-revenue-s-fine-isn-t-it.pdf");
    expect(pdfFileName("🚀")).toBe("data-story.pdf");
  });
});

describe("buildStoryPdf", () => {
  it("makes three pages that contain the story text and the exact figures", async () => {
    const result = interpretTable(getScenario("trial-invites-conversion")!.csv);
    if (!result.ok) throw new Error(result.error.message);
    const outcome = result.cards.find((c) => c.name === "Paid conversions")!;
    const drivers = result.cards.filter((c) => c.name === "Invites sent");
    const doc = await buildStoryPdf({
      sections: {
        hook: section("hook", outcome.sentence),
        line: section("line", `What moved first:\n• ${drivers[0].sentence}`),
        sinker: section("sinker", "Decision needed: Put invites back in setup."),
      },
      outcome,
      drivers,
      isPractice: true,
      title: "Test story",
    });
    expect(doc.getNumberOfPages()).toBe(3);
    const raw = doc.output();
    for (const fragment of ["Paid conversions went down from 64 to 44", "960 to 540", "Put invites back in setup", "Practice data", "Slide 3 of 3"]) {
      expect(raw).toContain(fragment);
    }
  });
});
