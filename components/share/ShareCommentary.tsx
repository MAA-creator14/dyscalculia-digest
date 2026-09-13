/**
 * Visually distinct from the computed NumberCards/exec summary so a reader can't
 * mistake the sharer's opinion for a computed value (Story 1 AC2).
 */
export function ShareCommentary({ commentary }: { commentary: string }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-foreground/30 bg-background p-5">
      <p className="text-sm font-semibold text-foreground/60">The sharer&apos;s take</p>
      <p className="mt-2 whitespace-pre-wrap text-base text-foreground/90">{commentary}</p>
    </div>
  );
}
