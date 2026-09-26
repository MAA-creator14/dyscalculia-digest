import { DataScreen } from "@/components/interpret/DataScreen";

export default function PracticeLayout({ children }: LayoutProps<"/practice">) {
  return <DataScreen mode="practice">{children}</DataScreen>;
}
