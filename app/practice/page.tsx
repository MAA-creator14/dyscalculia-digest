import Link from "next/link";
import { DataModeBadge } from "@/components/interpret/DataModeBadge";
import { SCENARIOS } from "@/lib/scenarios/scenarios";

export const metadata = {
  title: "Practice scenarios",
};

export default function PracticePage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
      <DataModeBadge mode="practice" />
      <div>
        <h1 className="text-2xl font-bold">Practice scenarios</h1>
        <p className="mt-1 text-foreground/70">
          Realistic situations with made-up numbers. Read the data, decide what you&apos;d say,
          then check your answer. Nothing here is real, so there&apos;s nothing to protect.
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        {SCENARIOS.map((scenario) => (
          <li key={scenario.id}>
            <Link
              href={`/practice/${scenario.id}`}
              className="block rounded-xl border border-border bg-surface p-5 hover:border-foreground/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              <p className="font-semibold text-foreground">{scenario.title}</p>
              <p className="mt-1 text-sm text-foreground/70">{scenario.role}</p>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/interpret" className="w-fit text-sm text-foreground/70 underline">
        Use my own data instead
      </Link>
    </div>
  );
}
