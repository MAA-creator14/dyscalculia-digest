import type { NumberCardData } from "@/lib/compute/types";
import { AnomalyPanel } from "./AnomalyPanel";
import { Sparkline } from "./Sparkline";
import { TrendBadge } from "./TrendBadge";

const STREAK_WORD: Record<"up" | "down", string> = {
  up: "in a row of increases",
  down: "in a row of decline",
};

/**
 * One metric, fully explained: the raw number and its plain-language framing
 * shown together at equal visual weight (see PLAN.md — the tool never hides
 * the exact figure behind the friendly framing).
 */
export function NumberCard({ card }: { card: NumberCardData }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-foreground/60">{card.name}</p>
          <p className="font-numeral mt-1 text-3xl font-bold">{card.formattedLast}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <TrendBadge meta={card.directionMeta} />
          <Sparkline values={card.values} color={card.directionMeta.color} />
        </div>
      </div>

      <p className="mt-3 text-base text-foreground/90">{card.sentence}</p>

      {card.streak && (
        <p className="mt-1 text-sm text-foreground/60">
          {card.streak.length} periods {STREAK_WORD[card.streak.direction]}.
        </p>
      )}

      <AnomalyPanel anomalies={card.anomalies} />
    </div>
  );
}
