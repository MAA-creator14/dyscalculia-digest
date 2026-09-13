"use client";

import { useState } from "react";
import type { CreateShareResponse, ShareErrorResponse } from "@/app/api/share/route";
import type { ExecSummaryData, NumberCardData } from "@/lib/compute/types";
import { removeManageToken, saveManageToken } from "@/lib/share/client-storage";

interface SharePanelProps {
  cards: NumberCardData[];
  execSummary: ExecSummaryData | null;
  periodLabels: string[] | null;
}

type ShareState = "idle" | "active" | "revoked";

/**
 * Mounted from InterpretView (the only place that holds cards/execSummary/
 * periodLabels in memory — see components/interpret/InterpretView.tsx). Owns
 * the commentary textarea and create/copy-link/edit/revoke actions, and reads
 * /writes the manage-token via lib/share/client-storage.ts.
 */
export function SharePanel({ cards, execSummary, periodLabels }: SharePanelProps) {
  const [state, setState] = useState<ShareState>("idle");
  const [commentary, setCommentary] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [manageToken, setManageToken] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const shareUrl = token && typeof window !== "undefined" ? `${window.location.origin}/share/${token}` : null;

  async function handleCreate() {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interpretation: { cards, execSummary, periodLabels },
          commentary: commentary || null,
        }),
      });
      const data = (await res.json()) as CreateShareResponse | ShareErrorResponse;
      if (data.ok) {
        setToken(data.token);
        setManageToken(data.manageToken);
        saveManageToken(data.token, data.manageToken);
        setState("active");
      } else {
        setError(data.error.message);
      }
    } catch {
      setError("Something went wrong reaching the server. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveCommentary() {
    if (!token || !manageToken) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/share", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, manageToken, commentary: commentary || null }),
      });
      const data = (await res.json()) as { ok: true } | ShareErrorResponse;
      if (!data.ok) {
        setError(data.error.message);
      }
    } catch {
      setError("Something went wrong reaching the server. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRevoke() {
    if (!token || !manageToken) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/share", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, manageToken }),
      });
      const data = (await res.json()) as { ok: true } | ShareErrorResponse;
      if (data.ok) {
        removeManageToken(token);
        setState("revoked");
      } else {
        setError(data.error.message);
      }
    } catch {
      setError("Something went wrong reaching the server. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCopyLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (state === "revoked") {
    return (
      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="text-sm text-foreground/60">This link has been revoked.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="text-sm font-semibold text-foreground/60">Share</p>

      <textarea
        value={commentary}
        onChange={(e) => setCommentary(e.target.value)}
        placeholder="Add your take — what should the reader do with this?"
        rows={3}
        className="mt-3 w-full resize-y rounded-md border border-border bg-background p-2 text-sm"
      />

      {error && <p className="mt-2 text-sm text-negative">{error}</p>}

      {state === "idle" && (
        <button
          type="button"
          onClick={handleCreate}
          disabled={isSaving}
          className="mt-3 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-background disabled:opacity-50"
        >
          {isSaving ? "Creating…" : "Create share link"}
        </button>
      )}

      {state === "active" && shareUrl && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-background"
          >
            {copied ? "Copied" : "Copy link"}
          </button>
          <button
            type="button"
            onClick={handleSaveCommentary}
            disabled={isSaving}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-background disabled:opacity-50"
          >
            Save commentary
          </button>
          <button
            type="button"
            onClick={handleRevoke}
            disabled={isSaving}
            className="rounded-md border border-negative/30 px-3 py-1.5 text-sm font-medium text-negative hover:bg-negative/5 disabled:opacity-50"
          >
            Revoke
          </button>
        </div>
      )}
    </div>
  );
}
