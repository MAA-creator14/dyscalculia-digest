import { resolveShareForView } from "@/lib/share/db";
import { ShareUnavailable } from "@/components/share/ShareUnavailable";
import { ShareView } from "@/components/share/ShareView";

/**
 * Read-only, no auth required (see PLAN.md's "no auth for the first demoable
 * slice"). Resolves the token server-side and renders directly — a reader's
 * browser never issues a network request beyond this page's own HTML, so the
 * computed summary is the only thing that ever leaves the server for this route.
 */
export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await resolveShareForView(token);

  if (result.status === "unavailable") {
    return <ShareUnavailable />;
  }

  return <ShareView record={result.record} />;
}
