import Link from "next/link";
import { DATA_MODES, type DataMode } from "./dataModes";

/**
 * The practice-vs-own-data choice, as one two-part control at the top of every data screen.
 * Two links rather than a client toggle, so the URL carries the mode and Back works. The
 * selected half is filled, bordered and ticked — never colour alone.
 */
export function DataModeSwitch({ mode }: { mode: DataMode }) {
  return (
    <nav aria-label="Choose your data" className="grid grid-cols-2 overflow-hidden rounded-xl border border-border">
      {(["practice", "own"] as const).map((key) => {
        const option = DATA_MODES[key];
        const selected = key === mode;
        return (
          <Link
            key={key}
            href={option.href}
            aria-current={selected ? "page" : undefined}
            className={`flex flex-col gap-0.5 px-4 py-3 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-foreground ${
              key === "own" ? "border-l border-border" : ""
            } ${selected ? "bg-surface shadow-[inset_0_-3px_0_var(--foreground)]" : "text-foreground/60 hover:bg-surface/60"}`}
          >
            <span className="flex items-center justify-between gap-2 font-semibold">
              <span>
                <span aria-hidden="true">{option.icon}</span> {option.label}
              </span>
              {selected && <span aria-hidden="true">✓</span>}
            </span>
            <span className="text-xs">{option.subLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}
