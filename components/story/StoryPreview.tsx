"use client";

import { useId, useState } from "react";
import { ConsentGate } from "@/components/interpret/ConsentGate";
import type { StoryCheck } from "@/lib/story/checks";
import type { PolishResponse } from "@/lib/story/polish";
import { SECTION_KINDS, type Audience, type SectionKind, type StorySection } from "@/lib/story/types";
import { BUTTON, PRIMARY, SECTION_META } from "./sections";

export function storyAsText(sections: Record<SectionKind, StorySection>, prefix?: string): string {
  const body = SECTION_KINDS.map((kind) => `${SECTION_META[kind].label.toUpperCase()}\n${sections[kind].text}`).join("\n\n");
  return prefix ? `${prefix}\n\n${body}` : body;
}

type Suggestion = { status: "loading" } | { status: "ready"; text: string } | { status: "rejected"; message: string };

/**
 * Review screen: the three sections, each editable, resettable to its template, and optionally
 * polished by AI. A polish is only ever a suggestion the PM accepts or discards, and the server
 * has already checked it kept every number (app/api/story/polish).
 */
export function StoryPreview({
  sections,
  onSectionsChange,
  checks,
  audience,
  aiConsent,
  onAiConsent,
  isPractice,
  onEditAnswers,
  onPresent,
}: {
  sections: Record<SectionKind, StorySection>;
  onSectionsChange: (next: Record<SectionKind, StorySection>) => void;
  checks: StoryCheck[];
  audience: Audience;
  aiConsent: boolean;
  onAiConsent: () => void;
  isPractice: boolean;
  onEditAnswers: () => void;
  onPresent: () => void;
}) {
  const [suggestions, setSuggestions] = useState<Partial<Record<SectionKind, Suggestion>>>({});
  const [copied, setCopied] = useState(false);
  const baseId = useId();

  function setText(kind: SectionKind, text: string) {
    const section = sections[kind];
    onSectionsChange({ ...sections, [kind]: { ...section, text, edited: text !== section.template } });
  }

  async function polish(kind: SectionKind) {
    setSuggestions((s) => ({ ...s, [kind]: { status: "loading" } }));
    try {
      const res = await fetch("/api/story/polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: kind, text: sections[kind].text, audience }),
      });
      const body = (await res.json()) as PolishResponse;
      setSuggestions((s) => ({
        ...s,
        [kind]: body.ok ? { status: "ready", text: body.text } : { status: "rejected", message: body.message },
      }));
    } catch {
      setSuggestions((s) => ({ ...s, [kind]: { status: "rejected", message: "Couldn't reach the AI model just now. Your wording is unchanged." } }));
    }
  }

  function clearSuggestion(kind: SectionKind) {
    setSuggestions((s) => {
      const next = { ...s };
      delete next[kind];
      return next;
    });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(storyAsText(sections, isPractice ? "[Practice data — not real numbers]" : undefined));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold">Your story</h2>
        <p className="text-sm text-foreground/70">
          Built from your answers and the numbers above. Edit anything — the numbers come straight from your table.
        </p>
      </div>

      {SECTION_KINDS.map((kind) => {
        const meta = SECTION_META[kind];
        const section = sections[kind];
        const suggestion = suggestions[kind];
        const textId = `${baseId}-${kind}`;
        return (
          <section key={kind} className={`flex flex-col gap-3 rounded-xl border-l-4 ${meta.border} border-y border-r border-y-border border-r-border bg-surface p-5`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className={`text-lg font-bold ${meta.text}`}>
                <label htmlFor={textId}>
                  {meta.number}. {meta.label}
                </label>
              </h3>
              <p className="text-sm text-foreground/70">{meta.goal}</p>
            </div>
            <textarea
              id={textId}
              value={section.text}
              onChange={(e) => setText(kind, e.target.value)}
              rows={Math.max(3, section.text.split("\n").length + 1)}
              maxLength={2000}
              className="w-full rounded-lg border border-border bg-background p-3 text-base leading-relaxed"
            />
            <div className="flex flex-wrap gap-2">
              {section.edited && (
                <button type="button" className={BUTTON} onClick={() => setText(kind, section.template)}>
                  Reset to our wording
                </button>
              )}
              {aiConsent && (
                <button
                  type="button"
                  className={BUTTON}
                  onClick={() => polish(kind)}
                  disabled={suggestion?.status === "loading" || section.text.trim() === ""}
                >
                  {suggestion?.status === "loading" ? "Improving…" : "Improve with AI"}
                </button>
              )}
            </div>
            <div aria-live="polite">
              {suggestion?.status === "ready" && (
                <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-3">
                  <p className="text-sm font-semibold text-foreground/70">AI suggestion — same numbers, new wording</p>
                  <p className="whitespace-pre-line">{suggestion.text}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={PRIMARY}
                      onClick={() => {
                        setText(kind, suggestion.text);
                        clearSuggestion(kind);
                      }}
                    >
                      Use this
                    </button>
                    <button type="button" className={BUTTON} onClick={() => clearSuggestion(kind)}>
                      Keep mine
                    </button>
                  </div>
                </div>
              )}
              {suggestion?.status === "rejected" && (
                <p className="text-sm text-foreground/80">
                  {suggestion.message}{" "}
                  <button type="button" className="underline" onClick={() => clearSuggestion(kind)}>
                    Dismiss
                  </button>
                </p>
              )}
            </div>
          </section>
        );
      })}

      {!aiConsent && (
        <ConsentGate
          title="Improve the wording with AI (optional)"
          description="Uses an AI model (Anthropic, via Vercel AI Gateway). Each time you press “Improve with AI”, only that section's text and your chosen audience are sent. Your table and other figures are not sent. Any rewrite that changes a number is thrown away."
          actionLabel="Turn on AI wording help"
          granted={aiConsent}
          onGrant={onAiConsent}
        >
          {null}
        </ConsentGate>
      )}

      {checks.length > 0 && (
        <section className="rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground/70">Before you present</h3>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm text-foreground/80">
            {checks.map((check) => (
              <li key={check.id}>{check.text}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" className={PRIMARY} onClick={onPresent}>
          Present as slides
        </button>
        <button type="button" className={BUTTON} onClick={copy}>
          {copied ? "Copied" : "Copy as text"}
        </button>
        <button type="button" className={BUTTON} onClick={onEditAnswers}>
          Change my answers
        </button>
      </div>
    </div>
  );
}
