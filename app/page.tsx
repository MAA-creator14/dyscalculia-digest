import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-3xl font-bold">Numbers, made easier to read</h1>
        <p className="mt-2 text-foreground/70">
          Paste a metrics table or spreadsheet export and get each number back with a
          plain-language explanation, a redundant up/down indicator, and the exact figure —
          side by side, never one hidden behind the other.
        </p>
      </div>
      <Link
        href="/interpret"
        className="inline-flex w-fit items-center rounded-lg bg-positive px-5 py-3 text-sm font-semibold text-background"
      >
        Restate a table
      </Link>
    </div>
  );
}
