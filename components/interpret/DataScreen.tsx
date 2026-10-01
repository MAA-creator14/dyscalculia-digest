import type { ReactNode } from "react";
import { DataModeBar } from "./DataModeBar";
import { DataModeSwitch } from "./DataModeSwitch";
import type { DataMode } from "./dataModes";

/**
 * Shared top of every data screen (/interpret, /practice, /practice/[id]): sticky mode bar,
 * heading, and the practice/own-data switch. Practice content also gets a neutral tint and
 * dashed border so even a cropped screenshot of practice numbers looks different from real data
 * (neutral, because green/red are reserved for up/down meaning — see PLAN.md).
 */
export function DataScreen({
  mode,
  title = "Restate a table",
  children,
}: {
  mode: DataMode;
  title?: string;
  children: ReactNode;
}) {
  return (
    <>
      <DataModeBar mode={mode} />
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pt-8">
        <h1 className="text-2xl font-bold">{title}</h1>
        <DataModeSwitch mode={mode} />
      </div>
      <div
        className={
          mode === "practice"
            ? "mx-auto my-6 w-[calc(100%-2rem)] max-w-2xl rounded-2xl border-2 border-dashed border-neutral/40 bg-neutral/5"
            : ""
        }
      >
        {children}
      </div>
    </>
  );
}
