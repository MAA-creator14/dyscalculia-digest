import type { DirectionMeta } from "@/lib/compute/types";

const STROKE_CLASSES: Record<DirectionMeta["color"], string> = {
  positive: "stroke-positive",
  negative: "stroke-negative",
  neutral: "stroke-neutral",
};

/**
 * A small reinforcing visual only — direction/magnitude must always be
 * readable from the icon+color+word+sentence alone (see PLAN.md: this is
 * never the sole way information is conveyed).
 */
export function Sparkline({ values, color }: { values: number[]; color: DirectionMeta["color"] }) {
  if (values.length < 2) return null;

  const width = 96;
  const height = 24;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0"
      role="presentation"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        className={STROKE_CLASSES[color]}
      />
    </svg>
  );
}
