import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ZoomIn, ZoomOut, Maximize2, Unlock, Zap, CircleDot, ToggleRight, Cable, Cpu, SunMedium, PanelTop, Gauge, Activity, Cog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMarkerStore, type MarkerConfig } from "@/hooks/useMarkerStore";
import { useConfigMode } from "@/hooks/useConfigMode";

const typeColor: Record<string, string> = {
  generator: "bg-scada-green",
  transformer: "bg-scada-amber",
  inverter: "bg-yellow-500",
  switchgear: "bg-cyan-500",
  breaker: "bg-orange-500",
  bus: "bg-violet-500",
  panel: "bg-blue-500",
  meter: "bg-teal-500",
  vfd: "bg-pink-500",
  motor: "bg-indigo-500",
  custom: "bg-purple-500",
};

const typeIcon: Record<string, typeof Zap> = {
  generator: Zap,
  transformer: CircleDot,
  inverter: SunMedium,
  switchgear: Cpu,
  breaker: ToggleRight,
  bus: Cable,
  panel: PanelTop,
  meter: Gauge,
  vfd: Activity,
  motor: Cog,
  custom: CircleDot,
};

const statusColor: Record<string, string> = {
  online: "bg-scada-green",
  standby: "bg-scada-amber",
  offline: "bg-muted-foreground",
  warning: "bg-scada-amber",
  fault: "bg-destructive",
  maintenance: "bg-blue-500",
};

const statusGlow: Record<string, string> = {
  online: "shadow-[0_0_8px_hsl(142,71%,45%)]",
  fault: "shadow-[0_0_8px_hsl(0,72%,51%)]",
  warning: "shadow-[0_0_8px_hsl(43,96%,56%)]",
};

function MarkerShape({ marker, color, glow, editMode, children }: {
  marker: MarkerConfig;
  color: string;
  glow: string;
  editMode: boolean;
  children: React.ReactNode;
}) {
  const editRing = editMode ? "ring-2 ring-scada-amber/50 ring-offset-1 ring-offset-background" : "";

  if (marker.type === "transformer") {
    return <div className={`relative w-8 h-8 rounded-md ${color} ${glow} flex items-center justify-center border-2 border-background ${editRing}`}>{children}</div>;
  }
  if (marker.type === "breaker") {
    return <div className={`relative w-7 h-5 rounded-sm ${color} ${glow} flex items-center justify-center border-2 border-background ${editRing}`}>{children}</div>;
  }
  if (marker.type === "switchgear" || marker.type === "panel") {
    return <div className={`relative w-9 h-7 rounded ${color} ${glow} flex items-center justify-center border-2 border-background ${editRing}`}>{children}</div>;
  }
  if (marker.type === "bus") {
    return <div className={`relative w-10 h-5 rounded-sm ${color} ${glow} flex items-center justify-center border-2 border-background ${editRing}`}>{children}</div>;
  }
  return <div className={`relative w-7 h-7 rounded-full ${color} ${glow} flex items-center justify-center border-2 border-background ${editRing}`}>{children}</div>;
}

export function FloorPlanView() {
  const navigate = useNavigate();
  const { configMode } = useConfigMode();
  const [zoom, setZoom] = useState(100);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const { markers, updateMarkerPosition } = useMarkerStore();

  const dragRef = useRef<{
    markerId: string;
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
  } | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, marker: MarkerConfig) => {
      if (!configMode) return;
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = {
        markerId: marker.id,
        startX: e.clientX,
        startY: e.clientY,
        startLeft: marker.left,
        startTop: marker.top,
      };
    },
    [configMode]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current || !overlayRef.current) return;
      // Debounce: only update on pointer up for DB writes
    },
    []
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current || !overlayRef.current) return;
    const overlay = overlayRef.current;
    const rect = overlay.getBoundingClientRect();
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const newLeft = Math.max(0, Math.min(100, dragRef.current.startLeft + (dx / rect.width) * 100));
    const newTop = Math.max(0, Math.min(100, dragRef.current.startTop + (dy / rect.height) * 100));
    updateMarkerPosition(dragRef.current.markerId, Math.round(newLeft * 10) / 10, Math.round(newTop * 10) / 10);
    dragRef.current = null;
  }, [updateMarkerPosition]);

  const handleMarkerClick = useCallback(
    (marker: MarkerConfig) => {
      if (configMode) return;
      navigate(`/equipment/${marker.equipmentId}`);
    },
    [configMode, navigate]
  );

  return (
    <div className="scada-panel p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider">Floor Plan Layout</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.max(50, z - 25))}>
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <span className="text-xs font-mono text-muted-foreground w-10 text-center">{zoom}%</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.min(200, z + 25))}>
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(100)}>
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {configMode && (
        <div className="flex items-center gap-2 mb-3 px-2 py-1.5 rounded bg-scada-amber/10 border border-scada-amber/30">
          <Unlock className="w-3 h-3 text-scada-amber" />
          <span className="text-xs font-mono text-scada-amber">Configuration mode — drag markers to reposition</span>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-xs font-mono">
        {Object.entries(typeColor).filter(([k]) => k !== "custom").map(([key, color]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
            <span className="text-muted-foreground capitalize">{key}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 flex gap-0 overflow-hidden relative">
        <div ref={containerRef} className="flex-1 relative rounded border border-border overflow-auto scada-grid-bg">
          <div
            ref={overlayRef}
            className="relative inline-block"
            style={{ width: `${zoom}%`, height: "auto", transition: "width 0.2s ease-out" }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <img 
              src="/floor-plan.png" 
              alt="Floor Plan" 
              className="block w-full h-auto pointer-events-none"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML += '<div class="flex items-center justify-center h-64 border-2 border-dashed border-border rounded-md m-4"><p class="text-muted-foreground font-mono">Missing /floor-plan.png in public folder</p></div>';
              }}
            />

            {markers.map((marker) => {
              const color = typeColor[marker.type] || typeColor.custom;
              const glow = statusGlow.online || "";
              const Icon = typeIcon[marker.type] || CircleDot;

              return (
                <div
                  key={marker.id}
                  className={`absolute z-10 group ${configMode ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}`}
                  style={{
                    left: `${marker.left}%`,
                    top: `${marker.top}%`,
                    transform: "translate(-50%, -50%)",
                    touchAction: "none",
                  }}
                  onPointerDown={(e) => handlePointerDown(e, marker)}
                  onClick={() => handleMarkerClick(marker)}
                >
                  <MarkerShape marker={marker} color={color} glow={glow} editMode={configMode}>
                    <Icon className="w-3.5 h-3.5 text-background" />
                  </MarkerShape>

                  {/* Label */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0.5 pointer-events-none">
                    <span className="text-[8px] font-mono font-bold text-foreground/70 whitespace-nowrap">{marker.label}</span>
                  </div>

                  {/* Hover tooltip */}
                  {!configMode && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block pointer-events-none">
                      <div className="bg-card border border-border rounded px-2 py-1.5 shadow-lg whitespace-nowrap z-50">
                        <p className="text-xs font-mono font-bold text-foreground">{marker.label}</p>
                        <p className="text-[10px] font-mono text-muted-foreground capitalize">{marker.type} • Click to open</p>
                      </div>
                    </div>
                  )}

                  {/* Edit mode coords */}
                  {configMode && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 pointer-events-none">
                      <div className="bg-card border border-border rounded px-1.5 py-0.5 shadow-lg whitespace-nowrap">
                        <p className="text-[9px] font-mono text-muted-foreground">
                          {marker.left.toFixed(1)}%, {marker.top.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
