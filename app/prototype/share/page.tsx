import Link from "next/link";

// THROWAWAY prototype index (prototype-ui-concepts). Delete app/prototype/ when the Prototype gate resolves.

const VARIANTS = [
  {
    href: "/prototype/share/annotate-in-place",
    name: "A · Annotate in place",
    structure: "The page you edit is the page your colleague sees; you attach a note to the specific number it explains.",
  },
  {
    href: "/prototype/share/briefing-wizard",
    name: "B · Briefing wizard",
    structure: "Three steps — pick which numbers to send, answer three structured questions, check and publish.",
  },
  {
    href: "/prototype/share/claim-first",
    name: "C · Claim first",
    structure: "Start from your recommendation; pin the few numbers that back it up; everything else folds away.",
  },
];

export default function ShareProtoIndex() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-8">
      <h1 className="text-2xl font-bold">Share: three structures</h1>
      <p className="text-foreground/70">All three run on the real compute layer with the same sample table. Nothing is stored and no real links are created.</p>
      {VARIANTS.map((v) => (
        <Link key={v.href} href={v.href} className="rounded-xl border border-border bg-surface p-4 hover:border-foreground/40">
          <p className="font-semibold">{v.name}</p>
          <p className="text-sm text-foreground/70">{v.structure}</p>
        </Link>
      ))}
    </div>
  );
}
