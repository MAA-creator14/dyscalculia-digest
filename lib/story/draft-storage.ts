import { STORY_DRAFT_VERSION, type StoryDraft, type StorySource } from "./types";

/**
 * Story drafts live only in this browser's localStorage — computed figures and the PM's answers,
 * never the raw table. Every read/write fails soft (private browsing, disabled storage, quota),
 * like lib/share/client-storage.ts: losing a draft is an inconvenience, not a crash.
 */
export function draftKey(source: StorySource): string {
  return source.mode === "own" ? "story-draft:own" : `story-draft:practice:${source.scenarioId}`;
}

export function loadDraft(source: StorySource): StoryDraft | null {
  try {
    const raw = window.localStorage.getItem(draftKey(source));
    if (!raw) return null;
    const draft = JSON.parse(raw) as StoryDraft;
    // An older shape can't be trusted to render — drop it rather than guess.
    if (draft?.version !== STORY_DRAFT_VERSION || !Array.isArray(draft.cards)) {
      window.localStorage.removeItem(draftKey(source));
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

export function saveDraft(draft: StoryDraft): boolean {
  try {
    window.localStorage.setItem(draftKey(draft.source), JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }));
    return true;
  } catch {
    return false;
  }
}

export function deleteDraft(source: StorySource): void {
  try {
    window.localStorage.removeItem(draftKey(source));
  } catch {
    // Nothing to do — see saveDraft.
  }
}
