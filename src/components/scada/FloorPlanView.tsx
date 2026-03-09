import { useState, useRef, useEffect, useCallback } from "react";
import { ZoomIn, ZoomOut, Maximize2, Lock, Unlock, X, Zap, CircleDot, ToggleRight, Cable, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GeneratorData, EquipmentData } from "@/hooks/useScadaData";
import { useMarkerStore, type MarkerConfig } from "@/hooks/useMarkerStore";

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

const typeColor: Record<string, string> = {
  generator: "bg-scada-green",
  transformer: "bg-scada-amber",
  switchgear: "bg-cyan-500",
  breaker: "bg-orange-500",
  bus: "bg-violet-500",
  custom: "bg-purple-500",
};

const typeIcon: Record<string, typeof Zap> = {
  generator: Zap,
  transformer: CircleDot,
  switchgear: Cpu,
  breaker: ToggleRight,
  bus: Cable,
  custom: CircleDot,
};

const equipStatusColor: Record<string, string> = {
  online: "text-scada-green",
  offline: "text-muted-foreground",
  warning: "text-scada-amber",
  fault: "text-destructive",
};

const equipStatusDot: Record<string, string> = {
  online: "bg-scada-green",
  offline: "bg-muted-foreground",
  warning: "bg-scada-amber",
  fault: "bg-destructive",
};

// Shape per type for visual differentiation
function MarkerShape({ marker, color, glow, editMode, children }: {
  marker: MarkerConfig;
  color: string;
  glow: string;
  editMode: boolean;
  children: React.ReactNode;
}) {
  const editRing = editMode ? "ring-2 ring-scada-amber/50 ring-offset-1 ring-offset-background" : "";

  if (marker.type === "transformer") {
    return (
      <div className={`relative w-8 h-8 rounded-md ${color} ${glow} flex items-center justify-center border-2 border-background ${editRing}`}>
        {children}
      </div>
    );
  }
  if (marker.type === "breaker") {
    return (
      <div className={`relative w-7 h-5 rounded-sm ${color} ${glow} flex items-center justify-center border-2 border-background ${editRing}`}>
        {children}
      </div>
    );
  }
  if (marker.type === "switchgear") {
    return (
      <div className={`relative w-9 h-7 rounded ${color} ${glow} flex items-center justify-center border-2 border-background ${editRing}`}>
        {children}
      </div>
    );
  }
  if (marker.type === "bus") {
    return (
      <div className={`relative w-10 h-5 rounded-sm ${color} ${glow} flex items-center justify-center border-2 border-background ${editRing}`}>
        {children}
      </div>
    );
  }
  // generator / custom – circle
  return (
    <div className={`relative w-7 h-7 rounded-full ${color} ${glow} flex items-center justify-center border-2 border-background ${editRing}`}>
      {children}
    </div>
  );
}

interface FloorPlanViewProps {
  generators: GeneratorData[];
  equipment: EquipmentData[];
}

export function FloorPlanView({ generators, equipment }: FloorPlanViewProps) {
  const [zoom, setZoom] = useState(100);
  const [editMode, setEditMode] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<MarkerConfig | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { markers, updateMarkerPosition } = useMarkerStore();

  const dragRef = useRef<{
    markerId: string;
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function renderPdf() {
      try {
        setLoading(true);
        setError(null);
        const pdfJS = await import("pdfjs-dist");
        pdfJS.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfJS.version}/build/pdf.worker.min.mjs`;
        const pdf = await pdfJS.getDocument("/floor-plan.pdf").promise;
        const page = await pdf.getPage(1);
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container || cancelled) return;
        const containerWidth = container.clientWidth;
        const unscaledViewport = page.getViewport({ scale: 1 });
        const baseScale = containerWidth / unscaledViewport.width;
        const scale = baseScale * (zoom / 100);
        const viewport = page.getViewport({ scale });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        await page.render({ canvasContext: ctx, viewport }).promise;
        if (!cancelled) {
          setCanvasSize({ width: viewport.width, height: viewport.height });
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("PDF render error:", err);
          setError("Failed to load floor plan");
          setLoading(false);
        }
      }
    }
    renderPdf();
    return () => { cancelled = true; };
  }, [zoom]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, marker: MarkerConfig) => {
      if (!editMode) return;
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
    [editMode]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current || !overlayRef.current) return;
      const overlay = overlayRef.current;
      const rect = overlay.getBoundingClientRect();
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const newLeft = Math.max(0, Math.min(100, dragRef.current.startLeft + (dx / rect.width) * 100));
      const newTop = Math.max(0, Math.min(100, dragRef.current.startTop + (dy / rect.height) * 100));
      updateMarkerPosition(dragRef.current.markerId, Math.round(newLeft * 10) / 10, Math.round(newTop * 10) / 10);
    },
    [updateMarkerPosition]
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleMarkerClick = useCallback(
    (marker: MarkerConfig) => {
      if (editMode) return;
      setSelectedMarker((prev) => (prev?.id === marker.id ? null : marker));
    },
    [editMode]
  );

  const getLinkedGenerator = (marker: MarkerConfig): GeneratorData | undefined => {
    if (marker.linkedGenerator) return generators.find((g) => g.id === marker.linkedGenerator);
    return undefined;
  };

  const getLinkedEquipment = (marker: MarkerConfig): EquipmentData | undefined => {
    if (marker.linkedEquipment) return equipment.find((e) => e.id === marker.linkedEquipment);
    return undefined;
  };

  const selectedGen = selectedMarker ? getLinkedGenerator(selectedMarker) : undefined;
  const selectedEquip = selectedMarker ? getLinkedEquipment(selectedMarker) : undefined;

  return (
    <div className="scada-panel p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider">Floor Plan Layout</h3>
        <div className="flex items-center gap-1">
          <Button
            variant={editMode ? "default" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => { setEditMode(!editMode); setSelectedMarker(null); }}
            title={editMode ? "Lock markers" : "Unlock markers for dragging"}
          >
            {editMode ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
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

      {editMode && (
        <div className="flex items-center gap-2 mb-3 px-2 py-1.5 rounded bg-scada-amber/10 border border-scada-amber/30">
          <Unlock className="w-3 h-3 text-scada-amber" />
          <span className="text-xs font-mono text-scada-amber">Edit mode — drag markers to reposition</span>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-xs font-mono">
        {Object.entries(typeColor).map(([key, color]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
            <span className="text-muted-foreground capitalize">{key}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 flex gap-0 overflow-hidden">
        {/* Floor plan */}
        <div ref={containerRef} className={`flex-1 relative rounded-l border border-border overflow-auto scada-grid-bg ${selectedMarker ? "" : "rounded-r"}`}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-mono text-muted-foreground animate-pulse">Loading floor plan...</span>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-mono text-destructive">{error}</span>
            </div>
          )}
          <div
            ref={overlayRef}
            className="relative inline-block"
            style={{ width: canvasSize.width || "100%", height: canvasSize.height || "auto" }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <canvas ref={canvasRef} className="block" />

            {!loading &&
              markers.map((marker) => {
                const gen = getLinkedGenerator(marker);
                const equip = getLinkedEquipment(marker);
                const isSelected = selectedMarker?.id === marker.id;

                let color: string;
                let glow = "";
                if (gen) {
                  color = statusColor[gen.status];
                  glow = statusGlow[gen.status] || "";
                } else {
                  color = typeColor[marker.type] || typeColor.custom;
                  if (equip?.status === "fault") {
                    color = "bg-destructive";
                    glow = statusGlow.fault;
                  } else if (equip?.status === "warning") {
                    color = "bg-scada-amber";
                    glow = statusGlow.standby;
                  }
                }

                const Icon = typeIcon[marker.type] || CircleDot;

                return (
                  <div
                    key={marker.id}
                    className={`absolute z-10 group ${editMode ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"} ${isSelected ? "z-20" : ""}`}
                    style={{
                      left: `${marker.left}%`,
                      top: `${marker.top}%`,
                      transform: "translate(-50%, -50%)",
                      touchAction: "none",
                    }}
                    onPointerDown={(e) => handlePointerDown(e, marker)}
                    onClick={() => handleMarkerClick(marker)}
                  >
                    {gen?.status === "running" && (
                      <div className="absolute -inset-2 rounded-full bg-scada-green/20 animate-pulse-glow" />
                    )}

                    {isSelected && !editMode && (
                      <div className="absolute -inset-1.5 rounded-lg border-2 border-primary animate-pulse" />
                    )}

                    <MarkerShape marker={marker} color={color} glow={glow} editMode={editMode}>
                      {marker.type === "generator" ? (
                        <span className="text-[9px] font-mono font-bold text-background">{marker.label}</span>
                      ) : (
                        <Icon className="w-3.5 h-3.5 text-background" />
                      )}
                    </MarkerShape>

                    {/* Label below marker */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0.5 pointer-events-none">
                      <span className="text-[8px] font-mono font-bold text-foreground/70 whitespace-nowrap">{marker.label}</span>
                    </div>

                    {/* Hover tooltip (non-edit, non-selected) */}
                    {!editMode && !isSelected && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block pointer-events-none">
                        <div className="bg-card border border-border rounded px-2 py-1.5 shadow-lg whitespace-nowrap">
                          <p className="text-xs font-mono font-bold text-foreground">
                            {gen?.id || equip?.id || marker.label}
                          </p>
                          <p className="text-[10px] font-mono text-muted-foreground capitalize">
                            {marker.type} • Click for details
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Edit mode coords */}
                    {editMode && (
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

        {/* Detail panel (slides in on selection) */}
        {selectedMarker && !editMode && (
          <div className="w-72 shrink-0 border border-l-0 border-border rounded-r bg-card overflow-y-auto">
            <EquipmentDetailPanel
              marker={selectedMarker}
              generator={selectedGen}
              equipment={selectedEquip}
              onClose={() => setSelectedMarker(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Detail panel ────────────────────────────────── */

function EquipmentDetailPanel({
  marker,
  generator,
  equipment,
  onClose,
}: {
  marker: MarkerConfig;
  generator?: GeneratorData;
  equipment?: EquipmentData;
  onClose: () => void;
}) {
  const Icon = typeIcon[marker.type] || CircleDot;

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded flex items-center justify-center ${typeColor[marker.type]}`}>
            <Icon className="w-3.5 h-3.5 text-background" />
          </div>
          <div>
            <h4 className="text-sm font-mono font-bold text-foreground">
              {generator?.id || equipment?.id || marker.label}
            </h4>
            <p className="text-[10px] font-mono text-muted-foreground capitalize">{marker.type}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Status badge */}
      {(generator || equipment) && (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            generator
              ? (generator.status === "running" ? "bg-scada-green" : generator.status === "fault" ? "bg-destructive" : "bg-scada-amber")
              : equipStatusDot[equipment!.status]
          }`} />
          <span className="text-xs font-mono font-semibold uppercase tracking-wider">
            {generator?.status || equipment?.status}
          </span>
        </div>
      )}

      <div className="w-full h-px bg-border" />

      {/* Generator details */}
      {generator && (
        <div className="space-y-2">
          <MetricRow label="Output" value={`${generator.output}`} unit="MW" />
          <MetricRow label="Max Output" value={`${generator.maxOutput}`} unit="MW" />
          <div className="w-full bg-muted rounded-full h-1.5">
            <div
              className="bg-scada-green h-1.5 rounded-full transition-all"
              style={{ width: `${(generator.output / generator.maxOutput) * 100}%` }}
            />
          </div>
          <MetricRow label="RPM" value={`${generator.rpm}`} unit="" />
          <MetricRow label="Temperature" value={`${generator.temperature}`} unit="°C" />
          <MetricRow label="Voltage" value={`${generator.voltage}`} unit="kV" />
        </div>
      )}

      {/* Equipment details */}
      {equipment && (
        <div className="space-y-2">
          <p className="text-xs font-mono font-semibold text-foreground">{equipment.name}</p>
          {Object.entries(equipment.metrics).map(([key, { value, unit }]) => (
            <MetricRow key={key} label={key} value={value} unit={unit} />
          ))}
        </div>
      )}

      {/* No linked data */}
      {!generator && !equipment && (
        <p className="text-xs font-mono text-muted-foreground">
          No live data linked. Configure in Settings.
        </p>
      )}

      <div className="w-full h-px bg-border" />
      <div className="text-[10px] font-mono text-muted-foreground">
        Position: {marker.left.toFixed(1)}% x {marker.top.toFixed(1)}%
      </div>
    </div>
  );
}

function MetricRow({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-mono text-muted-foreground">{label}</span>
      <span className="text-[11px] font-mono font-semibold text-foreground">
        {value} <span className="text-muted-foreground font-normal">{unit}</span>
      </span>
    </div>
  );
}
