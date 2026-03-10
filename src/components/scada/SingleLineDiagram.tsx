import { useState, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useEquipment, useUpdateEquipment, useEquipmentConnections, useCreateConnection } from "@/hooks/useEquipment";
import { useConfigMode } from "@/hooks/useConfigMode";
import { useSimulatedSensors } from "@/hooks/useSimulatedSensors";
import { getSymbolComponent, statusColors, statusGlowFilters, getStatusGlowFilter } from "./sld/SLDSymbols";
import { autoLayout } from "./sld/SLDAutoLayout";
import { Button } from "@/components/ui/button";
import {
  ZoomIn, ZoomOut, Maximize2, Unlock, LayoutGrid, Cable, MousePointer,
} from "lucide-react";
import { toast } from "sonner";
import type { Equipment } from "@/hooks/useEquipment";

type Mode = "select" | "move" | "connect";

const CANVAS_W = 1400;
const CANVAS_H = 900;

export function SingleLineDiagram() {
  const navigate = useNavigate();
  const { configMode } = useConfigMode();
  const { data: equipment = [] } = useEquipment();
  const { data: connections = [] } = useEquipmentConnections();
  const updateEquipment = useUpdateEquipment();
  const createConnection = useCreateConnection();

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // View state
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: CANVAS_W, h: CANVAS_H });
  // Mode is always "select" when configMode is off
  const [internalMode, setInternalMode] = useState<Mode>("select");
  const mode = configMode ? internalMode : "select";

  // Drag state
  const [dragNode, setDragNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ dx: 0, dy: 0 });

  // Connection drawing
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [connectMouse, setConnectMouse] = useState<{ x: number; y: number } | null>(null);

  // Pan state
  const panRef = useRef<{ active: boolean; startX: number; startY: number; startVBX: number; startVBY: number }>({
    active: false, startX: 0, startY: 0, startVBX: 0, startVBY: 0,
  });

  // Selected node
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Build position map: use sld_x/sld_y from DB, fallback to auto-layout
  const positions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    const needsLayout: Equipment[] = [];

    equipment.forEach((e) => {
      if (e.sld_x != null && e.sld_y != null) {
        map.set(e.id, { x: Number(e.sld_x), y: Number(e.sld_y) });
      } else {
        needsLayout.push(e);
      }
    });

    if (needsLayout.length > 0) {
      const autoPositions = autoLayout(needsLayout, connections, CANVAS_W, CANVAS_H);
      autoPositions.forEach((pos, id) => map.set(id, pos));
    }

    return map;
  }, [equipment, connections]);

  // SVG coordinate helpers
  const svgPoint = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: svgPt.x, y: svgPt.y };
  }, []);

  // Zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = e.deltaY > 0 ? 1.1 : 0.9;
    const pt = svgPoint(e.clientX, e.clientY);

    setViewBox((vb) => {
      const newW = Math.max(300, Math.min(CANVAS_W * 3, vb.w * scaleFactor));
      const newH = Math.max(200, Math.min(CANVAS_H * 3, vb.h * scaleFactor));
      const newX = pt.x - (pt.x - vb.x) * (newW / vb.w);
      const newY = pt.y - (pt.y - vb.y) * (newH / vb.h);
      return { x: newX, y: newY, w: newW, h: newH };
    });
  }, [svgPoint]);

  // Zoom buttons
  const zoomIn = () => setViewBox((vb) => ({
    x: vb.x + vb.w * 0.1, y: vb.y + vb.h * 0.1,
    w: vb.w * 0.8, h: vb.h * 0.8,
  }));
  const zoomOut = () => setViewBox((vb) => ({
    x: vb.x - vb.w * 0.125, y: vb.y - vb.h * 0.125,
    w: vb.w * 1.25, h: vb.h * 1.25,
  }));
  const resetView = () => setViewBox({ x: 0, y: 0, w: CANVAS_W, h: CANVAS_H });

  // Pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    // If not clicking on a node, start panning
    if ((e.target as SVGElement).closest("[data-sld-node]")) return;
    if (mode === "connect" && connectFrom) {
      // Cancel connection
      setConnectFrom(null);
      setConnectMouse(null);
      return;
    }
    panRef.current = { active: true, startX: e.clientX, startY: e.clientY, startVBX: viewBox.x, startVBY: viewBox.y };
    setSelectedId(null);
  }, [viewBox, mode, connectFrom]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const pt = svgPoint(e.clientX, e.clientY);

    // Connection drawing
    if (mode === "connect" && connectFrom) {
      setConnectMouse(pt);
    }

    // Node dragging
    if (mode === "move" && dragNode) {
      const newX = Math.max(40, Math.min(CANVAS_W - 40, pt.x + dragOffset.dx));
      const newY = Math.max(40, Math.min(CANVAS_H - 40, pt.y + dragOffset.dy));
      // Update local position immediately for responsiveness
      positions.set(dragNode, { x: newX, y: newY });
      // Force re-render
      setDragOffset((d) => ({ ...d }));
      return;
    }

    // Panning
    if (panRef.current.active) {
      const svg = svgRef.current;
      if (!svg) return;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const dx = (e.clientX - panRef.current.startX) / ctm.a;
      const dy = (e.clientY - panRef.current.startY) / ctm.d;
      setViewBox((vb) => ({
        ...vb,
        x: panRef.current.startVBX - dx,
        y: panRef.current.startVBY - dy,
      }));
    }
  }, [mode, dragNode, connectFrom, dragOffset, positions, svgPoint]);

  const handleMouseUp = useCallback(() => {
    // Save drag position to DB
    if (mode === "move" && dragNode) {
      const pos = positions.get(dragNode);
      if (pos) {
        updateEquipment.mutate({
          id: dragNode,
          sld_x: Math.round(pos.x),
          sld_y: Math.round(pos.y),
        });
      }
      setDragNode(null);
    }
    panRef.current.active = false;
  }, [mode, dragNode, positions, updateEquipment]);

  // Node interaction
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, item: Equipment) => {
    e.stopPropagation();

    if (mode === "move") {
      const pt = svgPoint(e.clientX, e.clientY);
      const pos = positions.get(item.id) || { x: 0, y: 0 };
      setDragNode(item.id);
      setDragOffset({ dx: pos.x - pt.x, dy: pos.y - pt.y });
      return;
    }

    if (mode === "connect") {
      if (!connectFrom) {
        setConnectFrom(item.id);
        toast.info(`Click another equipment to connect from ${item.tag_number}`);
      } else if (connectFrom !== item.id) {
        // Check if connection already exists
        const exists = connections.some(
          (c) =>
            (c.from_equipment_id === connectFrom && c.to_equipment_id === item.id) ||
            (c.from_equipment_id === item.id && c.to_equipment_id === connectFrom)
        );
        if (exists) {
          toast.warning("Connection already exists");
        } else {
          createConnection.mutate(
            { from_equipment_id: connectFrom, to_equipment_id: item.id, connection_type: "electrical" },
            { onSuccess: () => toast.success("Connection created") }
          );
        }
        setConnectFrom(null);
        setConnectMouse(null);
      }
      return;
    }

    // Select mode — navigate to detail
    setSelectedId(item.id);
  }, [mode, connectFrom, connections, createConnection, positions, svgPoint]);

  const handleNodeDoubleClick = useCallback((item: Equipment) => {
    navigate(`/equipment/${item.id}`);
  }, [navigate]);

  // Auto-layout button
  const handleAutoLayout = useCallback(() => {
    const newPositions = autoLayout(equipment, connections, CANVAS_W, CANVAS_H);
    const updates: Promise<unknown>[] = [];
    newPositions.forEach((pos, id) => {
      updateEquipment.mutate({ id, sld_x: Math.round(pos.x), sld_y: Math.round(pos.y) });
    });
    toast.success("Auto-layout applied");
  }, [equipment, connections, updateEquipment]);

  // Empty state
  if (equipment.length === 0) {
    return (
      <div className="scada-panel p-4 h-full flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-sm font-mono font-semibold text-foreground">No equipment registered</p>
          <p className="text-xs font-mono text-muted-foreground">
            Add equipment in the Equipment Registry to see them here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="scada-panel p-3 h-full flex flex-col gap-2">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1">
          <h3 className="text-sm font-semibold uppercase tracking-wider mr-2">Single Line Diagram</h3>
          {configMode && (
            <>
              {([
                { id: "select" as Mode, icon: MousePointer, label: "Select" },
                { id: "move" as Mode, icon: Unlock, label: "Move" },
                { id: "connect" as Mode, icon: Cable, label: "Connect" },
              ]).map((btn) => {
                const Icon = btn.icon;
                return (
                  <Button
                    key={btn.id}
                    variant={mode === btn.id ? "default" : "ghost"}
                    size="sm"
                    className="h-7 gap-1.5 text-xs font-mono"
                    onClick={() => {
                      setInternalMode(btn.id);
                      setConnectFrom(null);
                      setConnectMouse(null);
                      setDragNode(null);
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {btn.label}
                  </Button>
                );
              })}
              <div className="w-px h-5 bg-border mx-1" />
              <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs font-mono" onClick={handleAutoLayout}>
                <LayoutGrid className="w-3.5 h-3.5" />
                Auto Layout
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomOut}>
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <span className="text-[10px] font-mono text-muted-foreground w-10 text-center">
            {Math.round((CANVAS_W / viewBox.w) * 100)}%
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomIn}>
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetView}>
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Mode indicator */}
      {mode !== "select" && (
        <div className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-mono border ${
          mode === "move"
            ? "bg-scada-amber/10 border-scada-amber/30 text-scada-amber"
            : "bg-primary/10 border-primary/30 text-primary"
        }`}>
          {mode === "move" ? (
            <>
              <Unlock className="w-3 h-3" />
              Drag equipment to reposition — positions save to Cloud
            </>
          ) : (
            <>
              <Cable className="w-3 h-3" />
              {connectFrom
                ? `Click target equipment to complete connection…`
                : `Click source equipment to start a connection`}
            </>
          )}
        </div>
      )}

      {/* SVG Canvas */}
      <div
        ref={containerRef}
        className="flex-1 rounded border border-border overflow-hidden scada-grid-bg"
        style={{ cursor: mode === "move" ? "grab" : mode === "connect" ? "crosshair" : "default" }}
      >
        <svg
          ref={svgRef}
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          className="w-full h-full"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <defs dangerouslySetInnerHTML={{ __html: statusGlowFilters + `
            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(215, 15%, 45%)" />
            </marker>
          `}} />

          {/* Connection lines */}
          {connections.map((conn) => {
            const from = positions.get(conn.from_equipment_id);
            const to = positions.get(conn.to_equipment_id);
            if (!from || !to) return null;

            const isHighlighted = selectedId === conn.from_equipment_id || selectedId === conn.to_equipment_id;

            return (
              <g key={conn.id}>
                {/* Shadow line for glow */}
                <line
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={isHighlighted ? "#22c55e" : "hsl(215, 15%, 25%)"}
                  strokeWidth={isHighlighted ? 4 : 2}
                  opacity={isHighlighted ? 0.3 : 0.1}
                />
                {/* Main line */}
                <line
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={isHighlighted ? "#22c55e" : "hsl(215, 15%, 40%)"}
                  strokeWidth={isHighlighted ? 2 : 1.5}
                  markerEnd="url(#arrow)"
                />
                {/* Animated power flow dots */}
                <circle r="3" fill="#22c55e" opacity="0.8">
                  <animateMotion
                    dur="2s"
                    repeatCount="indefinite"
                    path={`M ${from.x} ${from.y} L ${to.x} ${to.y}`}
                  />
                </circle>
                <circle r="3" fill="#22c55e" opacity="0.5">
                  <animateMotion
                    dur="2s"
                    repeatCount="indefinite"
                    begin="1s"
                    path={`M ${from.x} ${from.y} L ${to.x} ${to.y}`}
                  />
                </circle>
                {/* Connection label */}
                {conn.label && (
                  <text
                    x={(from.x + to.x) / 2}
                    y={(from.y + to.y) / 2 - 8}
                    textAnchor="middle"
                    fill="hsl(215, 15%, 55%)"
                    fontSize="9"
                    fontFamily="IBM Plex Mono"
                  >
                    {conn.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Connection being drawn */}
          {connectFrom && connectMouse && (() => {
            const fromPos = positions.get(connectFrom);
            if (!fromPos) return null;
            return (
              <line
                x1={fromPos.x} y1={fromPos.y}
                x2={connectMouse.x} y2={connectMouse.y}
                stroke="#22c55e"
                strokeWidth="2"
                strokeDasharray="6 4"
                opacity="0.7"
              />
            );
          })()}

          {/* Equipment nodes */}
          {equipment.map((item) => {
            const pos = positions.get(item.id);
            if (!pos) return null;

            const color = statusColors[item.status] || "#6b7280";
            const Symbol = getSymbolComponent(item.type);
            const isSelected = selectedId === item.id;
            const isConnectSource = connectFrom === item.id;
            const glowFilter = getStatusGlowFilter(item.status);

            return (
              <g
                key={item.id}
                data-sld-node
                transform={`translate(${pos.x}, ${pos.y})`}
                className={mode === "move" ? "cursor-grab" : mode === "connect" ? "cursor-crosshair" : "cursor-pointer"}
                onMouseDown={(e) => handleNodeMouseDown(e, item)}
                onDoubleClick={() => handleNodeDoubleClick(item)}
              >
                {/* Selection ring */}
                {(isSelected || isConnectSource) && (
                  <circle cx={0} cy={0} r={36} fill="none" stroke={isConnectSource ? "#22c55e" : "hsl(var(--primary))"} strokeWidth="2" strokeDasharray="4 3">
                    <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="8s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Glow effect for active equipment */}
                {glowFilter && (
                  <circle cx={0} cy={0} r={28} fill={color} opacity="0.15" filter={glowFilter} />
                )}

                {/* Equipment symbol */}
                <Symbol color={color} size={48} />

                {/* Status dot */}
                <circle cx={26} cy={-20} r={5} fill={color} stroke="hsl(220, 18%, 10%)" strokeWidth="2">
                  {item.status === "online" && (
                    <animate attributeName="r" values="5;6;5" dur="2s" repeatCount="indefinite" />
                  )}
                </circle>

                {/* Tag label */}
                <text x={0} y={42} textAnchor="middle" fill="hsl(210, 20%, 85%)" fontSize="11" fontFamily="IBM Plex Mono" fontWeight="bold">
                  {item.tag_number}
                </text>

                {/* Rating / live data */}
                {item.rating && (
                  <text x={0} y={55} textAnchor="middle" fill="hsl(215, 15%, 55%)" fontSize="9" fontFamily="IBM Plex Mono">
                    {item.rating} {item.rating_unit ?? ""}
                  </text>
                )}

                {/* Status text */}
                <text x={0} y={item.rating ? 67 : 55} textAnchor="middle" fill={color} fontSize="8" fontFamily="IBM Plex Mono" fontWeight="bold">
                  {item.status.toUpperCase()}
                </text>

                {/* Invisible hit area for easier clicking */}
                <rect x={-35} y={-35} width={70} height={105} fill="transparent" />
              </g>
            );
          })}

          {/* Minimap background reference */}
          <rect x={0} y={0} width={CANVAS_W} height={CANVAS_H} fill="none" stroke="hsl(215, 15%, 20%)" strokeWidth="1" strokeDasharray="8 4" />
        </svg>
      </div>

      {/* Status legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono">
        {Object.entries(statusColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-muted-foreground capitalize">{status}</span>
          </div>
        ))}
        <span className="text-muted-foreground/50 ml-2">Double-click to open details</span>
      </div>
    </div>
  );
}
