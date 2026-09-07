import { convertToModelMessages, isStepCount, streamText, type UIMessage } from "ai";
import { buildChatTools, type ChatDataset } from "@/lib/ai/chat-tools";
import { CHAT_MODEL } from "@/lib/ai/gateway";
import type { ExecSummaryData, NumberCardData } from "@/lib/compute/types";

export const maxDuration = 30;

const INSTRUCTIONS = `You help a product manager make sense of a dataset they just restated with this tool.

You have tools that return exact, precomputed values from that dataset. For any fact about this
specific dataset — a number, a delta, a trend, an anomaly — you must call a tool to get it. Never
state or calculate a dataset-specific number from memory or your own arithmetic; only report
numbers a tool returned. If a tool says a metric name doesn't match, call listMetrics and retry
with the closest match.

You may also answer general data-literacy questions (e.g. "what does retention mean?") using your
own knowledge. When you do, prefix that part of your answer with "In general:" so it's clearly
separated from anything about this specific dataset.

If a question can't be answered with the available tools, say so plainly rather than guessing or
computing a new number yourself.`;

interface ChatRequestBody {
  messages: UIMessage[];
  cards?: NumberCardData[];
  execSummary?: ExecSummaryData | null;
  periodLabels?: string[] | null;
}

/**
 * Follow-up Q&A (see PLAN.md Flow C). The LLM never receives raw dataset numbers
 * as prompt text — it can only obtain them by calling a tool bound to the
 * already-computed `cards`/`execSummary` the client sent along with the message.
 */
export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as ChatRequestBody;

  const dataset: ChatDataset = {
    cards: body.cards ?? [],
    execSummary: body.execSummary ?? null,
    periodLabels: body.periodLabels ?? null,
  };

  const result = streamText({
    model: CHAT_MODEL,
    instructions: INSTRUCTIONS,
    tools: buildChatTools(dataset),
    stopWhen: isStepCount(5),
    messages: await convertToModelMessages(body.messages),
  });

  return result.toUIMessageStreamResponse();
}
