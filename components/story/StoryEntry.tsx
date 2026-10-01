"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { InterpretResult } from "@/lib/compute/interpret";
import { loadDraft, saveDraft } from "@/lib/story/draft-storage";
import { newDraft } from "@/lib/story/types";
import { BUTTON, FOCUS, PRIMARY } from "./sections";

const CARD = "flex flex-col gap-2 rounded-xl border border-border bg-surface p-5";
const BLURB = "Turn these numbers into a Hook, Line and Sinker for your next meeting — we'll ask a few questions, one at a time.";

/**
 * The "Tell the story" step on the interpret screen. Practice links straight to the scenario's
 * story page. Own data hands the already-computed figures (never the raw table) to /story via the
 * browser-only draft — asking first if that would replace a story already in progress.
 */
export function StoryEntry({ result, scenarioId }: { result: InterpretResult; scenarioId?: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  if (scenarioId) {
    return (
      <div className={CARD}>
        <p className="text-sm text-foreground/80">{BLURB}</p>
        <Link href={`/practice/${scenarioId}/story`} className={`${PRIMARY} w-fit`}>
          Tell the story with these numbers →
        </Link>
      </div>
    );
  }

  function start() {
    const { cards, execSummary, periodLabels, shape } = result;
    saveDraft(newDraft({ mode: "own" }, { cards, execSummary, periodLabels, shape }));
    router.push("/story");
  }

  return (
    <div className={CARD}>
      <p className="text-sm text-foreground/80">{BLURB}</p>
      {!confirming ? (
        <button type="button" className={`${PRIMARY} w-fit`} onClick={() => (loadDraft({ mode: "own" }) ? setConfirming(true) : start())}>
          Tell the story with these numbers →
        </button>
      ) : (
        <div className="flex flex-col gap-2 text-sm" role="group" aria-label="You already have a story in progress">
          <p>You already have a story in progress in this browser. Starting a new one replaces it.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={PRIMARY} onClick={start}>
              Start a new story
            </button>
            <Link href="/story" className={`${BUTTON} ${FOCUS}`}>
              Open my saved story
            </Link>
            <button type="button" className={BUTTON} onClick={() => setConfirming(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
