"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { TrendBadge } from "@/components/numbers/TrendBadge";
import type { NumberCardData } from "@/lib/compute/types";
import { suggestRemember } from "@/lib/story/compose";
import { INDICATOR_EXPLAINER, suggestIndicator } from "@/lib/story/indicators";
import type { Audience, IndicatorTag, StoryAnswers } from "@/lib/story/types";
import type { ScenarioStory } from "@/lib/scenarios/scenarios";
import { BUTTON, CHOICE, PRIMARY } from "./sections";

const AUDIENCES: { value: Audience; label: string; hint: string }[] = [
  { value: "leadership", label: "Leadership", hint: "Short and decision-first." },
  { value: "team", label: "My team", hint: "Practical: what happens next." },
  { value: "partners", label: "Cross-functional partners", hint: "What it means for their work." },
  { value: "other", label: "Someone else", hint: "Tell us who." },
];

const TAG_LABELS: Record<IndicatorTag, string> = { leading: "Leading", lagging: "Lagging", unsure: "Not sure" };

const MAX_DRIVERS = 3;
export const STEP_COUNT = 8;

function chosen(selected: boolean) {
  return selected ? "border-foreground bg-surface" : "border-border";
}

function Explainer() {
  return (
    <details className="rounded-lg border border-border p-3 text-sm">
      <summary className="cursor-pointer font-medium">What do leading and lagging mean?</summary>
      <div className="mt-2 flex flex-col gap-2 text-foreground/80">
        <p className="font-medium text-foreground">{INDICATOR_EXPLAINER.summary}</p>
        <p>{INDICATOR_EXPLAINER.leading}</p>
        <p>{INDICATOR_EXPLAINER.lagging}</p>
        <p>
          <span className="font-semibold">Example (not your data): </span>
          {INDICATOR_EXPLAINER.genericExample}
        </p>
        <p>{INDICATOR_EXPLAINER.storyTip}</p>
      </div>
    </details>
  );
}

function MetricLine({ card }: { card: NumberCardData }) {
  return (
    <span className="flex flex-col gap-1">
      <span className="flex flex-wrap items-center gap-2 font-medium">
        {card.name} <TrendBadge meta={card.directionMeta} />
      </span>
      <span className="text-foreground/70">{card.sentence}</span>
    </span>
  );
}

/**
 * The guided questions, one per screen (PLAN.md Flow F). Every step is a fieldset with a legend so
 * screen readers announce the question; focus moves to the question on every step change.
 */
export function StoryWizard({
  cards,
  answers,
  onChange,
  step,
  onStep,
  onFinish,
  practiceKey,
}: {
  cards: NumberCardData[];
  answers: StoryAnswers;
  onChange: (next: StoryAnswers) => void;
  step: number;
  onStep: (step: number) => void;
  onFinish: () => void;
  practiceKey?: ScenarioStory;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const name = useId();
  const [showKey, setShowKey] = useState(false);

  // Move focus to the new question, but not on first load (don't yank focus on arrival).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const set = (patch: Partial<StoryAnswers>) => onChange({ ...answers, ...patch });

  const lagging = cards.filter((c) => answers.tags[c.name] === "lagging");
  const leading = cards.filter((c) => answers.tags[c.name] === "leading" && c.name !== answers.outcome);
  const outcomeCard = cards.find((c) => c.name === answers.outcome);

  function setTag(metric: string, tag: IndicatorTag) {
    const tags = { ...answers.tags, [metric]: tag };
    // Keep later answers consistent with the new tags.
    const outcome = answers.outcome && tags[answers.outcome] === "lagging" ? answers.outcome : null;
    const drivers = answers.drivers.filter((d) => tags[d] === "leading" && d !== outcome);
    onChange({ ...answers, tags, outcome, drivers });
  }

  function toggleDriver(metric: string) {
    const has = answers.drivers.includes(metric);
    if (!has && answers.drivers.length >= MAX_DRIVERS) return;
    set({ drivers: has ? answers.drivers.filter((d) => d !== metric) : [...answers.drivers, metric] });
  }

  function goNext() {
    if (step === 6 && answers.remember.trim() === "" && outcomeCard) {
      // Pre-fill the "one thing to remember" from the outcome's own wording — the PM can edit it.
      set({ remember: suggestRemember(outcomeCard) });
    }
    if (step === STEP_COUNT - 1) onFinish();
    else onStep(step + 1);
  }

  const steps: { title: string; question: string; valid: boolean; optional?: boolean; body: ReactNode }[] = [
    {
      title: "Your audience",
      question: "Who is this story for?",
      valid: answers.audience !== null && (answers.audience !== "other" || answers.audienceOther.trim() !== ""),
      body: (
        <div className="flex flex-col gap-2">
          {AUDIENCES.map((a) => (
            <label key={a.value} className={`${CHOICE} ${chosen(answers.audience === a.value)}`}>
              <input
                type="radio"
                name={`${name}-audience`}
                checked={answers.audience === a.value}
                onChange={() => set({ audience: a.value })}
                className="mt-1"
              />
              <span>
                <span className="font-medium">{a.label}</span>
                <span className="block text-foreground/70">{a.hint}</span>
              </span>
            </label>
          ))}
          {answers.audience === "other" && (
            <label className="flex flex-col gap-1 text-sm">
              Who are they?
              <input
                value={answers.audienceOther}
                onChange={(e) => set({ audienceOther: e.target.value })}
                maxLength={120}
                className="rounded-lg border border-border bg-background p-2"
              />
            </label>
          )}
        </div>
      ),
    },
    {
      title: "Your ask",
      question: "What do you want them to decide or do after hearing this?",
      valid: answers.decision.trim() !== "",
      body: (
        <TextAnswer
          value={answers.decision}
          onChange={(decision) => set({ decision })}
          hint="For example: “Approve two more weeks on onboarding” or “Pause the pricing test”. This becomes the ask in your Sinker."
        />
      ),
    },
    {
      title: "Leading or lagging?",
      question: "For each number, is it an early signal (leading) or a result (lagging)?",
      valid: cards.every((c) => answers.tags[c.name] !== undefined),
      body: (
        <div className="flex flex-col gap-3">
          <Explainer />
          {cards.map((card) => {
            const suggestion = suggestIndicator(card);
            return (
              <fieldset key={card.name} className="flex flex-col gap-2 rounded-lg border border-border p-3 text-sm">
                <legend className="sr-only">{card.name}</legend>
                <MetricLine card={card} />
                {suggestion && (
                  <p className="text-foreground/70">
                    <span className="font-semibold">Suggested — you decide:</span> {TAG_LABELS[suggestion.kind]}.{" "}
                    {suggestion.reason}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {(["leading", "lagging", "unsure"] as const).map((tag) => (
                    <label key={tag} className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 ${chosen(answers.tags[card.name] === tag)}`}>
                      <input
                        type="radio"
                        name={`${name}-tag-${card.name}`}
                        checked={answers.tags[card.name] === tag}
                        onChange={() => setTag(card.name, tag)}
                      />
                      {TAG_LABELS[tag]}
                    </label>
                  ))}
                </div>
              </fieldset>
            );
          })}
          {practiceKey && cards.every((c) => answers.tags[c.name] !== undefined) && (
            <div className="rounded-lg border border-dashed border-border p-3 text-sm">
              {!showKey ? (
                <button type="button" className={BUTTON} onClick={() => setShowKey(true)}>
                  Compare with how we&apos;d tag these
                </button>
              ) : (
                <div className="flex flex-col gap-2" aria-live="polite">
                  <ul className="flex flex-col gap-1">
                    {cards.map((c) => {
                      const ours = practiceKey.tags[c.name];
                      const same = answers.tags[c.name] === ours;
                      return (
                        <li key={c.name}>
                          <span className="font-medium">{c.name}:</span> we&apos;d say {TAG_LABELS[ours].toLowerCase()}{" "}
                          {same ? "— same as you ✓" : `— you said ${TAG_LABELS[answers.tags[c.name]].toLowerCase()}`}
                        </li>
                      );
                    })}
                  </ul>
                  <p className="text-foreground/80">{practiceKey.why}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Your Hook",
      question: "Which ONE result matters most to your audience?",
      valid: answers.outcome !== null,
      body:
        lagging.length === 0 ? (
          <NoneTagged kind="lagging" onBack={() => onStep(2)} />
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-foreground/70">Only numbers you tagged as lagging (results) are shown. This opens your story.</p>
            {lagging.map((card) => (
              <label key={card.name} className={`${CHOICE} ${chosen(answers.outcome === card.name)}`}>
                <input
                  type="radio"
                  name={`${name}-outcome`}
                  checked={answers.outcome === card.name}
                  onChange={() => set({ outcome: card.name, drivers: answers.drivers.filter((d) => d !== card.name) })}
                  className="mt-1"
                />
                <MetricLine card={card} />
              </label>
            ))}
          </div>
        ),
    },
    {
      title: "Your Line",
      question: `Which early signals help explain ${answers.outcome ?? "it"}? Pick up to ${MAX_DRIVERS}.`,
      valid: answers.drivers.length > 0 || leading.length === 0,
      body:
        leading.length === 0 ? (
          <NoneTagged kind="leading" onBack={() => onStep(2)} canContinue />
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-foreground/70">
              Only numbers you tagged as leading are shown. {answers.drivers.length} of {MAX_DRIVERS} picked.
            </p>
            {leading.map((card) => {
              const selected = answers.drivers.includes(card.name);
              return (
                <label key={card.name} className={`${CHOICE} ${chosen(selected)}`}>
                  <input
                    type="checkbox"
                    checked={selected}
                    disabled={!selected && answers.drivers.length >= MAX_DRIVERS}
                    onChange={() => toggleDriver(card.name)}
                    className="mt-1"
                  />
                  <MetricLine card={card} />
                </label>
              );
            })}
          </div>
        ),
    },
    {
      title: "Why it happened",
      question: "What do you think caused this?",
      valid: answers.hypothesisUnknown || answers.hypothesis.trim() !== "",
      optional: true,
      body: (
        <div className="flex flex-col gap-3">
          <TextAnswer
            value={answers.hypothesis}
            disabled={answers.hypothesisUnknown}
            onChange={(hypothesis) => set({ hypothesis })}
            hint="Your best explanation. It will be shown as “We think…”, so it's clear this is a belief, not proof."
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={answers.hypothesisUnknown}
              onChange={(e) => set({ hypothesisUnknown: e.target.checked })}
            />
            I don&apos;t know yet — say so honestly
          </label>
        </div>
      ),
    },
    {
      title: "The stakes",
      question: "What happens if nothing changes?",
      valid: answers.ifNothingChanges.trim() !== "",
      optional: true,
      body: (
        <TextAnswer
          value={answers.ifNothingChanges}
          onChange={(ifNothingChanges) => set({ ifNothingChanges })}
          hint="In words, not new numbers. For example: “We miss the Q3 retention goal” or “Support tickets keep climbing”."
        />
      ),
    },
    {
      title: "Your Sinker",
      question: "What's the one thing they should remember?",
      valid: answers.remember.trim() !== "",
      body: (
        <TextAnswer
          value={answers.remember}
          onChange={(remember) => set({ remember })}
          hint="We've suggested a line from your Hook number. Make it yours — short enough to repeat in the corridor."
        />
      ),
    },
  ];

  const current = steps[step];

  return (
    <section aria-labelledby={`${name}-heading`} className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-foreground/60">
          Step {step + 1} of {STEP_COUNT} — {current.title}
        </p>
        <div
          role="progressbar"
          aria-label="Story progress"
          aria-valuemin={1}
          aria-valuemax={STEP_COUNT}
          aria-valuenow={step + 1}
          aria-valuetext={`Step ${step + 1} of ${STEP_COUNT}`}
          className="h-1.5 overflow-hidden rounded-full bg-border"
        >
          <div className="h-full bg-foreground" style={{ width: `${((step + 1) / STEP_COUNT) * 100}%` }} />
        </div>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3">
          <h2 id={`${name}-heading`} ref={headingRef} tabIndex={-1} className="text-xl font-bold outline-none">
            {current.question}
          </h2>
        </legend>
        {current.body}
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" className={BUTTON} onClick={() => onStep(step - 1)} disabled={step === 0}>
          Back
        </button>
        <div className="flex gap-2">
          {current.optional && !current.valid && (
            <button type="button" className={BUTTON} onClick={goNext}>
              Skip
            </button>
          )}
          <button type="button" className={PRIMARY} onClick={goNext} disabled={!current.valid}>
            {step === STEP_COUNT - 1 ? "See my story" : "Next"}
          </button>
        </div>
      </div>
    </section>
  );
}

function TextAnswer({
  value,
  onChange,
  hint,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  hint: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <textarea
        aria-describedby={`${id}-hint`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={400}
        rows={3}
        className="w-full rounded-lg border border-border bg-background p-3 text-sm disabled:opacity-50"
      />
      <p id={`${id}-hint`} className="text-xs text-foreground/60">
        {hint}
      </p>
    </div>
  );
}

function NoneTagged({ kind, onBack, canContinue }: { kind: "leading" | "lagging"; onBack: () => void; canContinue?: boolean }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-3 text-sm">
      <p>
        {kind === "lagging"
          ? "You haven't tagged any number as lagging (a result). Your Hook needs one result your audience cares about."
          : "You haven't tagged any other number as leading (an early signal). You can continue, and your Line will rest on your explanation — or go back and re-check the tags."}
      </p>
      <button type="button" className={`${BUTTON} w-fit`} onClick={onBack}>
        Go back to tagging
      </button>
      {canContinue && <p className="text-foreground/60">Or press Next to continue without early signals.</p>}
    </div>
  );
}
