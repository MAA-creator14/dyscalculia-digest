import type { DatasetShape } from "@/lib/compute/dataset-shape";
import type { ExecSummaryData, NumberCardData } from "@/lib/compute/types";

/** Leading indicators move first and can be acted on; lagging indicators report the result afterwards. */
export type IndicatorKind = "leading" | "lagging";

export type IndicatorTag = IndicatorKind | "unsure";

export type Audience = "leadership" | "team" | "partners" | "other";

export type SectionKind = "hook" | "line" | "sinker";

export const SECTION_KINDS: SectionKind[] = ["hook", "line", "sinker"];

/** Everything the PM tells the wizard. Free text is theirs; metric names refer to `NumberCardData.name`. */
export interface StoryAnswers {
  audience: Audience | null;
  audienceOther: string;
  /** The decision or action they want from the audience. */
  decision: string;
  tags: Record<string, IndicatorTag>;
  /** One lagging metric the Hook is built on. */
  outcome: string | null;
  /** 1–3 leading metrics the Line uses to explain the outcome. */
  drivers: string[];
  hypothesis: string;
  hypothesisUnknown: boolean;
  ifNothingChanges: string;
  remember: string;
}

export interface StorySection {
  kind: SectionKind;
  /** Deterministic text from composeStory — what "Reset" goes back to. */
  template: string;
  /** What's shown: the template, the PM's edit, or an accepted AI polish. */
  text: string;
  edited: boolean;
}

export type StorySource = { mode: "own" } | { mode: "practice"; scenarioId: string };

export const STORY_DRAFT_VERSION = 1;

/** A story in progress. Holds computed figures only — never the raw pasted table. */
export interface StoryDraft {
  version: typeof STORY_DRAFT_VERSION;
  source: StorySource;
  cards: NumberCardData[];
  execSummary: ExecSummaryData | null;
  periodLabels: string[] | null;
  shape: DatasetShape;
  answers: StoryAnswers;
  /** Null until the PM finishes the wizard for the first time. */
  sections: Record<SectionKind, StorySection> | null;
  step: number;
  /** Per-draft consent for AI polish (always true in practice mode). */
  aiConsent: boolean;
  updatedAt: string;
}

export function emptyAnswers(): StoryAnswers {
  return {
    audience: null,
    audienceOther: "",
    decision: "",
    tags: {},
    outcome: null,
    drivers: [],
    hypothesis: "",
    hypothesisUnknown: false,
    ifNothingChanges: "",
    remember: "",
  };
}

export function newDraft(
  source: StorySource,
  data: { cards: NumberCardData[]; execSummary: ExecSummaryData | null; periodLabels: string[] | null; shape: DatasetShape },
): StoryDraft {
  return {
    version: STORY_DRAFT_VERSION,
    source,
    ...data,
    answers: emptyAnswers(),
    sections: null,
    step: 0,
    aiConsent: source.mode === "practice",
    updatedAt: new Date().toISOString(),
  };
}
