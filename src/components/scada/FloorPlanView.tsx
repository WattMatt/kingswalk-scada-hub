import { useState, useRef, useEffect, useCallback } from "react";
import { ZoomIn, ZoomOut, Maximize2, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GeneratorData } from "@/hooks/useScadaData";
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
  switchgear: "bg-blue-500",
  custom: "bg-purple-500",
};

interface FloorPlanViewProps {
  generators: GeneratorData[];
}

export function FloorPlanView({ generators }: FloorPlanViewProps) {
  const [zoom, setZoom] = useState(100);
  const [editMode, setEditMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { markers, updateMarkerPosition } = useMarkerStore();

  // Drag state
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

  const getLinkedGenerator = (marker: MarkerConfig): GeneratorData | undefined => {
    if (marker.linkedGenerator) {
      return generators.find((g) => g.id === marker.linkedGenerator);
    }
    return undefined;
  };

  return (
    <div className="scada-panel p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider">Floor Plan Layout</h3>
        <div className="flex items-center gap-1">
          <Button
            variant={editMode ? "default" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => setEditMode(!editMode)}
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

      {/* Floor plan */}
      <div ref={containerRef} className="flex-1 relative rounded border border-border overflow-auto scada-grid-bg">
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

          {/* Marker overlays */}
          {!loading &&
            markers.map((marker) => {
              const gen = getLinkedGenerator(marker);
              const status = gen?.status || "maintenance";
              const color = gen ? statusColor[status] : typeColor[marker.type];
              const glow = gen ? statusGlow[status] || "" : "";

              return (
                <div
                  key={marker.id}
                  className={`absolute z-10 group ${editMode ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}`}
                  style={{
                    left: `${marker.left}%`,
                    top: `${marker.top}%`,
                    transform: "translate(-50%, -50%)",
                    touchAction: "none",
                  }}
                  onPointerDown={(e) => handlePointerDown(e, marker)}
                >
                  {gen?.status === "running" && (
                    <div className="absolute -inset-2 rounded-full bg-scada-green/20 animate-pulse-glow" />
                  )}
                  <div
                    className={`relative w-7 h-7 rounded-full ${color} ${glow} flex items-center justify-center border-2 border-background ${editMode ? "ring-2 ring-scada-amber/50 ring-offset-1 ring-offset-background" : ""}`}
                  >
                    <span className="text-[9px] font-mono font-bold text-background">{marker.label}</span>
                  </div>

                  {/* Tooltip */}
                  {!editMode && gen && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block pointer-events-none">
                      <div className="bg-card border border-border rounded px-2 py-1.5 shadow-lg whitespace-nowrap">
                        <p className="text-xs font-mono font-bold text-foreground">{gen.id}</p>
                        <p className="text-[10px] font-mono text-muted-foreground">
                          {gen.output} MW / {gen.maxOutput} MW
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground">
                          {gen.temperature}°C • {status.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Edit mode coordinate tooltip */}
                  {editMode && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 pointer-events-none">
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
  );
}
