import { ExecSummary } from "@/components/numbers/ExecSummary";
import { NumberCard } from "@/components/numbers/NumberCard";
import type { ShareRecord } from "@/lib/share/types";
import { ShareCommentary } from "./ShareCommentary";

/**
 * The thin, read-only container InterpretView can't provide (it owns upload
 * state and the interactive follow-up chat, neither of which belongs here).
 * Deliberately no FollowUpChat — this is a one-way, PM-to-reader view.
 */
export function ShareView({ record }: { record: ShareRecord }) {
  const { interpretation, commentary } = record;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-10">
      {commentary && <ShareCommentary commentary={commentary} />}
      {interpretation.execSummary && <ExecSummary summary={interpretation.execSummary} />}
      {interpretation.cards.map((card) => (
        <NumberCard key={card.name} card={card} />
      ))}
    </div>
  );
}
