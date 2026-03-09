import { useScadaData } from "@/hooks/useScadaData";
import { ScadaLayout } from "@/components/scada/ScadaLayout";
import { cn } from "@/lib/utils";
import { TrendChart } from "@/components/scada/TrendChart";
import type { GeneratorData } from "@/hooks/useScadaData";
import {
  Zap,
  Thermometer,
  Gauge,
  Activity,
  Power,
  CircleDot,
} from "lucide-react";

const statusColors: Record<string, string> = {
  running: "bg-scada-green",
  standby: "bg-scada-amber",
  fault: "bg-destructive",
  maintenance: "bg-scada-blue",
};

const statusText: Record<string, string> = {
  running: "text-scada-green",
  standby: "text-scada-amber",
  fault: "text-destructive",
  maintenance: "text-scada-blue",
};

const Generators = () => {
  const { generators, trendData } = useScadaData();

  const totalOutput = generators.reduce((s, g) => s + g.output, 0);
  const totalCapacity = generators.reduce((s, g) => s + g.maxOutput, 0);
  const runningCount = generators.filter((g) => g.status === "running").length;
  const avgTemp = generators.filter((g) => g.status === "running").length > 0
    ? generators.filter((g) => g.status === "running").reduce((s, g) => s + g.temperature, 0) / runningCount
    : 0;

  return (
    <ScadaLayout>
      <div className="space-y-4">
        {/* Summary row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard
            label="Total Output"
            value={`${totalOutput.toFixed(1)}`}
            unit="MW"
            icon={<Zap className="w-4 h-4" />}
            sub={`of ${totalCapacity} MW capacity`}
          />
          <SummaryCard
            label="Online"
            value={`${runningCount}`}
            unit={`/ ${generators.length}`}
            icon={<Power className="w-4 h-4" />}
            sub={`${((runningCount / generators.length) * 100).toFixed(0)}% availability`}
          />
          <SummaryCard
            label="Avg Temperature"
            value={avgTemp.toFixed(1)}
            unit="°C"
            icon={<Thermometer className="w-4 h-4" />}
            sub={avgTemp > 75 ? "Above normal" : "Normal range"}
            warn={avgTemp > 75}
          />
          <SummaryCard
            label="Plant Load"
            value={`${totalCapacity > 0 ? ((totalOutput / totalCapacity) * 100).toFixed(1) : 0}`}
            unit="%"
            icon={<Gauge className="w-4 h-4" />}
            sub="Capacity factor"
          />
        </div>

        {/* Generator detail cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {generators.map((gen) => (
            <GeneratorDetailCard key={gen.id} generator={gen} />
          ))}
        </div>

        {/* Trend */}
        <TrendChart data={trendData} />
      </div>
    </ScadaLayout>
  );
};

function GeneratorDetailCard({ generator }: { generator: GeneratorData }) {
  const loadPercent = generator.maxOutput > 0 ? (generator.output / generator.maxOutput) * 100 : 0;
  const isRunning = generator.status === "running";
  const tempWarn = generator.temperature > 75;
  const tempCritical = generator.temperature > 85;

  return (
    <div className={cn(
      "scada-panel p-0 overflow-hidden",
      generator.status === "fault" && "border-destructive/50"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            isRunning ? "bg-scada-green/15" : "bg-secondary"
          )}>
            <Zap className={cn("w-5 h-5", isRunning ? "text-scada-green" : "text-muted-foreground")} />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono">{generator.id}</h3>
            <p className="text-xs text-muted-foreground">{generator.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2.5 h-2.5 rounded-full",
            statusColors[generator.status],
            isRunning && "animate-pulse-glow"
          )} />
          <span className={cn(
            "text-xs font-mono font-bold uppercase",
            statusText[generator.status]
          )}>
            {generator.status}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Load bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-mono text-muted-foreground">Output</span>
            <div className="text-right">
              <span className="text-lg font-mono font-bold text-foreground">
                {generator.output.toFixed(1)}
              </span>
              <span className="text-xs font-mono text-muted-foreground ml-1">
                / {generator.maxOutput} MW
              </span>
            </div>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000 relative",
                loadPercent > 85 ? "bg-destructive" : loadPercent > 60 ? "bg-scada-amber" : "bg-scada-green"
              )}
              style={{ width: `${loadPercent}%` }}
            >
              {isRunning && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
              )}
            </div>
          </div>
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
            <span>0%</span>
            <span>{loadPercent.toFixed(1)}%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricTile
            label="RPM"
            value={generator.rpm.toString()}
            icon={<Activity className="w-3.5 h-3.5" />}
            normal={!isRunning || (generator.rpm >= 2990 && generator.rpm <= 3010)}
          />
          <MetricTile
            label="Temperature"
            value={`${generator.temperature.toFixed(1)}°C`}
            icon={<Thermometer className="w-3.5 h-3.5" />}
            normal={!tempWarn}
            critical={tempCritical}
          />
          <MetricTile
            label="Voltage"
            value={`${generator.voltage} kV`}
            icon={<Zap className="w-3.5 h-3.5" />}
            normal={true}
          />
          <MetricTile
            label="Load Factor"
            value={`${loadPercent.toFixed(0)}%`}
            icon={<CircleDot className="w-3.5 h-3.5" />}
            normal={loadPercent <= 85}
          />
        </div>
      </div>
    </div>
  );
}

function MetricTile({
  label,
  value,
  icon,
  normal,
  critical,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  normal: boolean;
  critical?: boolean;
}) {
  return (
    <div className={cn(
      "rounded border p-2.5 space-y-1",
      critical ? "border-destructive/40 bg-destructive/5" :
      !normal ? "border-scada-amber/40 bg-scada-amber/5" :
      "border-border bg-secondary/30"
    )}>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] font-mono uppercase">{label}</span>
      </div>
      <p className={cn(
        "text-sm font-mono font-bold",
        critical ? "text-destructive" : !normal ? "text-scada-amber" : "text-foreground"
      )}>
        {value}
      </p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  unit,
  icon,
  sub,
  warn,
}: {
  label: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
  sub: string;
  warn?: boolean;
}) {
  return (
    <div className={cn("scada-panel p-4 flex items-center gap-3", warn && "border-scada-amber/40")}>
      <div className={cn(
        "w-9 h-9 rounded flex items-center justify-center shrink-0",
        warn ? "bg-scada-amber/15 text-scada-amber" : "bg-secondary text-muted-foreground"
      )}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-mono text-muted-foreground uppercase">{label}</p>
        <p className="text-xl font-mono font-bold text-foreground">
          {value} <span className="text-xs text-muted-foreground font-normal">{unit}</span>
        </p>
        <p className={cn("text-[10px] font-mono", warn ? "text-scada-amber" : "text-muted-foreground")}>{sub}</p>
      </div>
    </div>
  );
}

export default Generators;
