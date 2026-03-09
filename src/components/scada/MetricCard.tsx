import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  unit: string;
  status?: "normal" | "warning" | "critical";
  icon?: React.ReactNode;
}

export function MetricCard({ label, value, unit, status = "normal", icon }: MetricCardProps) {
  return (
    <div className="scada-panel p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
        {icon}
        {label}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "font-mono text-2xl font-bold tabular-nums",
            status === "normal" && "text-scada-green scada-glow-green",
            status === "warning" && "text-scada-amber scada-glow-amber",
            status === "critical" && "text-scada-red scada-glow-red"
          )}
        >
          {value}
        </span>
        <span className="text-muted-foreground text-sm font-mono">{unit}</span>
      </div>
    </div>
  );
}
