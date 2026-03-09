import { useScadaData } from "@/hooks/useScadaData";
import { ScadaLayout } from "@/components/scada/ScadaLayout";
import { FloorPlanView } from "@/components/scada/FloorPlanView";

const Process = () => {
  const { generators, equipment } = useScadaData();

  return (
    <ScadaLayout>
      <div className="h-[calc(100vh-6rem)]">
        <FloorPlanView generators={generators} equipment={equipment} />
      </div>
    </ScadaLayout>
  );
};

export default Process;
