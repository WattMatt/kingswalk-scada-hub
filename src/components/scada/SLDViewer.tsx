import { useState, useRef, useEffect, useCallback } from "react";
import { ZoomIn, ZoomOut, Maximize2, Upload, Trash2, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const SLD_STORAGE_KEY = "scada-sld-pdfs";

interface StoredSLD {
  id: string;
  name: string;
  dataUrl: string;
  uploadedAt: string;
}

function loadSLDs(): StoredSLD[] {
  try {
    const raw = localStorage.getItem(SLD_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveSLDs(slds: StoredSLD[]) {
  localStorage.setItem(SLD_STORAGE_KEY, JSON.stringify(slds));
}

export function SLDViewer() {
  const [slds, setSlds] = useState<StoredSLD[]>(loadSLDs);
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeSLD = slds[activeIndex] ?? null;

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const newSLD: StoredSLD = {
        id: `sld-${Date.now()}`,
        name: file.name.replace(/\.pdf$/i, ""),
        dataUrl,
        uploadedAt: new Date().toISOString(),
      };
      const updated = [...slds, newSLD];
      setSlds(updated);
      saveSLDs(updated);
      setActiveIndex(updated.length - 1);
      setCurrentPage(1);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [slds]);

  const handleDelete = useCallback(() => {
    if (!activeSLD) return;
    const updated = slds.filter((s) => s.id !== activeSLD.id);
    setSlds(updated);
    saveSLDs(updated);
    setActiveIndex(Math.max(0, activeIndex - 1));
    setCurrentPage(1);
  }, [activeSLD, slds, activeIndex]);

  // Render PDF page
  useEffect(() => {
    if (!activeSLD) {
      setCanvasSize({ width: 0, height: 0 });
      return;
    }
    let cancelled = false;

    async function renderPage() {
      try {
        setLoading(true);
        setError(null);
        const pdfJS = await import("pdfjs-dist");
        pdfJS.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfJS.version}/build/pdf.worker.min.mjs`;

        const pdf = await pdfJS.getDocument(activeSLD!.dataUrl).promise;
        if (cancelled) return;
        setTotalPages(pdf.numPages);

        const page = await pdf.getPage(currentPage);
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
          console.error("SLD PDF render error:", err);
          setError("Failed to render diagram");
          setLoading(false);
        }
      }
    }

    renderPage();
    return () => { cancelled = true; };
  }, [activeSLD, zoom, currentPage]);

  return (
    <div className="scada-panel p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider">Single Line Diagrams</h3>
        <div className="flex items-center gap-1">
          {activeSLD && (
            <>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={handleDelete} title="Delete current diagram">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
              <div className="w-px h-4 bg-border mx-1" />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.max(50, z - 25))}>
                <ZoomOut className="w-3.5 h-3.5" />
              </Button>
              <span className="text-xs font-mono text-muted-foreground w-10 text-center">{zoom}%</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.min(300, z + 25))}>
                <ZoomIn className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(100)}>
                <Maximize2 className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
          <div className="w-px h-4 bg-border mx-1" />
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-3 h-3" />
            Upload PDF
          </Button>
          <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleUpload} />
        </div>
      </div>

      {/* Tabs for multiple diagrams */}
      {slds.length > 1 && (
        <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1">
          {slds.map((sld, i) => (
            <button
              key={sld.id}
              onClick={() => { setActiveIndex(i); setCurrentPage(1); }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono whitespace-nowrap transition-colors ${
                i === activeIndex
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <FileText className="w-3 h-3" />
              {sld.name.length > 30 ? sld.name.slice(0, 30) + "…" : sld.name}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {!activeSLD ? (
        <div className="flex-1 flex items-center justify-center border border-dashed border-border rounded scada-grid-bg">
          <div className="text-center space-y-3">
            <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto" />
            <div>
              <p className="text-sm font-mono font-semibold text-foreground">No diagrams uploaded</p>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                Upload a single line diagram PDF to view it here
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-3.5 h-3.5" />
              Upload PDF
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Page navigation */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mb-2">
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <span className="text-xs font-mono text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}

          <div ref={containerRef} className="flex-1 relative rounded border border-border overflow-auto scada-grid-bg">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <span className="text-sm font-mono text-muted-foreground animate-pulse">Rendering diagram...</span>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-mono text-destructive">{error}</span>
              </div>
            )}
            <div className="relative inline-block" style={{ width: canvasSize.width || "100%", height: canvasSize.height || "auto" }}>
              <canvas ref={canvasRef} className="block" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
