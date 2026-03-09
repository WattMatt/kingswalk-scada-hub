import { useState } from "react";
import { useScadaData } from "@/hooks/useScadaData";
import { ScadaLayout } from "@/components/scada/ScadaLayout";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Check,
  CheckCheck,
  Bell,
  BellOff,
  Filter,
  Clock,
} from "lucide-react";
import type { AlarmData } from "@/hooks/useScadaData";

const severityConfig = {
  critical: { icon: AlertCircle, color: "text-scada-red", bg: "bg-scada-red/10 border-scada-red/30", badge: "bg-destructive text-destructive-foreground" },
  warning: { icon: AlertTriangle, color: "text-scada-amber", bg: "bg-scada-amber/10 border-scada-amber/30", badge: "bg-scada-amber text-background" },
  info: { icon: Info, color: "text-scada-blue", bg: "bg-scada-blue/10 border-scada-blue/30", badge: "bg-scada-blue/20 text-scada-blue" },
};

type SeverityFilter = "all" | "critical" | "warning" | "info";

const Alarms = () => {
  const { alarms, acknowledgeAlarm } = useScadaData();
  const [filter, setFilter] = useState<SeverityFilter>("all");
  const [tab, setTab] = useState("active");

  const activeAlarms = alarms.filter((a) => !a.acknowledged);
  const acknowledgedAlarms = alarms.filter((a) => a.acknowledged);

  const displayAlarms = tab === "active" ? activeAlarms : acknowledgedAlarms;
  const filtered = filter === "all" ? displayAlarms : displayAlarms.filter((a) => a.severity === filter);

  const criticalCount = activeAlarms.filter((a) => a.severity === "critical").length;
  const warningCount = activeAlarms.filter((a) => a.severity === "warning").length;
  const infoCount = activeAlarms.filter((a) => a.severity === "info").length;

  const handleAcknowledgeAll = () => {
    activeAlarms.forEach((a) => acknowledgeAlarm(a.id));
  };

  return (
    <ScadaLayout>
      <div className="space-y-4">
        {/* Header stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Active Alarms"
            value={activeAlarms.length}
            icon={<Bell className="w-4 h-4" />}
            variant={activeAlarms.length > 0 ? "warning" : "normal"}
          />
          <StatCard
            label="Critical"
            value={criticalCount}
            icon={<AlertCircle className="w-4 h-4" />}
            variant={criticalCount > 0 ? "critical" : "normal"}
          />
          <StatCard
            label="Warnings"
            value={warningCount}
            icon={<AlertTriangle className="w-4 h-4" />}
            variant={warningCount > 0 ? "warning" : "normal"}
          />
          <StatCard
            label="Info"
            value={infoCount}
            icon={<Info className="w-4 h-4" />}
            variant="normal"
          />
        </div>

        {/* Main alarm panel */}
        <div className="scada-panel">
          <div className="p-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="bg-secondary/50 border border-border">
                <TabsTrigger value="active" className="font-mono text-xs gap-1.5">
                  <Bell className="w-3 h-3" />
                  Active
                  {activeAlarms.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                      {activeAlarms.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="acknowledged" className="font-mono text-xs gap-1.5">
                  <BellOff className="w-3 h-3" />
                  Acknowledged
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              {/* Severity filter */}
              <div className="flex items-center gap-1">
                <Filter className="w-3 h-3 text-muted-foreground" />
                {(["all", "critical", "warning", "info"] as SeverityFilter[]).map((f) => (
                  <Button
                    key={f}
                    variant={filter === f ? "default" : "ghost"}
                    size="sm"
                    className="h-6 px-2 text-[10px] font-mono uppercase"
                    onClick={() => setFilter(f)}
                  >
                    {f}
                  </Button>
                ))}
              </div>

              {tab === "active" && activeAlarms.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-xs font-mono"
                  onClick={handleAcknowledgeAll}
                >
                  <CheckCheck className="w-3 h-3" />
                  Ack All
                </Button>
              )}
            </div>
          </div>

          {/* Alarm table */}
          <div className="overflow-auto max-h-[calc(100vh-20rem)]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card z-10">
                <tr className="border-b border-border text-xs font-mono text-muted-foreground uppercase">
                  <th className="px-4 py-2.5 text-left w-8"></th>
                  <th className="px-4 py-2.5 text-left">Severity</th>
                  <th className="px-4 py-2.5 text-left">Time</th>
                  <th className="px-4 py-2.5 text-left">Source</th>
                  <th className="px-4 py-2.5 text-left">Message</th>
                  <th className="px-4 py-2.5 text-right w-20">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <BellOff className="w-8 h-8 text-muted-foreground/30" />
                        <p className="text-xs font-mono text-muted-foreground">No alarms to display</p>
                      </div>
                    </td>
                  </tr>
                )}
                {filtered.map((alarm) => (
                  <AlarmRow key={alarm.id} alarm={alarm} onAcknowledge={acknowledgeAlarm} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ScadaLayout>
  );
};

function AlarmRow({ alarm, onAcknowledge }: { alarm: AlarmData; onAcknowledge: (id: string) => void }) {
  const config = severityConfig[alarm.severity];
  const Icon = config.icon;

  return (
    <tr
      className={cn(
        "border-b border-border/50 hover:bg-secondary/30 transition-colors",
        !alarm.acknowledged && alarm.severity === "critical" && "bg-scada-red/5"
      )}
    >
      <td className="px-4 py-3">
        <Icon
          className={cn(
            "w-4 h-4",
            config.color,
            !alarm.acknowledged && alarm.severity === "critical" && "animate-blink"
          )}
        />
      </td>
      <td className="px-4 py-3">
        <span className={cn("text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded", config.badge)}>
          {alarm.severity}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
          <Clock className="w-3 h-3" />
          {alarm.timestamp.toLocaleTimeString("en-GB")}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={cn("text-xs font-mono font-bold", config.color)}>{alarm.source}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-foreground/80">{alarm.message}</span>
      </td>
      <td className="px-4 py-3 text-right">
        {!alarm.acknowledged ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 gap-1 text-[10px] font-mono hover:bg-scada-green/10 hover:text-scada-green"
            onClick={() => onAcknowledge(alarm.id)}
          >
            <Check className="w-3 h-3" />
            ACK
          </Button>
        ) : (
          <span className="text-[10px] font-mono text-muted-foreground">
            <Check className="w-3 h-3 inline" /> Done
          </span>
        )}
      </td>
    </tr>
  );
}

function StatCard({
  label,
  value,
  icon,
  variant,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  variant: "normal" | "warning" | "critical";
}) {
  return (
    <div
      className={cn(
        "scada-panel p-4 flex items-center gap-3",
        variant === "critical" && "border-scada-red/40",
        variant === "warning" && "border-scada-amber/40"
      )}
    >
      <div
        className={cn(
          "w-9 h-9 rounded flex items-center justify-center",
          variant === "critical" ? "bg-scada-red/15 text-scada-red" :
          variant === "warning" ? "bg-scada-amber/15 text-scada-amber" :
          "bg-secondary text-muted-foreground"
        )}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs font-mono text-muted-foreground uppercase">{label}</p>
        <p
          className={cn(
            "text-2xl font-mono font-bold",
            variant === "critical" ? "text-scada-red" :
            variant === "warning" ? "text-scada-amber" :
            "text-foreground"
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export default Alarms;
