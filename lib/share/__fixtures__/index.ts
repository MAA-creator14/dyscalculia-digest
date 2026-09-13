import type { SharedInterpretation } from "@/lib/share/types";

/**
 * Golden dataset for the Share data-boundary regression suite (see
 * specs/outputs/prd-share-2026-09-12.md "Evals"). The "source" label on each
 * fixture is documentation only — NumberCardData/ExecSummaryData carry no
 * `source` field, so Share never knows or stores where a dataset came from.
 * What's actually varied here: anomalies present/absent, streak present/absent,
 * a null vs. populated execSummary, and one whitespace-only-commentary case.
 */
export interface ShareFixture {
  name: string;
  /** Documentation only — see note above. */
  source: string;
  interpretation: SharedInterpretation;
  commentary: string | null;
}

export const shareFixtures: ShareFixture[] = [
  {
    name: "paste-table, no anomalies, no commentary",
    source: "paste",
    interpretation: {
      cards: [
        {
          name: "Revenue",
          type: "currency",
          values: [100, 120, 90],
          first: 100,
          last: 90,
          formattedFirst: "$100",
          formattedLast: "$90",
          delta: { absolute: -10, percent: -10, direction: "down" },
          directionMeta: { icon: "down", color: "negative", word: "down" },
          fractionDescription: "about a tenth",
          sentence: "$90 is about a tenth lower than $100 (10.0%).",
          anomalies: [],
          streak: null,
        },
      ],
      execSummary: {
        headline: "Revenue dipped slightly this period.",
        movers: ["$90 is about a tenth lower than $100 (10.0%)."],
        streak: null,
        worstAnomaly: null,
        dataQualityCaveats: [],
      },
      periodLabels: ["Jan", "Feb", "Mar"],
    },
    commentary: null,
  },
  {
    name: "CSV, with anomalies, with commentary",
    source: "csv",
    interpretation: {
      cards: [
        {
          name: "Signups",
          type: "count",
          values: [1204, 1436, 0],
          first: 1204,
          last: 0,
          formattedFirst: "1,204",
          formattedLast: "0",
          delta: { absolute: -1204, percent: null, direction: "down" },
          directionMeta: { icon: "down", color: "negative", word: "down" },
          fractionDescription: null,
          sentence: "Signups dropped to 0 — worth a second look.",
          anomalies: [
            { index: 2, type: "sudden_zero", reason: "Signups fell to zero after two periods of growth.", severity: 9 },
          ],
          streak: null,
        },
      ],
      execSummary: {
        headline: "Signups fell to zero this period.",
        movers: ["Signups dropped to 0 — worth a second look."],
        streak: null,
        worstAnomaly: {
          cardName: "Signups",
          anomaly: { index: 2, type: "sudden_zero", reason: "Signups fell to zero after two periods of growth.", severity: 9 },
        },
        dataQualityCaveats: [],
      },
      periodLabels: ["Jan", "Feb", "Mar"],
    },
    commentary: "Watch this one closely — might be a tracking issue, not a real drop.",
  },
  {
    name: "vision-extracted screenshot, with streak, with commentary",
    source: "screenshot",
    interpretation: {
      cards: [
        {
          name: "Churn",
          type: "percent",
          values: [2, 3, 4, 5],
          first: 2,
          last: 5,
          formattedFirst: "2%",
          formattedLast: "5%",
          delta: { absolute: 3, percent: 150, direction: "up" },
          directionMeta: { icon: "up", color: "negative", word: "up" },
          fractionDescription: "about double",
          sentence: "5% is about double 2% (150.0%).",
          anomalies: [],
          streak: { length: 4, direction: "up" },
        },
      ],
      execSummary: {
        headline: "Churn has climbed for four periods in a row.",
        movers: ["5% is about double 2% (150.0%)."],
        streak: { cardName: "Churn", streak: { length: 4, direction: "up" } },
        worstAnomaly: null,
        dataQualityCaveats: [],
      },
      periodLabels: ["Q1", "Q2", "Q3", "Q4"],
    },
    commentary: "Extracted from a dashboard screenshot — worth double-checking against the source.",
  },
  {
    name: "Google Sheets, null execSummary, long multi-paragraph commentary",
    source: "sheets",
    interpretation: {
      cards: [
        {
          name: "Active users",
          type: "count",
          values: [500, 510],
          first: 500,
          last: 510,
          formattedFirst: "500",
          formattedLast: "510",
          delta: { absolute: 10, percent: 2, direction: "up" },
          directionMeta: { icon: "up", color: "positive", word: "up" },
          fractionDescription: null,
          sentence: "510 is slightly higher than 500 (2.0%).",
          anomalies: [],
          streak: null,
        },
      ],
      execSummary: null,
      periodLabels: null,
    },
    commentary:
      "This is roughly flat, which is expected given we didn't ship anything this sprint.\n\nRecommend we hold off on any messaging about growth until next quarter's launch.",
  },
  {
    name: "whitespace-only commentary (must normalize to no-commentary)",
    source: "paste",
    interpretation: {
      cards: [
        {
          name: "Refunds",
          type: "count",
          values: [3, 3],
          first: 3,
          last: 3,
          formattedFirst: "3",
          formattedLast: "3",
          delta: { absolute: 0, percent: 0, direction: "flat" },
          directionMeta: { icon: "flat", color: "neutral", word: "unchanged" },
          fractionDescription: null,
          sentence: "3 and 3 are the same.",
          anomalies: [],
          streak: null,
        },
      ],
      execSummary: null,
      periodLabels: null,
    },
    commentary: "   \n  ",
  },
];
