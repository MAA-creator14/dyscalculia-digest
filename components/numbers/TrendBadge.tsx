import type { DirectionMeta } from "@/lib/compute/types";

const COLOR_CLASSES: Record<DirectionMeta["color"], string> = {
  positive: "bg-positive/15 text-positive",
  negative: "bg-negative/15 text-negative",
  neutral: "bg-neutral/15 text-neutral",
};

const ICONS: Record<DirectionMeta["icon"], string> = {
  up: "↑",
  down: "↓",
  flat: "→",
};

/**
 * Redundant coding for direction: icon + color + word together, so direction
 * is never conveyed by color alone (see PLAN.md's design language).
 */
export function TrendBadge({ meta }: { meta: DirectionMeta }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-sm font-medium ${COLOR_CLASSES[meta.color]}`}
    >
      <span aria-hidden="true">{ICONS[meta.icon]}</span>
      <span>{meta.word}</span>
    </span>
  );
}
