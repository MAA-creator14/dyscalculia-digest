"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { interpretTable, type InterpretResult } from "@/lib/compute/interpret";

// THROWAWAY prototype code (prototype-ui-concepts). Delete app/prototype/ when the Prototype gate resolves.

export const SAMPLE_CSV = `Month,Revenue,Signups,Churn %
Jan,48200,1204,2.1%
Feb,51300,1436,2.0%
Mar,55900,1590,1.9%
Apr,54100,1388,2.8%
May,49800,1102,3.6%
Jun,52400,1275,3.1%
`;

/** The real compute layer, run in the browser exactly as the real Restate flow does. */
export function useSampleResult() {
  return useMemo(() => {
    const r = interpretTable(SAMPLE_CSV);
    if (!r.ok) throw new Error(r.error.message);
    return r as InterpretResult;
  }, []);
}

/** Whitespace-only (including zero-width) notes count as no note — the finding from the system-model prototype. */
export function cleanNote(text: string): string {
  const visible = text.replace(/[​-‍﻿]/g, "").trim();
  return visible === "" ? "" : text.trim();
}

const VARIANTS = [
  { href: "/prototype/share/annotate-in-place", label: "A · Annotate in place" },
  { href: "/prototype/share/briefing-wizard", label: "B · Briefing wizard" },
  { href: "/prototype/share/claim-first", label: "C · Claim first" },
];

export function ProtoNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Prototype variants" className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-sm">
        <Link href="/prototype/share" className="font-semibold underline-offset-2 hover:underline">
          Share prototypes
        </Link>
        <span className="text-foreground/40">Throwaway — nothing here is stored</span>
        <span className="flex-1" />
        {VARIANTS.map((v) => (
          <Link
            key={v.href}
            href={v.href}
            aria-current={pathname === v.href ? "page" : undefined}
            className={`rounded-md border px-3 py-1 ${
              pathname === v.href ? "border-foreground bg-background font-semibold" : "border-border"
            }`}
          >
            {v.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

/** Fake publish: shows what the link bar would do. Nothing is sent anywhere. */
export function usePublish() {
  const [token, setToken] = useState<string | null>(null);
  const [revoked, setRevoked] = useState(false);
  return {
    published: token !== null,
    revoked,
    link: token ? `https://dyscalculia-theta.vercel.app/share/${token}` : null,
    publish() {
      setToken(`demo-${Math.random().toString(36).slice(2, 10)}`);
      setRevoked(false);
    },
    revoke() {
      setRevoked(true);
    },
  };
}

export const STORAGE_NOTICE =
  "Publishing stores the calculated figures shown here and your notes on our server until you revoke the link. Your original table is never stored.";

export function LinkBar({
  link,
  revoked,
  onRevoke,
  extra,
}: {
  link: string;
  revoked: boolean;
  onRevoke: () => void;
  extra?: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  if (revoked) {
    return (
      <p className="rounded-lg border border-border bg-surface p-3 text-sm text-foreground/70">
        This link has been revoked. Anyone opening it now sees &ldquo;This link isn&apos;t available.&rdquo;
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">Read-only link (prototype — won&apos;t open)</p>
      <p className="font-mono text-sm break-all">{link}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(link);
            } catch {
              /* prototype: clipboard may be blocked */
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-background"
        >
          {copied ? "Copied" : "Copy link"}
        </button>
        {extra}
        <button
          type="button"
          onClick={onRevoke}
          className="rounded-md border border-negative/40 px-3 py-1.5 text-sm font-medium text-negative hover:bg-negative/5"
        >
          Revoke
        </button>
      </div>
    </div>
  );
}

/** Plain-text note: rendered as text (never HTML), line breaks kept. */
export function NoteText({ text }: { text: string }) {
  return <p className="whitespace-pre-wrap text-base text-foreground/90">{text}</p>;
}
