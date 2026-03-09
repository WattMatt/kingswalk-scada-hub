import { useState, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GeneratorData } from "@/hooks/useScadaData";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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

// Generator positions as percentage of PDF dimensions
// These should be adjusted to match actual equipment locations on the floor plan
const generatorPositions = [
  { left: "20%", top: "40%" },
  { left: "35%", top: "40%" },
  { left: "50%", top: "40%" },
  { left: "65%", top: "40%" },
];

interface FloorPlanViewProps {
  generators: GeneratorData[];
}

export function FloorPlanView({ generators }: FloorPlanViewProps) {
  const [zoom, setZoom] = useState(100);
  const [pdfWidth, setPdfWidth] = useState<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const onDocumentLoadSuccess = useCallback(() => {
    if (containerRef.current) {
      setPdfWidth(containerRef.current.clientWidth);
    }
  }, []);

  const scaledWidth = pdfWidth ? (pdfWidth * zoom) / 100 : undefined;

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
        <div className="relative inline-block">
          <Document file="/floor-plan.pdf" onLoadSuccess={onDocumentLoadSuccess}>
            <Page
              pageNumber={1}
              width={scaledWidth}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>

          {/* Generator overlay markers */}
          {generators.map((gen, i) => {
            const pos = generatorPositions[i] || { left: `${20 + i * 15}%`, top: "40%" };
            return (
              <div
                key={gen.id}
                className="absolute z-10 group cursor-pointer"
                style={{ left: pos.left, top: pos.top, transform: "translate(-50%, -50%)" }}
              >
                {gen.status === "running" && (
                  <div className="absolute -inset-2 rounded-full bg-scada-green/20 animate-pulse-glow" />
                )}
                <div
                  className={`relative w-7 h-7 rounded-full ${statusColor[gen.status]} ${statusGlow[gen.status]} flex items-center justify-center border-2 border-background`}
                >
                  <span className="text-[9px] font-mono font-bold text-background">G{i + 1}</span>
                </div>
                {/* Hover tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block pointer-events-none">
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
