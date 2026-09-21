import type { DatasetShape } from "@/lib/compute/dataset-shape";
import type { NumberCardData } from "@/lib/compute/types";
import { GLOSSARY } from "@/lib/glossary/entries";
import { describeTableSupport, exampleFor } from "@/lib/glossary/match";

/**
 * Plain-language definitions of common PM metrics, opened from the interpretation view (PRD Part D).
 * A native <details> — keyboard operable, no focus trap, no motion — and rendered even before any
 * dataset exists (generic examples only). Definitions are static authored content; the only
 * dataset-specific text is a card's own deterministic sentence, shown only when name, type and
 * period shape all fit (lib/glossary/match.ts).
 */
export function GlossarySection({
  cards,
  shape,
}: {
  cards: NumberCardData[] | null;
  shape: DatasetShape | null;
}) {
  return (
    <details className="rounded-xl border border-border bg-surface p-5">
      <summary className="cursor-pointer text-sm font-semibold text-foreground/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
        What do these terms mean?
      </summary>
      <div className="mt-4 flex flex-col gap-3">
        {GLOSSARY.map((entry) => {
          const example = exampleFor(entry, cards, shape);
          const support = describeTableSupport(entry, shape);
          return (
            <details key={entry.key} className="rounded-md border border-border bg-background p-3">
              <summary className="cursor-pointer text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
                {entry.term}
              </summary>
              <div className="mt-3 flex flex-col gap-3 text-sm text-foreground/90">
                <p>{entry.definition}</p>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                    What data you&apos;d need
                  </h3>
                  <p>{entry.dataNeeded}</p>
                </div>
                {support.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                      Your table
                    </h3>
                    {support.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                )}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                    {example.kind === "own-data" ? `Your data — ${example.column}` : "Example (not your data)"}
                  </h3>
                  <p>{example.kind === "own-data" ? example.sentence : entry.genericExample}</p>
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </details>
  );
}
