/**
 * Hand-built samples in the shapes PMs commonly paste. NOT real user data — none exists yet.
 * Each is labeled with ground truth (what the rows really are, and which glossary
 * metrics the data genuinely supports) so the rules' output can be judged right/wrong.
 */
export type RowsAre = "periods" | "categories" | "cohorts" | "long" | "single" | "entities";
export type GlossaryKey = "retention" | "cohort" | "churn" | "cac" | "ltv";

export interface Sample {
  id: string;
  title: string;
  rowsAre: RowsAre;
  /** Time-ordered periods of one series: the only shape where trend/streak/period claims are true. */
  trendValid: boolean;
  supports: GlossaryKey[];
  csv: string;
}

export const SAMPLES: Sample[] = [
  {
    id: "weekly-kpi",
    title: "Weekly product KPIs (ISO dates)",
    rowsAre: "periods",
    trendValid: true,
    supports: [],
    csv: `Week,Signups,Activation rate,Revenue,Active users
2026-01-05,"1,204",41.2%,"£12,400","8,310"
2026-01-12,"1,180",40.1%,"£12,950","8,402"
2026-01-19,"1,266",42.8%,"£13,100","8,377"
2026-01-26,"1,301",43.5%,"£13,720","8,590"
2026-02-02,"1,244",41.9%,"£14,050","8,655"
2026-02-09,"1,388",44.7%,"£14,310","8,791"
2026-02-16,"1,412",45.2%,"£15,080","8,943"
2026-02-23,"1,097",39.8%,"£14,920","8,880"`,
  },
  {
    id: "monthly-names",
    title: "Monthly SaaS metrics, month-name labels",
    rowsAre: "periods",
    trendValid: true,
    supports: ["churn"],
    csv: `Month,MRR,Customers,Churn rate
Jan 2026,"£48,200",412,3.1%
Feb 2026,"£50,900",425,2.9%
Mar 2026,"£52,300",431,3.4%
Apr 2026,"£55,100",440,3.8%
May 2026,"£56,000",447,4.2%
Jun 2026,"£57,300",451,4.6%`,
  },
  {
    id: "uk-slash-unambiguous",
    title: "Weekly, UK slash dates (unambiguous)",
    rowsAre: "periods",
    trendValid: true,
    supports: [],
    csv: `Week starting,Tickets opened,Avg resolution hours
13/01/2026,182,6.4
20/01/2026,175,6.1
27/01/2026,201,7.2
03/02/2026,219,8.5
10/02/2026,230,9.1`,
  },
  {
    id: "uk-slash-ambiguous",
    title: "Monthly, slash dates (ambiguous DD/MM vs MM/DD)",
    rowsAre: "periods",
    trendValid: true,
    supports: [],
    csv: `Month,Trials started,Paid conversions
01/02/2026,940,112
01/03/2026,1010,121
01/04/2026,980,109
01/05/2026,1105,131`,
  },
  {
    id: "retention-triangle",
    title: "Retention cohort triangle (wide)",
    rowsAre: "cohorts",
    trendValid: false,
    supports: ["retention", "cohort"],
    csv: `Cohort,M0,M1,M2,M3,M4
Jan 2026,100%,41%,33%,29%,27%
Feb 2026,100%,44%,35%,31%,
Mar 2026,100%,39%,31%,,
Apr 2026,100%,46%,,,
May 2026,100%,,,,`,
  },
  {
    id: "retention-long",
    title: "Retention, long format (cohort × months since signup)",
    rowsAre: "long",
    trendValid: false,
    supports: ["retention", "cohort"],
    csv: `Cohort,Months since signup,Retained users,Cohort size
Jan 2026,0,500,500
Jan 2026,1,205,500
Jan 2026,2,165,500
Feb 2026,0,540,540
Feb 2026,1,238,540
Feb 2026,2,189,540
Mar 2026,0,610,610
Mar 2026,1,238,610
Mar 2026,2,190,610`,
  },
  {
    id: "channel-breakdown",
    title: "Acquisition by channel (rows are categories)",
    rowsAre: "categories",
    trendValid: false,
    supports: ["cac"],
    csv: `Channel,Spend,Signups,CAC
Paid search,"£18,400",620,£29.68
Social,"£9,200",410,£22.44
Email,"£1,100",380,£2.89
Referral,"£2,600",295,£8.81
Organic,£0,"1,140",£0.00`,
  },
  {
    id: "single-snapshot",
    title: "One-row snapshot",
    rowsAre: "single",
    trendValid: false,
    supports: [],
    csv: `Date,Signups,Revenue
2026-03-01,"1,240","£15,300"`,
  },
  {
    id: "suffix-money",
    title: "Money written as $1.2M / £45k",
    rowsAre: "periods",
    trendValid: true,
    supports: [],
    csv: `Quarter end,ARR,Customers
2025-03-31,$1.2M,310
2025-06-30,$1.4M,342
2025-09-30,$1.7M,381
2025-12-31,$1.9M,405`,
  },
  {
    id: "accounting-negatives",
    title: "P&L with (£1,200) style negatives",
    rowsAre: "periods",
    trendValid: true,
    supports: [],
    csv: `Month end,Profit
2026-01-31,"£4,500"
2026-02-28,"(£1,200)"
2026-03-31,"£2,300"`,
  },
  {
    id: "two-period",
    title: "Quarter-vs-quarter comparison (2 rows)",
    rowsAre: "periods",
    trendValid: true,
    supports: [],
    csv: `Quarter end,Revenue,Costs,Signups
2026-03-31,"£410,000","£355,000","3,900"
2026-06-30,"£468,000","£371,000","4,410"`,
  },
  {
    id: "ticket-list",
    title: "Ticket export (rows are entities; has ID + date)",
    rowsAre: "entities",
    trendValid: false,
    supports: [],
    csv: `Ticket ID,Opened,Resolution hours,Priority
4501,2026-03-02,5.5,High
4502,2026-03-02,12.0,Low
4503,2026-03-03,3.2,High
4504,2026-03-03,8.1,Medium
4505,2026-03-03,26.4,Low
4506,2026-03-04,4.0,High`,
  },
  {
    id: "saas-full",
    title: "Monthly SaaS, everything present (best case)",
    rowsAre: "periods",
    trendValid: true,
    supports: ["churn", "cac", "ltv"],
    csv: `Month,MRR,New customers,Churned customers,Churn rate,CAC,LTV
2026-01-01,"£48,200",38,15,3.1%,£142,"£1,020"
2026-02-01,"£50,900",41,12,2.9%,£139,"£1,050"
2026-03-01,"£52,300",36,15,3.4%,£151,"£985"
2026-04-01,"£55,100",44,17,3.8%,£148,"£940"
2026-05-01,"£56,000",39,19,4.2%,£160,"£905"
2026-06-01,"£57,300",41,20,4.6%,£166,"£870"`,
  },
  {
    id: "zero-start",
    title: "New feature usage (starts at 0)",
    rowsAre: "periods",
    trendValid: true,
    supports: [],
    csv: `Week,Feature uses,Adoption
2026-02-02,0,0%
2026-02-09,14,1%
2026-02-16,58,4%
2026-02-23,131,9%`,
  },
  {
    id: "flat-series",
    title: "Constant series",
    rowsAre: "periods",
    trendValid: true,
    supports: [],
    csv: `Week,Seats,Uptime
2026-03-02,250,99.9
2026-03-09,250,99.9
2026-03-16,250,99.9`,
  },
  {
    id: "segment-long",
    title: "Dates repeated per segment (mixed long)",
    rowsAre: "long",
    trendValid: false,
    supports: [],
    csv: `Week,Segment,Signups
2026-03-02,Free,900
2026-03-02,Pro,120
2026-03-09,Free,940
2026-03-09,Pro,131
2026-03-16,Free,880
2026-03-16,Pro,150`,
  },
];
