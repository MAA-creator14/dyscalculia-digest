"use client";

import { useRef, useState } from "react";

/**
 * Paste or upload a CSV/TSV table. The raw text never leaves the browser: it's
 * computed on locally by lib/compute/interpret.ts (see PLAN.md's privacy stance).
 */
export function PasteOrUploadTable({ onSubmit }: { onSubmit: (text: string) => void }) {
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
      <p className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground/80">
        <span aria-hidden="true">🔒</span> Worked out in your browser — your table is never sent
        anywhere. Nothing leaves this device unless you turn on AI questions or create a share link,
        and each tells you exactly what it sends first.
      </p>
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
          disabled={text.trim() === ""}
          className="rounded-lg bg-positive px-4 py-2 text-sm font-semibold text-background disabled:opacity-50"
        >
          Restate this data
        </button>
      </div>
    </form>
  );
}
