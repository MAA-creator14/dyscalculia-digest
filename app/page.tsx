import Link from "next/link";

const DOOR =
  "flex flex-col gap-2 rounded-xl border border-border bg-surface p-5 hover:border-foreground/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-3xl font-bold">Numbers, made easier to read</h1>
        <p className="mt-2 text-foreground/70">
          Get each number in a table back with a plain-language explanation, a redundant up/down
          indicator, and the exact figure — side by side, never one hidden behind the other.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/practice" className={DOOR}>
          <span className="text-lg font-semibold">Try a practice scenario</span>
          <span className="text-sm text-foreground/70">
            Realistic PM situations with made-up numbers. Work out what you&apos;d say, then check
            your answer.
          </span>
        </Link>
        <Link href="/interpret" className={DOOR}>
          <span className="text-lg font-semibold">Use my own data</span>
          <span className="text-sm text-foreground/70">
            Paste a table or upload a CSV. It&apos;s worked out in your browser and stays on your
            device.
          </span>
        </Link>
      </div>
    </div>
  );
}
