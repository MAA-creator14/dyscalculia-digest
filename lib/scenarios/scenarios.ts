import type { IndicatorKind } from "@/lib/story/types";

/**
 * Practice scenarios: realistic PM situations on made-up data, so someone can build
 * confidence without pasting sensitive company numbers. Each has a role, a moment
 * (the meeting they're preparing for), a task, and a comprehension check.
 *
 * `insight` names what the deterministic engine must surface for the check's correct
 * answer to be true — lib/scenarios/scenarios.test.ts enforces it, so the check can
 * never contradict what the cards show.
 */
export interface ScenarioCheck {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface ScenarioInsight {
  /** Which exec-summary slot carries the insight. */
  slot: "headline" | "streak" | "worstAnomaly";
  metric: string;
}

/**
 * How we'd tag and use the metrics when telling this scenario's story (Hook / Line / Sinker).
 * Shown after the PM tags the metrics themselves, so they can compare — leading vs lagging
 * depends on context, so this is "how we'd see it", not a mark scheme.
 */
export interface ScenarioStory {
  tags: Record<string, IndicatorKind>;
  /** The lagging result the Hook is built on. */
  outcome: string;
  /** Leading indicators that explain it, for the Line. */
  drivers: string[];
  why: string;
}

export interface Scenario {
  id: string;
  title: string;
  role: string;
  situation: string;
  task: string;
  csv: string;
  insight: ScenarioInsight;
  check: ScenarioCheck;
  story: ScenarioStory;
  /** Written specifically to practise telling a leading → lagging story. */
  storyFocused?: boolean;
}

export const SCENARIOS: Scenario[] = [
  {
    id: "activation-after-pricing",
    title: "Activation after a pricing change",
    role: "You're the PM for onboarding at a B2B SaaS company.",
    situation:
      "A new pricing page went live at the start of week 4. Signups look healthy, but someone in Slack said activation “feels off”. Your team stand-up is in 10 minutes.",
    task: "Work out the one thing you'd say at stand-up, and which number backs it up.",
    csv: `Week,Signups,Activation rate,Paid conversions
2026-02-02,"1,210",44.0%,212
2026-02-09,"1,240",43.6%,208
2026-02-16,"1,265",44.2%,215
2026-02-23,"1,290",38.9%,190
2026-03-02,"1,305",35.1%,176
2026-03-09,"1,330",31.8%,179`,
    insight: { slot: "headline", metric: "Activation rate" },
    check: {
      question: "What should you lead your stand-up with?",
      options: [
        "Signups are growing, so the pricing change is working.",
        "Activation rate is about a quarter lower, and has fallen every week since the pricing change.",
        "Paid conversions are going up every week.",
      ],
      correctIndex: 1,
    },
    story: {
      tags: { Signups: "leading", "Activation rate": "leading", "Paid conversions": "lagging" },
      outcome: "Paid conversions",
      drivers: ["Activation rate"],
      why: "Paid conversions is the result the business feels. Activation happens first and dropped straight after the pricing change, so it's the early warning that explains the result — and the thing the team can act on now.",
    },
  },
  {
    id: "enterprise-deal-spike",
    title: "The revenue spike",
    role: "You're a PM on the self-serve growth team.",
    situation:
      "Your CEO saw one very large month on the revenue chart and asked in the all-hands whether revenue has “taken off”. You've been asked to answer in the leadership meeting.",
    task: "Decide whether revenue has taken off, and explain the big month in one sentence.",
    csv: `Month,Revenue,New customers
2025-04-01,"£48,200",31
2025-05-01,"£49,100",29
2025-06-01,"£47,900",33
2025-07-01,"£50,300",30
2025-08-01,"£49,800",32
2025-09-01,"£51,200",34
2025-10-01,"£50,600",31
2025-11-01,"£52,100",33
2025-12-01,"£138,400",34
2026-01-01,"£51,900",32
2026-02-01,"£52,800",35
2026-03-01,"£53,300",33`,
    insight: { slot: "worstAnomaly", metric: "Revenue" },
    check: {
      question: "What's the most accurate answer to the CEO?",
      options: [
        "Yes — revenue nearly tripled and has stayed there.",
        "One month was unusually high; the underlying trend is steady growth of about a tenth over the year.",
        "Revenue has been falling since the big month.",
      ],
      correctIndex: 1,
    },
    story: {
      tags: { Revenue: "lagging", "New customers": "leading" },
      outcome: "Revenue",
      drivers: ["New customers"],
      why: "Revenue is the result. Compared with revenue, new customers come first — and they barely changed in the big month, which is a clue that one large deal, not a new trend, caused the spike.",
    },
  },
  {
    id: "churn-creeping-up",
    title: "Churn creeping up",
    role: "You're the PM for a subscription product's core experience.",
    situation:
      "Customer numbers are still growing, so nobody's worried. You're preparing the monthly product review and want to flag anything the headline growth might be hiding.",
    task: "Find the number that deserves attention in the product review, and say how long it's been going on.",
    csv: `Month,Active customers,Monthly churn rate,NPS
2025-10-01,"4,120",2.1%,42
2025-11-01,"4,180",2.0%,41
2025-12-01,"4,230",2.2%,43
2026-01-01,"4,210",2.5%,40
2026-02-01,"4,275",2.8%,38
2026-03-01,"4,280",3.2%,39`,
    insight: { slot: "streak", metric: "Monthly churn rate" },
    check: {
      question: "What should you flag in the product review?",
      options: [
        "Active customers are growing, so everything is fine.",
        "NPS has dropped by half.",
        "Monthly churn rate has risen four months in a row — it's about half higher than in October.",
      ],
      correctIndex: 2,
    },
    story: {
      tags: { "Active customers": "lagging", "Monthly churn rate": "lagging", NPS: "leading" },
      outcome: "Monthly churn rate",
      drivers: ["NPS"],
      why: "Churn is the result: people have already left. How satisfied people are (NPS) tends to change before they leave, so it's the leading signal — here it slipped while churn rose.",
    },
  },
  {
    id: "onboarding-checklist-retention",
    title: "Did the onboarding checklist work?",
    role: "You're the PM who shipped a new onboarding checklist in July.",
    situation:
      "Six months on, leadership is deciding whether to fund a second onboarding project. They want to know if the checklist made a difference to the result they care about.",
    task: "Tell the story: pick the result to lead with, and the early signals that explain it.",
    csv: `Month,Checklist completion,Week-1 active users,Month-3 retention
2025-07-01,38.0%,52.0%,21.0%
2025-08-01,41.5%,53.1%,21.4%
2025-09-01,47.0%,56.8%,22.9%
2025-10-01,53.2%,59.5%,24.6%
2025-11-01,57.9%,62.0%,26.0%
2025-12-01,61.0%,63.8%,27.1%`,
    insight: { slot: "headline", metric: "Checklist completion" },
    check: {
      question: "Which is the strongest opening (Hook) for leadership?",
      options: [
        "Checklist completion went up from 38.0% to 61.0%.",
        "Month-3 retention is roughly 30% higher than in July — and the early signals that come before it, like checklist completion, rose first.",
        "Week-1 active users went up a bit.",
      ],
      correctIndex: 1,
    },
    story: {
      tags: { "Checklist completion": "leading", "Week-1 active users": "leading", "Month-3 retention": "lagging" },
      outcome: "Month-3 retention",
      drivers: ["Checklist completion", "Week-1 active users"],
      why: "Leadership cares about retention — the result. Checklist completion and week-1 activity happen in someone's first days, long before month 3, so they're the leading signals that explain why retention moved.",
    },
    storyFocused: true,
  },
  {
    id: "trial-invites-conversion",
    title: "Revenue's fine… isn't it?",
    role: "You're the PM for the free trial of a team collaboration tool.",
    situation:
      "MRR is still up on January, so the leadership update looks calm. But a change in week 4 moved the “invite a teammate” step out of the trial setup flow.",
    task: "Tell the story: what should leadership worry about before it shows up in revenue?",
    csv: `Week,Trial signups,Trial projects created,Invites sent,Paid conversions,MRR
2026-01-05,820,1430,960,64,"$41,200"
2026-01-12,835,1455,975,66,"$41,900"
2026-01-19,810,1420,940,65,"$42,500"
2026-01-26,845,1180,610,63,"$43,000"
2026-02-02,830,1150,580,55,"$43,100"
2026-02-09,840,1120,560,48,"$42,700"
2026-02-16,825,1105,540,44,"$42,100"`,
    insight: { slot: "headline", metric: "Invites sent" },
    check: {
      question: "What's the most useful warning for leadership?",
      options: [
        "MRR is up, so the trial is fine.",
        "Trial signups are flat, so nothing has changed.",
        "Paid conversions are about a third lower. Invites sent, which come first, fell from week 4 — MRR is likely to follow.",
      ],
      correctIndex: 2,
    },
    story: {
      tags: {
        "Trial signups": "leading",
        "Trial projects created": "leading",
        "Invites sent": "leading",
        "Paid conversions": "lagging",
        MRR: "lagging",
      },
      outcome: "Paid conversions",
      drivers: ["Invites sent", "Trial projects created"],
      why: "MRR lags furthest behind, so it still looks fine. Paid conversions is the result that has already moved. Invites and projects happen during the trial — they fell first, right after the week-4 change, so they explain the drop and show where to act.",
    },
    storyFocused: true,
  },
];

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
