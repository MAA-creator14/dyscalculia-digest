import { notFound } from "next/navigation";
import { StoryView } from "@/components/story/StoryView";
import { getScenario, SCENARIOS } from "@/lib/scenarios/scenarios";

export function generateStaticParams() {
  return SCENARIOS.map((scenario) => ({ id: scenario.id }));
}

export async function generateMetadata(props: PageProps<"/practice/[id]/story">) {
  const { id } = await props.params;
  const title = getScenario(id)?.title;
  return { title: title ? `Tell the story: ${title}` : "Tell the story" };
}

export default async function PracticeStoryPage(props: PageProps<"/practice/[id]/story">) {
  const { id } = await props.params;
  const scenario = getScenario(id);
  if (!scenario) notFound();
  return <StoryView scenario={scenario} />;
}
