"use client";

import { useState } from "react";
import { ExecSummary } from "@/components/numbers/ExecSummary";
import { NumberCard } from "@/components/numbers/NumberCard";
import { ShareUnavailable } from "@/components/share/ShareUnavailable";
import { cleanNote, LinkBar, NoteText, STORAGE_NOTICE, usePublish, useSampleResult } from "../_shared";

// Variant B — a three-step briefing builder: choose what to send, answer three structured questions, check and publish.

const STEPS = ["Pick the numbers", "Say what you think", "Check and publish"];
const FIELDS = [
  { id: "happened", label: "What happened", hint: "In your words, the story the numbers tell." },
  { id: "means", label: "What I think it means", hint: "Your interpretation or recommendation." },
  { id: "need", label: "What I need from you", hint: "A decision, a check, or nothing — optional." },
] as const;
type FieldId = (typeof FIELDS)[number]["id"];

export default function BriefingWizard() {
  const result = useSampleResult();
  const pub = usePublish();
  const [step, setStep] = useState(1);
  const [included, setIncluded] = useState<Set<string>>(() => new Set(result.cards.map((c) => c.name)));
  const [includeSummary, setIncludeSummary] = useState(true);
  const [text, setText] = useState<Record<FieldId, string>>({ happened: "", means: "", need: "" });
  const [updated, setUpdated] = useState(false);

  const chosen = result.cards.filter((c) => included.has(c.name));
  const sections = FIELDS.map((f) => ({ ...f, value: cleanNote(text[f.id]) })).filter((f) => f.value !== "");
  const canNext = step === 1 ? chosen.length > 0 : true;

  const recipient = pub.published && pub.revoked ? (
    <ShareUnavailable />
  ) : (
    <div className="flex flex-col gap-4">
      {sections.map((s) => (
        <section key={s.id} className="rounded-xl border-2 border-dashed border-foreground/30 bg-background p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/60">{s.label}</h3>
          <div className="mt-1"><NoteText text={s.value} /></div>
        </section>
      ))}
      {includeSummary && result.execSummary && <ExecSummary summary={result.execSummary} />}
      {chosen.map((card) => <NumberCard key={card.name} card={card} />)}
    </div>
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-6">
      <ol aria-label="Progress" className="grid grid-cols-3 gap-2">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const state = n === step ? "current" : n < step ? "done" : "todo";
          return (
            <li key={label} aria-current={state === "current" ? "step" : undefined} className={`rounded-lg border-2 p-2 text-sm ${state === "current" ? "border-foreground font-semibold" : "border-border text-foreground/60"}`}>
              <span className="block text-xs uppercase tracking-wide">Step {n} of 3{state === "done" ? " · done" : ""}</span>
              {label}
            </li>
          );
        })}
      </ol>

      {step === 1 && (
        <fieldset className="flex flex-col gap-3">
          <legend className="text-lg font-bold">Which numbers does your colleague need?</legend>
          <p className="text-sm text-foreground/70">Only what you tick is shared. Fewer numbers is easier to read.</p>
          {result.execSummary && (
            <label className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3">
              <input type="checkbox" checked={includeSummary} onChange={(e) => setIncludeSummary(e.target.checked)} className="mt-1 h-5 w-5" />
              <span>
                <span className="font-semibold">Summary</span>
                <span className="block text-sm text-foreground/70">{result.execSummary.headline}</span>
              </span>
            </label>
          )}
          {result.cards.map((card) => (
            <label key={card.name} className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3">
              <input
                type="checkbox"
                checked={included.has(card.name)}
                onChange={(e) =>
                  setIncluded((s) => {
                    const next = new Set(s);
                    if (e.target.checked) next.add(card.name); else next.delete(card.name);
                    return next;
                  })
                }
                className="mt-1 h-5 w-5"
              />
              <span className="flex-1">
                <span className="font-semibold">{card.name}</span>
                <span className="font-numeral ml-2 text-lg font-bold">{card.formattedLast}</span>
                <span className="ml-2 text-sm text-foreground/70">({card.directionMeta.word})</span>
                <span className="block text-sm text-foreground/70">{card.sentence}</span>
              </span>
            </label>
          ))}
          {chosen.length === 0 && <p role="alert" className="text-sm text-negative">Pick at least one number to continue.</p>}
        </fieldset>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold">Say what you think</h2>
          <aside className="rounded-lg border border-border bg-surface p-3 text-sm">
            <p className="font-semibold text-foreground/60">The numbers you are sending</p>
            <ul className="mt-1 flex flex-col gap-1">
              {chosen.map((c) => (
                <li key={c.name}><span className="font-semibold">{c.name}</span> <span className="font-numeral">{c.formattedLast}</span> ({c.directionMeta.word})</li>
              ))}
            </ul>
          </aside>
          {FIELDS.map((f) => (
            <div key={f.id} className="flex flex-col gap-1">
              <label htmlFor={`f-${f.id}`} className="font-semibold">{f.label}</label>
              <p id={`h-${f.id}`} className="text-sm text-foreground/60">{f.hint}</p>
              <textarea id={`f-${f.id}`} aria-describedby={`h-${f.id}`} rows={3} value={text[f.id]} onChange={(e) => setText((t) => ({ ...t, [f.id]: e.target.value }))} className="w-full resize-y rounded-md border border-border bg-surface p-2 text-sm" />
            </div>
          ))}
          <p className="text-sm text-foreground/60">You can leave all three empty and share the numbers alone.</p>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold">This is exactly what your colleague will see</h2>
          <div className="rounded-xl border border-border p-3">{recipient}</div>
          {!pub.published && (
            <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3 text-sm">
              <p>{STORAGE_NOTICE}</p>
              <button type="button" onClick={pub.publish} className="w-fit rounded-md border border-foreground px-3 py-1.5 font-semibold">Publish link</button>
            </div>
          )}
          {pub.published && pub.link && (
            <LinkBar
              link={pub.link}
              revoked={pub.revoked}
              onRevoke={pub.revoke}
              extra={
                <button type="button" onClick={() => { setUpdated(true); setTimeout(() => setUpdated(false), 1500); }} className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-background">
                  {updated ? "Link updated" : "Update link with my edits"}
                </button>
              }
            />
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <button type="button" disabled={step === 1} onClick={() => setStep((s) => s - 1)} className="rounded-md border border-border px-4 py-2 text-sm disabled:opacity-40">Back</button>
        {step < 3 && (
          <button type="button" disabled={!canNext} onClick={() => setStep((s) => s + 1)} className="rounded-md border border-foreground px-4 py-2 text-sm font-semibold disabled:opacity-40">
            Next: {STEPS[step]}
          </button>
        )}
      </div>
    </div>
  );
}
