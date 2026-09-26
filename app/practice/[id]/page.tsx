import { notFound } from "next/navigation";
import { InterpretView } from "@/components/interpret/InterpretView";
import { getScenario, SCENARIOS } from "@/lib/scenarios/scenarios";

export function generateStaticParams() {
  return SCENARIOS.map((scenario) => ({ id: scenario.id }));
}

export async function generateMetadata(props: PageProps<"/practice/[id]">) {
  const { id } = await props.params;
  return { title: getScenario(id)?.title ?? "Practice scenario" };
}

export default async function PracticeScenarioPage(props: PageProps<"/practice/[id]">) {
  const { id } = await props.params;
  const scenario = getScenario(id);
  if (!scenario) notFound();
  return <InterpretView scenario={scenario} />;
}
