"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { FollowUpChat } from "@/components/chat/FollowUpChat";
import { GlossarySection } from "@/components/glossary/GlossarySection";
import { ConsentGate } from "@/components/interpret/ConsentGate";
import { SuggestedQuestions } from "@/components/interpret/SuggestedQuestions";
import { ExecSummary } from "@/components/numbers/ExecSummary";
import { NumberCard } from "@/components/numbers/NumberCard";
import { FeedbackForm } from "@/components/practice/FeedbackForm";
import { SharePanel } from "@/components/share/SharePanel";
import { StoryEntry } from "@/components/story/StoryEntry";
import { PasteOrUploadTable } from "@/components/upload/PasteOrUploadTable";
import { interpretTable, type InterpretResult } from "@/lib/compute/interpret";
import { suggestQuestions, type SuggestedQuestion } from "@/lib/compute/suggest-questions";
import type { ParseError } from "@/lib/compute/types";
import type { Scenario } from "@/lib/scenarios/scenarios";

const chatTransport = new DefaultChatTransport({ api: "/api/chat" });

/**
 * With a `scenario`, this is practice mode: the scenario's made-up table is interpreted
 * immediately and AI questions are on (nothing sensitive to protect). Without one, it's the
 * user's own data: everything is computed in the browser, and AI questions and sharing each
 * need an explicit opt-in, per dataset, that says exactly what leaves the device.
 */
export function InterpretView({ scenario }: { scenario?: Scenario }) {
  const isPractice = scenario !== undefined;
  const [result, setResult] = useState<InterpretResult | null>(() => {
    if (!scenario) return null;
    const initial = interpretTable(scenario.csv);
    return initial.ok ? initial : null;
  });
  const [error, setError] = useState<ParseError | null>(null);
  const [datasetVersion, setDatasetVersion] = useState(0);
  const [aiEnabled, setAiEnabled] = useState(isPractice);
  const [shareEnabled, setShareEnabled] = useState(false);
  const chatSectionRef = useRef<HTMLDivElement>(null);

  const cards = result?.cards ?? null;
  const execSummary = result?.execSummary ?? null;
  const periodLabels = result?.periodLabels ?? null;
  const shape = result?.shape ?? null;

  // The chat lives here (not inside FollowUpChat) so a suggested question can send into it.
  // A new `id` per dataset gives a fresh conversation.
  const { messages, sendMessage, status } = useChat({
    id: `dataset-${datasetVersion}`,
    transport: chatTransport,
  });

  const suggestions = useMemo(
    () => (cards && shape ? suggestQuestions(cards, shape) : []),
    [cards, shape],
  );

  function ask(text: string) {
    sendMessage({ text }, { body: { cards, execSummary, periodLabels } });
  }

  function askSuggestion(question: SuggestedQuestion) {
    ask(question.text);
    // The chat sits below the cards; bring the answer into view without a jarring jump for users who opt out of motion.
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    chatSectionRef.current?.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
  }

  function handleSubmit(text: string) {
    const next = interpretTable(text);
    setResult(next.ok ? next : null);
    setError(next.ok ? null : next.error);
    setDatasetVersion((v) => v + 1);
    // Consent is per dataset: a new table means asking again before anything is sent.
    setAiEnabled(false);
    setShareEnabled(false);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6">
      {scenario && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-bold">{scenario.title}</h2>
          <p className="text-foreground/80">{scenario.role}</p>
          <p className="text-foreground/80">{scenario.situation}</p>
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="text-sm font-semibold text-foreground/60">Your task</p>
            <p className="mt-1 font-medium text-foreground">{scenario.task}</p>
          </div>
          <Link href="/practice" className="w-fit text-sm text-foreground/70 underline">
            Choose a different scenario
          </Link>
        </div>
      )}

      {!isPractice && <PasteOrUploadTable onSubmit={handleSubmit} />}

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
          {execSummary && (
            <ExecSummary summary={execSummary} copyPrefix={isPractice ? "[Practice data — not real numbers]" : undefined} />
          )}
          {result && <StoryEntry result={result} scenarioId={scenario?.id} />}
          {/* Suggestions send into the chat, so they only appear once AI questions are on. */}
          {aiEnabled && (
            <SuggestedQuestions key={datasetVersion} suggestions={suggestions} disabled={status !== "ready"} onAsk={askSuggestion} />
          )}
          {cards.map((card) => (
            <NumberCard key={card.name} card={card} />
          ))}
          <ConsentGate
            title="Ask questions about this data"
            description="Uses an AI model (Anthropic, via Vercel AI Gateway). Turning this on sends your metric names, the calculated figures shown above, and the questions you ask. Your original table is never sent."
            actionLabel="Turn on AI questions"
            granted={aiEnabled}
            onGrant={() => setAiEnabled(true)}
          >
            <div ref={chatSectionRef}>
              <FollowUpChat messages={messages} status={status} onAsk={ask} />
            </div>
          </ConsentGate>
          {!isPractice && (
            <ConsentGate
              title="Share with a colleague"
              description="Creates a read-only link. Turning this on and creating a link stores the calculated figures shown above and any note you add on our server until you revoke the link. Your original table is never stored."
              actionLabel="Set up a share link"
              granted={shareEnabled}
              onGrant={() => setShareEnabled(true)}
            >
              <SharePanel
                key={`share-${datasetVersion}`}
                cards={cards}
                execSummary={execSummary}
                periodLabels={periodLabels}
              />
            </ConsentGate>
          )}
          <FeedbackForm key={`feedback-${datasetVersion}`} scenario={scenario} />
        </div>
      )}

      <GlossarySection cards={cards} shape={shape} />
    </div>
  );
}
