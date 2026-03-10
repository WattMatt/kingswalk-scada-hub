import { Zap, Gauge, Activity, TrendingUp, BarChart3, Percent } from "lucide-react";
import { useScadaData } from "@/hooks/useScadaData";

import { ScadaLayout } from "@/components/scada/ScadaLayout";
import { MetricCard } from "@/components/scada/MetricCard";
import { GeneratorCard } from "@/components/scada/GeneratorCard";
import { AlarmPanel } from "@/components/scada/AlarmPanel";
import { TrendChart } from "@/components/scada/TrendChart";
import { SingleLineDiagram } from "@/components/scada/SingleLineDiagram";

const Index = () => {
  const { metrics, generators, alarms, trendData, acknowledgeAlarm } = useScadaData();
  const { data: dbEquipment = [] } = useEquipment();
  const { data: connections = [] } = useEquipmentConnections();

  const freqStatus = Math.abs(metrics.frequency - 50) > 0.05 ? "warning" : "normal";
  const genLoadRatio = metrics.totalLoad / metrics.totalGeneration;
  const loadStatus = genLoadRatio > 0.95 ? "critical" : genLoadRatio > 0.85 ? "warning" : "normal";

  return (
    <ScadaLayout>
      <div className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard
            label="Generation"
            value={metrics.totalGeneration.toFixed(1)}
            unit="MW"
            status="normal"
            icon={<Zap className="w-3.5 h-3.5" />}
          />
          <MetricCard
            label="Load"
            value={metrics.totalLoad.toFixed(1)}
            unit="MW"
            status={loadStatus}
            icon={<BarChart3 className="w-3.5 h-3.5" />}
          />
          <MetricCard
            label="Frequency"
            value={metrics.frequency.toFixed(2)}
            unit="Hz"
            status={freqStatus}
            icon={<Activity className="w-3.5 h-3.5" />}
          />
          <MetricCard
            label="Voltage"
            value={metrics.voltage.toFixed(1)}
            unit="kV"
            status="normal"
            icon={<Gauge className="w-3.5 h-3.5" />}
          />
          <MetricCard
            label="Power Factor"
            value={metrics.powerFactor.toFixed(3)}
            unit=""
            status="normal"
            icon={<TrendingUp className="w-3.5 h-3.5" />}
          />
          <MetricCard
            label="Efficiency"
            value={metrics.efficiency.toFixed(1)}
            unit="%"
            status="normal"
            icon={<Percent className="w-3.5 h-3.5" />}
          />
        </div>

        {/* SLD + Alarms */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <SingleLineDiagram />
          </div>
          <div>
            <AlarmPanel alarms={alarms} onAcknowledge={acknowledgeAlarm} />
          </div>
        </div>

        {/* Generators + Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <TrendChart data={trendData} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {generators.map((gen) => (
              <GeneratorCard key={gen.id} generator={gen} />
            ))}
          </div>
        </div>
      </div>
    </ScadaLayout>
  );
};

export default Index;
