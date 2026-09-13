/**
 * One generic message, used identically whether the token was revoked or never
 * issued — the distinction is already erased at the data layer (see
 * lib/share/db.ts resolveShareForView), this component just has nothing to leak.
 */
export function ShareUnavailable() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-2 px-4 py-20 text-center">
      <p className="text-lg font-medium">This link isn&apos;t available.</p>
      <p className="text-sm text-foreground/60">It may have been revoked, or the link may be incorrect.</p>
    </div>
  );
}
