import type { ColumnType } from "@/lib/compute/types";

export type GlossaryKey = "retention" | "cohort" | "churn" | "cac" | "ltv";

export interface GlossaryEntry {
  key: GlossaryKey;
  term: string;
  /** Plain-language definition. Static authored content — never generated per request. */
  definition: string;
  /** What a table would need to contain to calculate this. Always shown. */
  dataNeeded: string;
  /** A generic worked example, always labeled "not your data" in the UI. */
  genericExample: string;
  /** Column-name pattern used to spot a matching column. Name AND type must both fit — type alone falsely matches. */
  columnName: RegExp;
  /** Column types an own-data example may use. Empty means the entry is never worked on the user's data (cohort). */
  ownDataTypes: ColumnType[];
}

export const GLOSSARY: GlossaryEntry[] = [
  {
    key: "retention",
    term: "Retention",
    definition:
      "Retention is the share of people who are still around after a set amount of time. If 100 people sign up in January and 40 are still using the product a month later, one-month retention is 40%.",
    dataNeeded:
      "For each group of people who started together (a cohort), how many were still active after 1, 2, 3… months — or a table with one row per person, their sign-up date and the dates they were active.",
    genericExample: "100 people sign up in January. 40 are still active a month later. 40 ÷ 100 = 40% one-month retention.",
    columnName: /retention|retained/i,
    ownDataTypes: ["percent", "ratio"],
  },
  {
    key: "cohort",
    term: "Cohort",
    definition:
      "A cohort is a group of people who started at the same time, such as everyone who signed up in January. Comparing cohorts shows whether newer groups behave better or worse than older ones.",
    dataNeeded:
      "A column that says which group each row belongs to (for example sign-up month), next to the numbers you want to compare.",
    genericExample:
      "January sign-ups: 40% still active after a month. February sign-ups: 44%. The February group is doing better.",
    columnName: /cohort/i,
    ownDataTypes: [],
  },
  {
    key: "churn",
    term: "Churn",
    definition:
      "Churn is the share of customers you lose in a period. If you start a month with 400 customers and 16 cancel, monthly churn is 4%.",
    dataNeeded:
      "For each period, the number of customers at the start and how many left during it — or a churn percentage for each period.",
    genericExample: "400 customers at the start of the month. 16 cancel. 16 ÷ 400 = 4% monthly churn.",
    columnName: /churn/i,
    ownDataTypes: ["percent", "ratio"],
  },
  {
    key: "cac",
    term: "CAC (customer acquisition cost)",
    definition:
      "CAC is how much you spend to win one new customer. If you spend 10,000 on marketing and gain 200 customers, CAC is 50 per customer.",
    dataNeeded: "For each period, total sales and marketing spend and the number of new customers won — or a CAC figure for each period.",
    genericExample: "10,000 spent on marketing. 200 new customers. 10,000 ÷ 200 = 50 per customer.",
    columnName: /\bcac\b|acquisition cost/i,
    ownDataTypes: ["currency"],
  },
  {
    key: "ltv",
    term: "LTV (lifetime value)",
    definition:
      "LTV is the total revenue you expect from one customer over the whole time they stay. If a customer pays 30 a month and typically stays 20 months, LTV is 600.",
    dataNeeded:
      "Average revenue per customer per period, and how long customers typically stay (or the churn rate, which implies it).",
    genericExample: "A customer pays 30 a month and stays about 20 months. 30 × 20 = 600 lifetime value.",
    columnName: /\bltv\b|lifetime value/i,
    ownDataTypes: ["currency"],
  },
];
