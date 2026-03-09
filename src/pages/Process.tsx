import { useScadaData } from "@/hooks/useScadaData";
import { ScadaLayout } from "@/components/scada/ScadaLayout";
import { FloorPlanView } from "@/components/scada/FloorPlanView";

const Process = () => {
  const { generators } = useScadaData();

  return (
    <ScadaLayout>
      <div className="h-[calc(100vh-6rem)]">
        <FloorPlanView generators={generators} />
      </div>
    </ScadaLayout>
  );
};

export default Process;
