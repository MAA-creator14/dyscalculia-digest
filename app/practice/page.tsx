import Link from "next/link";
import { SCENARIOS } from "@/lib/scenarios/scenarios";

export const metadata = {
  title: "Practice scenarios",
};

export default function PracticePage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
      <p className="text-foreground/80">
        Pick a realistic PM situation. Read the made-up data, decide what you&apos;d say, then check
        your answer.
      </p>
      <ul className="flex flex-col gap-3">
        {SCENARIOS.map((scenario) => (
          <li key={scenario.id}>
            <Link
              href={`/practice/${scenario.id}`}
              className="block rounded-xl border border-border bg-background p-5 hover:border-foreground/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              <p className="font-semibold text-foreground">{scenario.title}</p>
              <p className="mt-1 text-sm text-foreground/70">{scenario.role}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
