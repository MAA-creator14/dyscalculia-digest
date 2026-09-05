import type { AnomalyFlag } from "@/lib/compute/types";

const LABELS: Record<AnomalyFlag["type"], string> = {
  outlier: "Unusual value",
  sign_flip: "Sign changed",
  sudden_zero: "Dropped to zero",
};

/** "Worth a second look" panel for one metric's anomalies (see PLAN.md Flow A). */
export function AnomalyPanel({ anomalies }: { anomalies: AnomalyFlag[] }) {
  if (anomalies.length === 0) return null;

  return (
    <div className="mt-3 rounded-lg border border-negative/30 bg-negative/5 p-3">
      <p className="text-sm font-semibold text-negative">Worth a second look</p>
      <ul className="mt-1 space-y-1">
        {anomalies.map((anomaly, i) => (
          <li key={i} className="text-sm text-foreground/80">
            <span className="font-medium">{LABELS[anomaly.type]}:</span> {anomaly.reason}
          </li>
        ))}
      </ul>
    </div>
  );
}
