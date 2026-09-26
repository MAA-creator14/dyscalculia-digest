import Link from "next/link";
import { DATA_MODES, type DataMode } from "./dataModes";

/**
 * Full-width bar that stays on screen while scrolling, so whose numbers are showing is never in
 * doubt — a practice number pasted into a real update is exactly the mistake this product
 * exists to prevent. Icon + word + colour together, never colour alone; green/red stay reserved
 * for up/down meaning (see PLAN.md).
 */
export function DataModeBar({ mode }: { mode: DataMode }) {
  const current = DATA_MODES[mode];
  const other = DATA_MODES[mode === "practice" ? "own" : "practice"];
  const practice = mode === "practice";

  return (
    <div
      className={`sticky top-0 z-40 border-b backdrop-blur ${
        practice ? "border-neutral/40 bg-neutral/15" : "border-border bg-surface/90"
      }`}
    >
      <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2">
        <p className={`text-xs font-bold uppercase tracking-wide ${practice ? "text-neutral" : "text-foreground"}`}>
          <span aria-hidden="true">{current.icon}</span> {current.bar}
        </p>
        <Link
          href={other.href}
          className="text-xs font-medium text-foreground/80 underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          Switch to {other.label.toLowerCase()} →
        </Link>
      </div>
    </div>
  );
}
