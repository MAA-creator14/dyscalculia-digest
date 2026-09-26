/**
 * Always-visible reminder of whose numbers are on screen. Practice figures must never be
 * mistaken for real ones — a practice number pasted into a real update is exactly the kind of
 * mistake this product exists to prevent.
 */
export function DataModeBadge({ mode }: { mode: "practice" | "own" }) {
  const practice = mode === "practice";
  return (
    <p
      className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
        practice ? "border-neutral/50 text-neutral" : "border-positive/50 text-positive"
      }`}
    >
      <span aria-hidden="true">{practice ? "◇" : "●"}</span>
      {practice ? "Practice data — not real numbers" : "Your data — calculated on this device only"}
    </p>
  );
}
