import { DataScreen } from "@/components/interpret/DataScreen";
import { InterpretView } from "@/components/interpret/InterpretView";

export const metadata = {
  title: "Restate a table",
};

export default function InterpretPage() {
  return (
    <DataScreen mode="own">
      <InterpretView />
    </DataScreen>
  );
}
