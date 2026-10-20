"use client";

import { useState } from "react";
import { ExecSummary } from "@/components/numbers/ExecSummary";
import { NumberCard } from "@/components/numbers/NumberCard";
import { ShareUnavailable } from "@/components/share/ShareUnavailable";
import { cleanNote, LinkBar, STORAGE_NOTICE, usePublish, useSampleResult } from "../_shared";

// Variant C — start from the conclusion. Your recommendation leads; a few pinned numbers are the evidence; the rest folds away.

const MAX = 280;

export default function ClaimFirst() {
  const result = useSampleResult();
  const pub = usePublish();
  const [claim, setClaim] = useState("");
  const [pinned, setPinned] = useState<Set<string>>(new Set());

  const text = cleanNote(claim);
  const evidence = result.cards.filter((c) => pinned.has(c.name));
  const rest = result.cards.filter((c) => !pinned.has(c.name));

  const recipient =
    pub.published && pub.revoked ? (
      <ShareUnavailable />
    ) : (
      <div className="flex flex-col gap-5">
        {text ? (
          <section aria-label="Recommendation">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground/60">The sharer&apos;s recommendation</p>
            <p className="mt-1 whitespace-pre-wrap text-2xl font-bold leading-snug">{text}</p>
            {evidence.length > 0 && (
              <p className="mt-2 text-sm text-foreground/70">
                Based on {evidence.length} {evidence.length === 1 ? "number" : "numbers"}, shown next.
              </p>
            )}
          </section>
        ) : (
          <p className="text-sm text-foreground/60">No recommendation added yet — your colleague would see the numbers only.</p>
        )}
        {evidence.length > 0 && (
          <section aria-label="Evidence" className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/60">The evidence</h3>
            {evidence.map((c) => <NumberCard key={c.name} card={c} />)}
          </section>
        )}
        <details open={evidence.length === 0} className="rounded-xl border border-border bg-surface p-3">
          <summary className="cursor-pointer text-sm font-semibold">
            {evidence.length === 0 ? "All numbers" : `Everything else (${rest.length} more ${rest.length === 1 ? "number" : "numbers"} and the summary)`}
          </summary>
          <div className="mt-3 flex flex-col gap-3">
            {result.execSummary && <ExecSummary summary={result.execSummary} />}
            {rest.map((c) => <NumberCard key={c.name} card={c} />)}
          </div>
        </details>
      </div>
    );

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 md:grid-cols-2">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <label htmlFor="claim" className="text-lg font-bold">What do you recommend?</label>
          <p id="claim-hint" className="text-sm text-foreground/60">One or two sentences. This is the first thing your colleague reads.</p>
          <textarea
            id="claim"
            aria-describedby="claim-hint claim-count"
            rows={4}
            maxLength={MAX}
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            placeholder="e.g. Churn jumped in April and May — I'd pause the new-plan launch until we know why."
            className="w-full resize-y rounded-md border border-border bg-surface p-3 text-base"
          />
          <p id="claim-count" className="font-numeral text-right text-xs text-foreground/60">{claim.length} / {MAX}</p>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-bold">Pin the numbers that back it up</h2>
          <p className="text-sm text-foreground/60">Pinned numbers are shown right under your recommendation. Aim for one to three.</p>
          {result.cards.map((c) => {
            const on = pinned.has(c.name);
            return (
              <button
                key={c.name}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  setPinned((s) => {
                    const next = new Set(s);
                    if (next.has(c.name)) next.delete(c.name); else next.add(c.name);
                    return next;
                  })
                }
                className={`flex items-center justify-between gap-3 rounded-lg border-2 p-3 text-left ${on ? "border-foreground bg-background" : "border-border bg-surface"}`}
              >
                <span>
                  <span className="font-semibold">{c.name}</span>
                  <span className="font-numeral ml-2 text-lg font-bold">{c.formattedLast}</span>
                  <span className="ml-2 text-sm text-foreground/70">({c.directionMeta.word})</span>
                </span>
                <span className="text-sm font-semibold">{on ? "Pinned" : "Pin as evidence"}</span>
              </button>
            );
          })}
          <p aria-live="polite" className="text-sm text-foreground/70">{pinned.size} pinned</p>
        </div>

        <div className="flex flex-col gap-2">
          {!pub.published && (
            <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3 text-sm">
              <p>{STORAGE_NOTICE}</p>
              <button type="button" onClick={pub.publish} className="w-fit rounded-md border border-foreground px-3 py-1.5 font-semibold">Publish link</button>
            </div>
          )}
          {pub.published && pub.link && <LinkBar link={pub.link} revoked={pub.revoked} onRevoke={pub.revoke} />}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/60">What your colleague sees · live</h2>
        <div className="rounded-xl border border-border p-4 md:sticky md:top-4">{recipient}</div>
      </div>
    </div>
  );
}
