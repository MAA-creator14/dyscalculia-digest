"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Sparkline } from "@/components/numbers/Sparkline";
import { TrendBadge } from "@/components/numbers/TrendBadge";
import type { NumberCardData } from "@/lib/compute/types";
import { withSectionText } from "@/lib/story/compose";
import { buildStoryPdf, pdfFileName } from "@/lib/story/pdf";
import { SECTION_KINDS, type SectionKind, type StorySection } from "@/lib/story/types";
import { BUTTON, PRIMARY, SECTION_META } from "./sections";

function MetricRow({ card, role }: { card: NumberCardData; role: string }) {
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border bg-background p-3">
      <Sparkline values={card.values} color={card.directionMeta.color} />
      <span className="font-semibold">{card.name}</span>
      <TrendBadge meta={card.directionMeta} />
      <span className="font-numeral text-foreground/80">
        {card.formattedFirst} → {card.formattedLast}
      </span>
      <span className="text-xs uppercase tracking-wide text-foreground/60">{role}</span>
    </li>
  );
}

function Slide({
  kind,
  section,
  outcome,
  drivers,
  isPractice,
  footer,
  onEdit,
}: {
  kind: SectionKind;
  section: StorySection;
  outcome?: NumberCardData;
  drivers: NumberCardData[];
  isPractice: boolean;
  footer?: ReactNode;
  /** When set, the slide text is an editable box (the on-screen deck); otherwise plain text (print copy). */
  onEdit?: (text: string) => void;
}) {
  const meta = SECTION_META[kind];
  const textClass = `whitespace-pre-line leading-snug ${kind === "hook" ? "text-3xl font-bold sm:text-4xl" : "text-xl sm:text-2xl"}`;
  return (
    <article
      aria-label={`${meta.label} slide`}
      className={`story-slide flex min-h-[70vh] flex-col gap-6 rounded-2xl border-t-8 ${meta.border} bg-surface p-8 text-foreground sm:p-12`}
    >
      <p className={`text-sm font-bold uppercase tracking-widest ${meta.text}`}>
        {meta.number}. {meta.label}
      </p>
      {onEdit ? (
        <textarea
          aria-label={`${meta.label} text — edit to change the slide`}
          value={section.text}
          onChange={(e) => onEdit(e.target.value)}
          rows={Math.max(2, section.text.split("\n").length + 1)}
          maxLength={2000}
          className={`${textClass} w-full resize-none rounded-lg border-2 border-dashed border-transparent bg-transparent p-2 [field-sizing:content] hover:border-border focus:border-foreground/40 focus:outline-none`}
        />
      ) : (
        <p className={textClass}>{section.text}</p>
      )}
      {kind === "line" && (drivers.length > 0 || outcome) && (
        <ul className="flex flex-col gap-2 text-base">
          {drivers.map((card) => (
            <MetricRow key={card.name} card={card} role="Leading" />
          ))}
          {outcome && <MetricRow card={outcome} role="Lagging — the result" />}
        </ul>
      )}
      <div className="mt-auto flex items-center justify-between gap-4 text-sm text-foreground/60">
        <span>{isPractice ? "Practice data — not real numbers" : ""}</span>
        {footer}
      </div>
    </article>
  );
}

/**
 * Three full-screen slides in a native modal dialog: ←/→ (and PageUp/PageDown) move, Esc closes.
 * Slide text is editable in place. "Download PDF" builds a real PDF file in the browser
 * (lib/story/pdf.ts); "Print" prints a separate copy of all three slides, one per landscape page
 * (see the .story-print rules in app/globals.css). Charts are always beside the exact figures.
 */
export function StoryDeck({
  open,
  onClose,
  sections,
  onSectionsChange,
  outcome,
  drivers,
  isPractice,
  title,
}: {
  open: boolean;
  onClose: () => void;
  sections: Record<SectionKind, StorySection>;
  onSectionsChange: (next: Record<SectionKind, StorySection>) => void;
  outcome?: NumberCardData;
  drivers: NumberCardData[];
  isPractice: boolean;
  /** Used for the PDF's file name and title. */
  title: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const [pdfStatus, setPdfStatus] = useState<"idle" | "making" | "error">("idle");
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const done = () => document.body.classList.remove("story-printing");
    window.addEventListener("afterprint", done);
    return () => window.removeEventListener("afterprint", done);
  }, []);

  function onKeyDown(event: React.KeyboardEvent) {
    // Arrow keys inside the editable text move the cursor, not the slide.
    if (event.target instanceof HTMLTextAreaElement) return;
    if (event.key === "ArrowRight" || event.key === "PageDown") {
      event.preventDefault();
      setIndex((i) => Math.min(i + 1, SECTION_KINDS.length - 1));
    } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
      event.preventDefault();
      setIndex((i) => Math.max(i - 1, 0));
    }
  }

  async function downloadPdf() {
    setPdfStatus("making");
    try {
      const doc = await buildStoryPdf({ sections, outcome, drivers, isPractice, title });
      doc.save(pdfFileName(title));
      setPdfStatus("idle");
    } catch {
      setPdfStatus("error");
    }
  }

  function print() {
    document.body.classList.add("story-printing");
    window.print();
  }

  const kind = SECTION_KINDS[index];
  const slideProps = { outcome, drivers, isPractice };

  return (
    <>
      <dialog
        ref={dialogRef}
        onClose={() => {
          setIndex(0);
          onClose();
        }}
        onKeyDown={onKeyDown}
        aria-label="Story slides"
        className="m-0 h-full max-h-none w-full max-w-none bg-background p-4 text-foreground backdrop:bg-black/60 sm:p-8"
      >
        <div className="mx-auto flex h-full max-w-5xl flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p aria-live="polite" className="text-sm font-semibold text-foreground/70">
              Slide {index + 1} of {SECTION_KINDS.length}
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={PRIMARY} onClick={downloadPdf} disabled={pdfStatus === "making"}>
                {pdfStatus === "making" ? "Making PDF…" : "Download PDF"}
              </button>
              <button type="button" className={BUTTON} onClick={print}>
                Print
              </button>
              <button type="button" className={BUTTON} onClick={onClose}>
                Close (Esc)
              </button>
            </div>
          </div>
          <div aria-live="polite" className="text-sm">
            {pdfStatus === "error" ? (
              <p className="text-negative">Couldn&apos;t make the PDF just now. Please try again, or use Print.</p>
            ) : (
              <p className="text-foreground/60">Click the slide text to edit it. Changes are saved to your story.</p>
            )}
          </div>
          <Slide
            kind={kind}
            section={sections[kind]}
            {...slideProps}
            onEdit={(text) => onSectionsChange(withSectionText(sections, kind, text))}
          />
          <div className="flex items-center justify-between gap-2">
            <button type="button" className={BUTTON} onClick={() => setIndex((i) => i - 1)} disabled={index === 0}>
              ← Previous
            </button>
            <p className="hidden text-xs text-foreground/60 sm:block">Use the arrow keys to move between slides.</p>
            <button
              type="button"
              className={BUTTON}
              onClick={() => setIndex((i) => i + 1)}
              disabled={index === SECTION_KINDS.length - 1}
            >
              Next →
            </button>
          </div>
        </div>
      </dialog>
      {/* Only ever open after a click, so document.body exists. */}
      {open &&
        createPortal(
          <div className="story-print" aria-hidden="true">
            {SECTION_KINDS.map((k) => (
              <Slide key={k} kind={k} section={sections[k]} {...slideProps} />
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
