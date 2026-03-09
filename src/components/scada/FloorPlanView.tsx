import { useState } from "react";
import { ZoomIn, ZoomOut, Maximize2, Move } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GeneratorData } from "@/hooks/useScadaData";

const statusColor: Record<string, string> = {
  running: "bg-scada-green",
  standby: "bg-scada-amber",
  fault: "bg-destructive",
  maintenance: "bg-blue-500",
};

const statusGlow: Record<string, string> = {
  running: "shadow-[0_0_8px_hsl(142,71%,45%)]",
  standby: "shadow-[0_0_8px_hsl(43,96%,56%)]",
  fault: "shadow-[0_0_8px_hsl(0,72%,51%)]",
  maintenance: "",
};

interface FloorPlanViewProps {
  generators: GeneratorData[];
}

export function FloorPlanView({ generators }: FloorPlanViewProps) {
  const [zoom, setZoom] = useState(100);

  return (
    <div className="scada-panel p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider">Floor Plan Layout</h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setZoom((z) => Math.max(50, z - 25))}
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <span className="text-xs font-mono text-muted-foreground w-10 text-center">{zoom}%</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setZoom((z) => Math.min(200, z + 25))}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setZoom(100)}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Generator status legend */}
      <div className="flex items-center gap-4 mb-3 text-xs font-mono">
        {Object.entries({ running: "Running", standby: "Standby", fault: "Fault", maintenance: "Maintenance" }).map(
          ([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${statusColor[key]}`} />
              <span className="text-muted-foreground">{label}</span>
            </div>
          )
        )}
      </div>

      {/* Floor plan with PDF embed */}
      <div className="flex-1 relative rounded border border-border overflow-auto scada-grid-bg">
        <div
          className="relative origin-top-left transition-transform duration-200"
          style={{ transform: `scale(${zoom / 100})`, width: `${10000 / zoom}%`, height: `${10000 / zoom}%` }}
        >
          <object
            data="/floor-plan.pdf"
            type="application/pdf"
            className="w-full h-full absolute inset-0"
            style={{ minHeight: 600 }}
          >
            <iframe
              src="/floor-plan.pdf"
              className="w-full h-full absolute inset-0 border-0"
              style={{ minHeight: 600 }}
              title="Kingswalk Floor Plan"
            />
          </object>

          {/* Generator overlay markers - positioned relative to floor plan */}
          {generators.map((gen, i) => {
            // Distribute markers across the plan area
            const positions = [
              { left: "22%", top: "35%" },
              { left: "38%", top: "35%" },
              { left: "54%", top: "35%" },
              { left: "70%", top: "35%" },
            ];
            const pos = positions[i] || { left: `${20 + i * 15}%`, top: "40%" };

            return (
              <div
                key={gen.id}
                className="absolute z-10 group cursor-pointer"
                style={{ left: pos.left, top: pos.top }}
              >
                {/* Pulse ring */}
                {gen.status === "running" && (
                  <div className="absolute -inset-2 rounded-full bg-scada-green/20 animate-pulse-glow" />
                )}
                {/* Marker */}
                <div
                  className={`relative w-6 h-6 rounded-full ${statusColor[gen.status]} ${statusGlow[gen.status]} flex items-center justify-center border-2 border-background`}
                >
                  <span className="text-[8px] font-mono font-bold text-background">
                    G{i + 1}
                  </span>
                </div>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block">
                  <div className="bg-card border border-border rounded px-2 py-1.5 shadow-lg whitespace-nowrap">
                    <p className="text-xs font-mono font-bold text-foreground">{gen.id}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">
                      {gen.output} MW / {gen.maxOutput} MW
                    </p>
                    <p className="text-[10px] font-mono text-muted-foreground">
                      {gen.temperature}°C • {gen.status.toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
