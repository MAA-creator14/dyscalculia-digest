"use client";

import { useState } from "react";
import { FollowUpChat } from "@/components/chat/FollowUpChat";
import { ExecSummary } from "@/components/numbers/ExecSummary";
import { NumberCard } from "@/components/numbers/NumberCard";
import { SharePanel } from "@/components/share/SharePanel";
import { PasteOrUploadTable } from "@/components/upload/PasteOrUploadTable";
import type { InterpretErrorResponse, InterpretResponse } from "@/app/api/interpret/route";
import type { ExecSummaryData, NumberCardData, ParseError } from "@/lib/compute/types";

export function InterpretView() {
  const [cards, setCards] = useState<NumberCardData[] | null>(null);
  const [execSummary, setExecSummary] = useState<ExecSummaryData | null>(null);
  const [periodLabels, setPeriodLabels] = useState<string[] | null>(null);
  const [error, setError] = useState<ParseError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [datasetVersion, setDatasetVersion] = useState(0);

  async function handleSubmit(text: string) {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = (await res.json()) as InterpretResponse | InterpretErrorResponse;
      if (data.ok) {
        setCards(data.cards);
        setExecSummary(data.execSummary);
        setPeriodLabels(data.periodLabels);
        setDatasetVersion((v) => v + 1);
      } else {
        setCards(null);
        setExecSummary(null);
        setPeriodLabels(null);
        setError(data.error);
      }
    } catch {
      setCards(null);
      setExecSummary(null);
      setPeriodLabels(null);
      setError({ message: "Something went wrong reaching the server. Please try again." });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-bold">Restate a table</h1>
        <p className="mt-1 text-foreground/70">
          Paste a metrics table or spreadsheet export and get each number back with a
          plain-language explanation, a redundant up/down indicator, and the exact figure —
          side by side.
        </p>
      </div>

      <PasteOrUploadTable onSubmit={handleSubmit} isLoading={isLoading} />

      {error && (
        <div className="rounded-lg border border-negative/30 bg-negative/5 p-4 text-sm text-negative">
          {error.message}
        </div>
      )}

      {cards && cards.length === 0 && (
        <p className="text-sm text-foreground/60">
          That table parsed fine, but none of its columns looked like numbers to restate.
        </p>
      )}

      {cards && cards.length > 0 && (
        <div className="flex flex-col gap-4">
          {execSummary && <ExecSummary summary={execSummary} />}
          {cards.map((card) => (
            <NumberCard key={card.name} card={card} />
          ))}
          <FollowUpChat
            key={datasetVersion}
            cards={cards}
            execSummary={execSummary}
            periodLabels={periodLabels}
          />
          <SharePanel
            key={`share-${datasetVersion}`}
            cards={cards}
            execSummary={execSummary}
            periodLabels={periodLabels}
          />
        </div>
      )}
    </div>
  );
}
