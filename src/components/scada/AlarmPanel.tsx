import { cn } from "@/lib/utils";
import type { AlarmData } from "@/hooks/useScadaData";
import { AlertTriangle, AlertCircle, Info, Check } from "lucide-react";

interface AlarmPanelProps {
  alarms: AlarmData[];
  onAcknowledge: (id: string) => void;
}

const severityConfig = {
  critical: { icon: AlertCircle, color: "text-scada-red", bg: "bg-scada-red/10 border-scada-red/30" },
  warning: { icon: AlertTriangle, color: "text-scada-amber", bg: "bg-scada-amber/10 border-scada-amber/30" },
  info: { icon: Info, color: "text-scada-blue", bg: "bg-scada-blue/10 border-scada-blue/30" },
};

export function AlarmPanel({ alarms, onAcknowledge }: AlarmPanelProps) {
  return (
    <div className="scada-panel flex flex-col h-full">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider">Alarms & Events</h3>
        <span className="text-xs font-mono text-scada-red">
          {alarms.filter((a) => !a.acknowledged && a.severity === "critical").length} CRITICAL
        </span>
      </div>
      <div className="flex-1 overflow-y-auto max-h-[400px]">
        {alarms.map((alarm) => {
          const config = severityConfig[alarm.severity];
          const Icon = config.icon;
          return (
            <div
              key={alarm.id}
              className={cn(
                "flex items-start gap-3 p-3 border-b border-border/50 text-sm",
                !alarm.acknowledged && alarm.severity === "critical" && "bg-scada-red/5"
              )}
            >
              <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", config.color, !alarm.acknowledged && alarm.severity === "critical" && "animate-blink")} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {alarm.timestamp.toLocaleTimeString("en-GB")}
                  </span>
                  <span className={cn("text-xs font-mono font-bold", config.color)}>{alarm.source}</span>
                </div>
                <p className="text-foreground/80 truncate">{alarm.message}</p>
              </div>
              {!alarm.acknowledged && (
                <button
                  onClick={() => onAcknowledge(alarm.id)}
                  className="shrink-0 p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  title="Acknowledge"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
