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
        your answer — or practise turning the numbers into a story.
      </p>
      <ul className="flex flex-col gap-3">
        {SCENARIOS.map((scenario) => (
          <li key={scenario.id}>
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-background p-5">
              <Link
                href={`/practice/${scenario.id}`}
                className="hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              >
                {scenario.storyFocused && (
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral">
                    <span aria-hidden="true">📖</span> Storytelling practice
                  </span>
                )}
                <span className="block font-semibold text-foreground">{scenario.title}</span>
                <span className="mt-1 block text-sm text-foreground/70">{scenario.role}</span>
              </Link>
              <Link
                href={`/practice/${scenario.id}/story`}
                className="w-fit text-sm font-medium text-foreground/80 underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              >
                Tell the story (Hook · Line · Sinker) →
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
