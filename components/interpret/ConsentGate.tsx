import type { ReactNode } from "react";

/**
 * Hides a feature that sends data off the device until the user has read exactly what it
 * sends and turned it on. Consent lives in the caller's state and resets for each dataset.
 */
export function ConsentGate({
  title,
  description,
  actionLabel,
  granted,
  onGrant,
  children,
}: {
  title: string;
  description: string;
  actionLabel: string;
  granted: boolean;
  onGrant: () => void;
  children: ReactNode;
}) {
  if (granted) return <>{children}</>;

  return (
    <section className="rounded-xl border border-dashed border-border p-5">
      <h2 className="text-sm font-semibold text-foreground/80">{title}</h2>
      <p className="mt-1 text-sm text-foreground/70">{description}</p>
      <button
        type="button"
        onClick={onGrant}
        className="mt-3 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      >
        {actionLabel}
      </button>
    </section>
  );
}
