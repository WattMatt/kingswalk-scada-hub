import { ScadaLayout } from "@/components/scada/ScadaLayout";
import { FloorPlanView } from "@/components/scada/FloorPlanView";

const FloorPlan = () => {
  return (
    <ScadaLayout>
      <div className="h-[calc(100vh-8rem)]">
        <FloorPlanView />
      </div>
    </ScadaLayout>
  );
};

export default FloorPlan;
