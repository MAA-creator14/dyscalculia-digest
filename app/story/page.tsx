import { DataScreen } from "@/components/interpret/DataScreen";
import { StoryView } from "@/components/story/StoryView";

export const metadata = {
  title: "Tell a data story",
};

export default function StoryPage() {
  return (
    <DataScreen mode="own" title="Tell a data story">
      <StoryView />
    </DataScreen>
  );
}
