import type { SectionKind } from "@/lib/story/types";

/**
 * One source of wording and accent colour for the three sections, shared by the review screen,
 * the slides and copy-as-text. Each section is always labelled with its number and name — the
 * colour is only a reinforcement.
 */
export const SECTION_META: Record<SectionKind, { number: number; label: string; goal: string; text: string; border: string; bg: string }> = {
  hook: {
    number: 1,
    label: "Hook",
    goal: "Grabs attention and promises what's coming.",
    text: "text-hook",
    border: "border-hook",
    bg: "bg-hook/10",
  },
  line: {
    number: 2,
    label: "Line",
    goal: "Delivers on the promise with the evidence.",
    text: "text-line",
    border: "border-line",
    bg: "bg-line/10",
  },
  sinker: {
    number: 3,
    label: "Sinker",
    goal: "What they remember, and what you need from them.",
    text: "text-sinker",
    border: "border-sinker",
    bg: "bg-sinker/10",
  },
};

export const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
export const BUTTON = `rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface disabled:opacity-50 ${FOCUS}`;
export const PRIMARY = `rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-50 ${FOCUS}`;
export const CHOICE = "flex items-start gap-2 rounded-md border px-3 py-2 text-sm";
