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

export interface Scenario {
  id: string;
  title: string;
  role: string;
  situation: string;
  task: string;
  csv: string;
  insight: ScenarioInsight;
  check: ScenarioCheck;
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
  },
];

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
