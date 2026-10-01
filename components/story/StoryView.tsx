"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PasteOrUploadTable } from "@/components/upload/PasteOrUploadTable";
import { interpretTable } from "@/lib/compute/interpret";
import type { ParseError } from "@/lib/compute/types";
import type { Scenario } from "@/lib/scenarios/scenarios";
import { storyChecks } from "@/lib/story/checks";
import { composeStory, updateSections } from "@/lib/story/compose";
import { deleteDraft, loadDraft, saveDraft } from "@/lib/story/draft-storage";
import { newDraft, type StoryAnswers, type StoryDraft, type StorySource } from "@/lib/story/types";
import { StoryDeck } from "./StoryDeck";
import { StoryPreview } from "./StoryPreview";
import { StoryWizard } from "./StoryWizard";
import { BUTTON } from "./sections";

function draftFromScenario(scenario: Scenario): StoryDraft | null {
  const result = interpretTable(scenario.csv);
  return result.ok ? newDraft({ mode: "practice", scenarioId: scenario.id }, result) : null;
}

/**
 * "Tell the story" (PLAN.md Flow F): guided questions → Hook / Line / Sinker → slides.
 * The draft (computed figures + answers, never the raw table) is kept in this browser's
 * localStorage so a refresh doesn't lose work, and can be deleted at any time.
 */
export function StoryView({ scenario }: { scenario?: Scenario }) {
  const source: StorySource = useMemo(
    () => (scenario ? { mode: "practice", scenarioId: scenario.id } : { mode: "own" }),
    [scenario],
  );
  const isPractice = scenario !== undefined;

  // undefined = not read from storage yet (storage only exists in the browser).
  const [draft, setDraft] = useState<StoryDraft | null | undefined>(undefined);
  const [stage, setStage] = useState<"wizard" | "review">("wizard");
  const [error, setError] = useState<ParseError | null>(null);
  const [saved, setSaved] = useState(true);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [presenting, setPresenting] = useState(false);

  useEffect(() => {
    const stored = loadDraft(source);
    const initial = stored ?? (scenario ? draftFromScenario(scenario) : null);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage can only be read after hydration
    setDraft(initial);
    setStage(initial?.sections ? "review" : "wizard");
  }, [source, scenario]);

  // Autosave, lightly debounced so typing doesn't write on every keystroke.
  useEffect(() => {
    if (!draft) return;
    const timer = setTimeout(() => setSaved(saveDraft(draft)), 300);
    return () => clearTimeout(timer);
  }, [draft]);

  const checks = useMemo(
    () => (draft && draft.sections ? storyChecks(draft.cards, draft.answers, draft.shape) : []),
    [draft],
  );

  if (draft === undefined) {
    return <p className="mx-auto max-w-2xl px-4 py-6 text-sm text-foreground/60">Loading your story…</p>;
  }

  function handleTable(text: string) {
    const result = interpretTable(text);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    if (result.cards.length === 0) {
      setError({ message: "That table parsed fine, but none of its columns looked like numbers to tell a story with." });
      return;
    }
    setDraft(newDraft({ mode: "own" }, result));
    setStage("wizard");
  }

  function handleDelete() {
    deleteDraft(source);
    setConfirmingDelete(false);
    setDraft(scenario ? draftFromScenario(scenario) : null);
    setStage("wizard");
  }

  const update = (patch: (d: StoryDraft) => Partial<StoryDraft>) =>
    setDraft((d) => (d ? { ...d, ...patch(d) } : d));

  function finish() {
    update((d) => ({ sections: updateSections(d.sections, composeStory(d.cards, d.answers)) }));
    setStage("review");
  }

  const outcome = draft?.cards.find((c) => c.name === draft.answers.outcome);
  const drivers = draft
    ? draft.answers.drivers.map((n) => draft.cards.find((c) => c.name === n)).filter((c) => c !== undefined)
    : [];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6">
      {scenario && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-bold">Tell the story: {scenario.title}</h2>
          <p className="text-foreground/80">{scenario.role}</p>
          <p className="text-foreground/80">{scenario.situation}</p>
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="text-sm font-semibold text-foreground/60">Your task</p>
            <p className="mt-1 font-medium text-foreground">{scenario.task}</p>
          </div>
          <Link href={`/practice/${scenario.id}`} className="w-fit text-sm text-foreground/70 underline">
            See this scenario&apos;s numbers explained
          </Link>
        </div>
      )}

      {!scenario && (
        <div className="flex flex-col gap-2">
          <p className="text-foreground/80">
            Turn your numbers into a short story in three parts: a <strong>Hook</strong> that grabs attention, a{" "}
            <strong>Line</strong> that shows the evidence, and a <strong>Sinker</strong> they&apos;ll remember. We&apos;ll ask
            you a few questions, one at a time.
          </p>
          <p className="text-sm text-foreground/70">
            Want to try it on made-up numbers first? <Link href="/practice" className="underline">Pick a practice scenario</Link>.
          </p>
        </div>
      )}

      {draft === null && <PasteOrUploadTable onSubmit={handleTable} />}

      {error && (
        <div className="rounded-lg border border-negative/30 bg-negative/5 p-4 text-sm text-negative">{error.message}</div>
      )}

      {draft && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
            <p className="text-foreground/70" aria-live="polite">
              <span aria-hidden="true">💾</span>{" "}
              {saved ? "Draft saved in this browser only." : "This browser isn't letting us save the draft — it will be lost if you leave."}
            </p>
            {!confirmingDelete ? (
              <button type="button" className="underline" onClick={() => setConfirmingDelete(true)}>
                {isPractice ? "Start again" : "Delete draft"}
              </button>
            ) : (
              <span className="flex items-center gap-2">
                <span>{isPractice ? "Clear your answers?" : "Delete this story and its numbers from this browser?"}</span>
                <button type="button" className={BUTTON} onClick={handleDelete}>
                  Yes, {isPractice ? "clear" : "delete"}
                </button>
                <button type="button" className={BUTTON} onClick={() => setConfirmingDelete(false)}>
                  Cancel
                </button>
              </span>
            )}
          </div>

          {stage === "wizard" || !draft.sections ? (
            <StoryWizard
              cards={draft.cards}
              answers={draft.answers}
              onChange={(answers: StoryAnswers) => update(() => ({ answers }))}
              step={draft.step}
              onStep={(step) => update(() => ({ step }))}
              onFinish={finish}
              practiceKey={scenario?.story}
            />
          ) : (
            <>
              <StoryPreview
                sections={draft.sections}
                onSectionsChange={(sections) => update(() => ({ sections }))}
                checks={checks}
                audience={draft.answers.audience ?? "other"}
                aiConsent={draft.aiConsent}
                onAiConsent={() => update(() => ({ aiConsent: true }))}
                isPractice={isPractice}
                onEditAnswers={() => {
                  update(() => ({ step: 0 }));
                  setStage("wizard");
                }}
                onPresent={() => setPresenting(true)}
              />
              <StoryDeck
                open={presenting}
                onClose={() => setPresenting(false)}
                sections={draft.sections}
                outcome={outcome}
                drivers={drivers}
                isPractice={isPractice}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
