"use client";

import { useState } from "react";
import { ExecSummary } from "@/components/numbers/ExecSummary";
import { NumberCard } from "@/components/numbers/NumberCard";
import { ShareUnavailable } from "@/components/share/ShareUnavailable";
import { cleanNote, LinkBar, NoteText, STORAGE_NOTICE, usePublish, useSampleResult } from "../_shared";

// Variant A — the page you edit IS the page your colleague sees. Notes attach to the specific number they're about.

type Notes = Record<string, string>;
const OVERALL = "overall";
const SUMMARY = "summary";

export default function AnnotateInPlace() {
  const result = useSampleResult();
  const pub = usePublish();
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [notes, setNotes] = useState<Notes>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [published, setPublished] = useState<string | null>(null);

  const visibleNotes = Object.fromEntries(
    Object.entries(notes).map(([k, v]) => [k, cleanNote(v)]).filter(([, v]) => v !== ""),
  ) as Notes;
  const snapshot = JSON.stringify(visibleNotes);
  const dirty = pub.published && !pub.revoked && published !== snapshot;

  function startEdit(id: string) {
    setEditing(id);
    setDraft(notes[id] ?? "");
  }
  function saveEdit() {
    if (editing) setNotes((n) => ({ ...n, [editing]: draft }));
    setEditing(null);
  }

  // A plain function (not a component) so the textarea keeps focus between keystrokes.
  function renderSlot(id: string, label: string) {
    const note = visibleNotes[id];
    if (mode === "preview") {
      if (!note) return null;
      return (
        <div className="-mt-2 rounded-b-xl border-2 border-t-0 border-dashed border-foreground/30 bg-background p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/60">Note from the sharer · {label}</p>
          <div className="mt-1"><NoteText text={note} /></div>
        </div>
      );
    }
    if (editing === id) {
      return (
        <div className="-mt-2 flex flex-col gap-2 rounded-b-xl border-2 border-t-0 border-foreground/40 bg-background p-4">
          <label htmlFor={`note-${id}`} className="text-sm font-semibold">Your note about {label}</label>
          <textarea
            id={`note-${id}`}
            autoFocus
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="What should the reader take from this number?"
            className="w-full resize-y rounded-md border border-border bg-surface p-2 text-sm"
          />
          <div className="flex gap-2">
            <button type="button" onClick={saveEdit} className="rounded-md border border-foreground px-3 py-1 text-sm font-semibold">Save note</button>
            <button type="button" onClick={() => setEditing(null)} className="rounded-md border border-border px-3 py-1 text-sm">Cancel</button>
          </div>
        </div>
      );
    }
    if (note) {
      return (
        <div className="-mt-2 rounded-b-xl border-2 border-t-0 border-dashed border-foreground/30 bg-background p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/60">Your note · {label}</p>
          <div className="mt-1"><NoteText text={note} /></div>
          <div className="mt-2 flex gap-3 text-sm">
            <button type="button" onClick={() => startEdit(id)} className="underline">Edit</button>
            <button type="button" onClick={() => setNotes((n) => ({ ...n, [id]: "" }))} className="underline">Remove</button>
          </div>
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={() => startEdit(id)}
        className="-mt-2 rounded-b-xl border-2 border-t-0 border-dashed border-border px-4 py-2 text-left text-sm text-foreground/60 hover:border-foreground/40 hover:text-foreground"
      >
        + Add a note about {label}
      </button>
    );
  }

  const showUnavailable = mode === "preview" && pub.published && pub.revoked;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
      <div className="sticky top-0 z-10 -mx-4 flex flex-col gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="View" className="flex overflow-hidden rounded-md border border-border text-sm">
            <button type="button" aria-pressed={mode === "edit"} onClick={() => setMode("edit")} className={`px-3 py-1.5 ${mode === "edit" ? "bg-foreground font-semibold text-background" : ""}`}>
              Edit
            </button>
            <button type="button" aria-pressed={mode === "preview"} onClick={() => { setEditing(null); setMode("preview"); }} className={`px-3 py-1.5 ${mode === "preview" ? "bg-foreground font-semibold text-background" : ""}`}>
              Preview as colleague
            </button>
          </div>
          <span className="flex-1" />
          {!pub.published && !confirming && (
            <button type="button" onClick={() => setConfirming(true)} className="rounded-md border border-foreground px-3 py-1.5 text-sm font-semibold">
              Publish link…
            </button>
          )}
          {dirty && (
            <button type="button" onClick={() => setPublished(snapshot)} className="rounded-md border border-foreground px-3 py-1.5 text-sm font-semibold">
              Update link with my changes
            </button>
          )}
        </div>
        {confirming && !pub.published && (
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3 text-sm">
            <p>{STORAGE_NOTICE}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => { pub.publish(); setPublished(snapshot); setConfirming(false); }} className="rounded-md border border-foreground px-3 py-1 font-semibold">Publish link</button>
              <button type="button" onClick={() => setConfirming(false)} className="rounded-md border border-border px-3 py-1">Not now</button>
            </div>
          </div>
        )}
        {pub.published && pub.link && <LinkBar link={pub.link} revoked={pub.revoked} onRevoke={pub.revoke} />}
        {mode === "edit" && !pub.published && (
          <p className="text-sm text-foreground/60">This is the page your colleague will see. Click &ldquo;+ Add a note&rdquo; under any number to explain it.</p>
        )}
      </div>

      {showUnavailable ? (
        <ShareUnavailable />
      ) : (
        <div className="flex flex-col gap-4">
          {mode === "edit" || visibleNotes[OVERALL] ? (
            <div className="flex flex-col">
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-sm font-semibold text-foreground/60">Overall take</p>
                <p className="text-sm text-foreground/60">One sentence that frames everything below (optional).</p>
              </div>
              {renderSlot(OVERALL, "the whole picture")}
            </div>
          ) : null}
          {result.execSummary && (
            <div className="flex flex-col">
              <ExecSummary summary={result.execSummary} />
              {renderSlot(SUMMARY, "the summary")}
            </div>
          )}
          {result.cards.map((card) => (
            <div key={card.name} className="flex flex-col">
              <NumberCard card={card} />
              {renderSlot(card.name, card.name)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
