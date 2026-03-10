import { useState } from "react";

import { ScadaLayout } from "@/components/scada/ScadaLayout";
import { FloorPlanView } from "@/components/scada/FloorPlanView";
import { SingleLineDiagram } from "@/components/scada/SingleLineDiagram";
import { SLDViewer } from "@/components/scada/SLDViewer";
import { Map, GitBranch, FileText } from "lucide-react";

const tabs = [
  { id: "floorplan", label: "Floor Plan", icon: Map },
  { id: "sld", label: "Single Line", icon: GitBranch },
  { id: "pdf", label: "PDF Diagrams", icon: FileText },
] as const;

type TabId = (typeof tabs)[number]["id"];

const Process = () => {
  const { data: dbEquipment = [] } = useEquipment();
  const { data: connections = [] } = useEquipmentConnections();
  const [activeTab, setActiveTab] = useState<TabId>("floorplan");

  return (
    <ScadaLayout>
      <div className="h-[calc(100vh-6rem)] flex flex-col">
        {/* Tab bar */}
        <div className="flex items-center gap-1 px-4 pt-3 pb-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t text-xs font-mono font-semibold uppercase tracking-wider transition-colors border border-b-0 ${
                  active
                    ? "bg-card text-foreground border-border"
                    : "bg-transparent text-muted-foreground border-transparent hover:text-foreground/70"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="flex-1 min-h-0">
          {activeTab === "floorplan" && (
            <FloorPlanView />
          )}
          {activeTab === "sld" && (
            <SingleLineDiagram />
          )}
          {activeTab === "pdf" && <SLDViewer />}
        </div>
      </div>
    </ScadaLayout>
  );
};

export default Process;
