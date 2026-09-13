import type { ExecSummaryData, NumberCardData } from "@/lib/compute/types";

/** The computed-only payload a share link carries — never the raw source table. */
export interface SharedInterpretation {
  cards: NumberCardData[];
  execSummary: ExecSummaryData | null;
  periodLabels: string[] | null;
}

export interface ShareRecord {
  token: string;
  interpretation: SharedInterpretation;
  /** null means "no commentary to show" — whitespace-only input is normalized to null. */
  commentary: string | null;
  revoked: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * What the share page renders. "unavailable" covers both a revoked link and a
 * token that was never issued — deliberately collapsed into one shape here so
 * the page component cannot leak the distinction even by accident (Story 3 AC2).
 */
export type ShareViewResult = { status: "active"; record: ShareRecord } | { status: "unavailable" };

export type ManageResult = "ok" | "not_found";
