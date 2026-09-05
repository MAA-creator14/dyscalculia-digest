"use client";

import { useRef, useState } from "react";

/**
 * Paste or upload a CSV/TSV table. Nothing here is persisted server-side —
 * per PLAN.md's privacy stance, the raw text only ever leaves the browser to
 * be computed on, not stored.
 */
export function PasteOrUploadTable({
  onSubmit,
  isLoading,
}: {
  onSubmit: (text: string) => void;
  isLoading: boolean;
}) {
  const [text, setText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const contents = await file.text();
    setText(contents);
    event.target.value = "";
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim() !== "") onSubmit(text);
      }}
      className="flex flex-col gap-3"
    >
      <label htmlFor="table-input" className="text-sm font-medium text-foreground/80">
        Paste a table (from a spreadsheet or dashboard export), or upload a CSV
      </label>
      <textarea
        id="table-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"Week,Signups\n1,1204\n2,1436"}
        rows={8}
        className="font-numeral w-full rounded-lg border border-border bg-surface p-3 text-sm focus:outline-none focus:ring-2 focus:ring-positive"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface"
        >
          Upload CSV
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv,text/plain"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="submit"
          disabled={isLoading || text.trim() === ""}
          className="rounded-lg bg-positive px-4 py-2 text-sm font-semibold text-background disabled:opacity-50"
        >
          {isLoading ? "Working it out…" : "Restate this data"}
        </button>
      </div>
      <p className="text-xs text-foreground/50">
        This data is never stored or used to train models — it&apos;s only used to compute the
        result below.
      </p>
    </form>
  );
}
