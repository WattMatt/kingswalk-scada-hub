import { cn } from "@/lib/utils";
import type { GeneratorData } from "@/hooks/useScadaData";

interface GeneratorCardProps {
  generator: GeneratorData;
}

const statusColors = {
  running: "bg-scada-green",
  standby: "bg-scada-amber",
  fault: "bg-scada-red",
  maintenance: "bg-scada-blue",
};

const statusLabels = {
  running: "RUNNING",
  standby: "STANDBY",
  fault: "FAULT",
  maintenance: "MAINT",
};

export function GeneratorCard({ generator }: GeneratorCardProps) {
  const loadPercent = generator.maxOutput > 0 ? (generator.output / generator.maxOutput) * 100 : 0;

  return (
    <div className="scada-panel p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground font-mono">{generator.id}</div>
          <div className="text-sm font-semibold">{generator.name}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", statusColors[generator.status], generator.status === "running" && "animate-pulse-glow")} />
          <span className="text-xs font-mono uppercase text-muted-foreground">{statusLabels[generator.status]}</span>
        </div>
      </div>

      {/* Load bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs font-mono text-muted-foreground">
          <span>Load</span>
          <span>{generator.output} / {generator.maxOutput} MW</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000",
              loadPercent > 85 ? "bg-scada-red" : loadPercent > 60 ? "bg-scada-amber" : "bg-scada-green"
            )}
            style={{ width: `${loadPercent}%` }}
          />
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-xs text-muted-foreground">RPM</div>
          <div className="font-mono text-sm">{generator.rpm}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Temp</div>
          <div className={cn("font-mono text-sm", generator.temperature > 75 ? "text-scada-amber" : "text-foreground")}>
            {generator.temperature}°C
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Voltage</div>
          <div className="font-mono text-sm">{generator.voltage} kV</div>
        </div>
      </div>
    </div>
  );
}
