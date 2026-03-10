import { useState, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useEquipment, useUpdateEquipment, useEquipmentConnections, useCreateConnection } from "@/hooks/useEquipment";
import { useConfigMode } from "@/hooks/useConfigMode";
import { useSimulatedSensors } from "@/hooks/useSimulatedSensors";
import { useAlarmThresholds, buildThresholdMap, checkAlarmBreach } from "@/hooks/useAlarmThresholds";
import { getSymbolComponent, statusColors, statusGlowFilters, getStatusGlowFilter } from "./sld/SLDSymbols";
import { autoLayout } from "./sld/SLDAutoLayout";
import { SLD_GROUPS, getHiddenIds, getAnchorId, getGroupCounts, getEquipmentGroup } from "./sld/SLDGroups";
import { Button } from "@/components/ui/button";
import {
  ZoomIn, ZoomOut, Maximize2, Unlock, LayoutGrid, Cable, MousePointer,
  ChevronDown, ChevronRight, Layers,
} from "lucide-react";
import { toast } from "sonner";
import type { Equipment } from "@/hooks/useEquipment";

type Mode = "select" | "move" | "connect";

const CANVAS_W = 1600;
const CANVAS_H = 1200;

export function SingleLineDiagram() {
  const navigate = useNavigate();
  const { configMode } = useConfigMode();
  const { data: equipment = [] } = useEquipment();
  const { data: connections = [] } = useEquipmentConnections();
  const updateEquipment = useUpdateEquipment();
  const createConnection = useCreateConnection();

  // Simulated live sensor readings
  const sensorInput = useMemo(() =>
    equipment.map((e) => ({ id: e.id, type: e.type, status: e.status, rating: e.rating })),
    [equipment]
  );
  const { readings: sensorReadings, kwHistory } = useSimulatedSensors(sensorInput);

  // Alarm thresholds
  const { data: thresholds = [] } = useAlarmThresholds();
  const thresholdMap = useMemo(() => buildThresholdMap(thresholds), [thresholds]);

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

  // Collapsible groups
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = useCallback((groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  const collapseAll = useCallback(() => {
    setCollapsedGroups(new Set(SLD_GROUPS.map((g) => g.id)));
  }, []);

  const expandAll = useCallback(() => {
    setCollapsedGroups(new Set());
  }, []);

  const hiddenIds = useMemo(
    () => getHiddenIds(equipment, collapsedGroups),
    [equipment, collapsedGroups]
  );

  const groupCounts = useMemo(
    () => getGroupCounts(equipment),
    [equipment]
  );

  // Tags that should render as spanning horizontal busbars
  const BUSBAR_TAGS = new Set(["BUS-LV", "BUS-SB"]);

  // Anchor ID lookup for collapsed groups
  const anchorIdMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const g of SLD_GROUPS) {
      const id = getAnchorId(equipment, g);
      if (id) map.set(g.id, id);
    }
    return map;
  }, [equipment]);

  // Visible equipment (filtered by collapse state)
  const visibleEquipment = useMemo(
    () => equipment.filter((e) => !hiddenIds.has(e.id)),
    [equipment, hiddenIds]
  );

  // Visible connections — hide if both endpoints hidden, redirect if one hidden
  const visibleConnections = useMemo(() => {
    if (hiddenIds.size === 0) return connections;
    return connections.filter((c) => {
      // Hide connection if BOTH endpoints are hidden
      if (hiddenIds.has(c.from_equipment_id) && hiddenIds.has(c.to_equipment_id)) return false;
      return true;
    }).map((c) => {
      // If one endpoint is hidden, redirect to the group's anchor
      let from = c.from_equipment_id;
      let to = c.to_equipment_id;

      if (hiddenIds.has(from)) {
        const item = equipment.find((e) => e.id === from);
        if (item) {
          const gId = getEquipmentGroup(item, SLD_GROUPS);
          if (gId) from = anchorIdMap.get(gId) || from;
        }
      }
      if (hiddenIds.has(to)) {
        const item = equipment.find((e) => e.id === to);
        if (item) {
          const gId = getEquipmentGroup(item, SLD_GROUPS);
          if (gId) to = anchorIdMap.get(gId) || to;
        }
      }

      return { ...c, from_equipment_id: from, to_equipment_id: to };
    });
  }, [connections, hiddenIds, equipment, anchorIdMap]);

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

  // Compute busbar extents — each busbar spans from leftmost to rightmost connected equipment
  const busbarExtents = useMemo(() => {
    const extents = new Map<string, { left: number; right: number }>();
    const busEquip = equipment.filter((e) => e.type === "bus" && BUSBAR_TAGS.has(e.tag_number));

    for (const bus of busEquip) {
      const busPos = positions.get(bus.id);
      if (!busPos) continue;

      // Find all visible equipment connected to this bus
      const connectedIds = new Set<string>();
      for (const c of visibleConnections) {
        if (c.from_equipment_id === bus.id) connectedIds.add(c.to_equipment_id);
        if (c.to_equipment_id === bus.id) connectedIds.add(c.from_equipment_id);
      }

      let minX = busPos.x;
      let maxX = busPos.x;
      const BAR_PADDING = 60;

      connectedIds.forEach((id) => {
        const p = positions.get(id);
        if (p) {
          minX = Math.min(minX, p.x);
          maxX = Math.max(maxX, p.x);
        }
      });

      // Add padding, ensure minimum width
      const left = minX - BAR_PADDING;
      const right = maxX + BAR_PADDING;
      const minWidth = 200;
      if (right - left < minWidth) {
        const center = (left + right) / 2;
        extents.set(bus.id, { left: center - minWidth / 2, right: center + minWidth / 2 });
      } else {
        extents.set(bus.id, { left, right });
      }
    }

    return extents;
  }, [equipment, positions, visibleConnections]);

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
          {/* Group collapse controls */}
          <div className="flex items-center gap-0.5 mr-1">
            <Layers className="w-3.5 h-3.5 text-muted-foreground" />
            {SLD_GROUPS.map((g) => {
              const isCollapsed = collapsedGroups.has(g.id);
              const count = groupCounts.get(g.id) || 0;
              if (count === 0) return null;
              return (
                <Button
                  key={g.id}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 text-[10px] font-mono gap-1"
                  style={{ color: g.color, opacity: isCollapsed ? 0.5 : 1 }}
                  onClick={() => toggleGroup(g.id)}
                  title={`${isCollapsed ? "Expand" : "Collapse"} ${g.label} (${count} nodes)`}
                >
                  {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {g.label.replace("Section ", "S").replace("Bank ", "B")}
                </Button>
              );
            })}
            {collapsedGroups.size > 0 ? (
              <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px] font-mono text-muted-foreground" onClick={expandAll}>
                All
              </Button>
            ) : (
              <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px] font-mono text-muted-foreground" onClick={collapseAll}>
                Hide
              </Button>
            )}
          </div>
          <div className="w-px h-5 bg-border" />
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
          {visibleConnections.map((conn) => {
            const fromRaw = positions.get(conn.from_equipment_id);
            const toRaw = positions.get(conn.to_equipment_id);
            if (!fromRaw || !toRaw) return null;

            // Snap connection endpoints to busbar surface
            const fromExtent = busbarExtents.get(conn.from_equipment_id);
            const toExtent = busbarExtents.get(conn.to_equipment_id);
            const BAR_H = 14;

            const from = fromExtent
              ? { x: Math.max(fromExtent.left, Math.min(fromExtent.right, toRaw.x)), y: fromRaw.y + (toRaw.y > fromRaw.y ? BAR_H / 2 : -BAR_H / 2) }
              : { ...fromRaw };
            const to = toExtent
              ? { x: Math.max(toExtent.left, Math.min(toExtent.right, fromRaw.x)), y: toRaw.y + (fromRaw.y > toRaw.y ? BAR_H / 2 : -BAR_H / 2) }
              : { ...toRaw };

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
          {visibleEquipment.map((item) => {
            const pos = positions.get(item.id);
            if (!pos) return null;

            const color = statusColors[item.status] || "#6b7280";
            const Symbol = getSymbolComponent(item.type);
            const isSelected = selectedId === item.id;
            const isConnectSource = connectFrom === item.id;
            const glowFilter = getStatusGlowFilter(item.status);
            const barExtent = busbarExtents.get(item.id);

            // === Spanning busbar rendering ===
            if (barExtent && item.type === "bus") {
              const barW = barExtent.right - barExtent.left;
              const barH = 14;
              const barLeft = barExtent.left - pos.x;

              return (
                <g
                  key={item.id}
                  data-sld-node
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className={mode === "move" ? "cursor-grab" : mode === "connect" ? "cursor-crosshair" : "cursor-pointer"}
                  onMouseDown={(e) => handleNodeMouseDown(e, item)}
                  onDoubleClick={() => handleNodeDoubleClick(item)}
                >
                  {/* Selection highlight */}
                  {(isSelected || isConnectSource) && (
                    <rect
                      x={barLeft - 4} y={-barH / 2 - 4} width={barW + 8} height={barH + 8} rx={4}
                      fill="none" stroke={isConnectSource ? "#22c55e" : "hsl(var(--primary))"} strokeWidth="2" strokeDasharray="4 3"
                    >
                      <animate attributeName="stroke-dashoffset" from="0" to="14" dur="2s" repeatCount="indefinite" />
                    </rect>
                  )}

                  {/* Glow */}
                  {glowFilter && (
                    <rect x={barLeft - 6} y={-barH / 2 - 6} width={barW + 12} height={barH + 12} rx={4}
                      fill={color} opacity="0.12" filter={glowFilter} />
                  )}

                  {/* Busbar body — thick copper-style bar */}
                  <rect
                    x={barLeft} y={-barH / 2} width={barW} height={barH} rx={3}
                    fill={color} fillOpacity="0.85"
                  />
                  <rect
                    x={barLeft} y={-barH / 2} width={barW} height={barH} rx={3}
                    fill="none" stroke={color} strokeWidth="1.5"
                  />
                  {/* Inner highlight stripe */}
                  <rect
                    x={barLeft + 2} y={-barH / 2 + 2} width={barW - 4} height={3} rx={1}
                    fill="white" fillOpacity="0.15"
                  />

                  {/* Connection tick marks on the bar */}
                  {(() => {
                    const connectedXs: number[] = [];
                    for (const c of visibleConnections) {
                      const otherId = c.from_equipment_id === item.id ? c.to_equipment_id : c.to_equipment_id === item.id ? c.from_equipment_id : null;
                      if (otherId) {
                        const otherPos = positions.get(otherId);
                        if (otherPos) connectedXs.push(Math.max(barExtent.left, Math.min(barExtent.right, otherPos.x)) - pos.x);
                      }
                    }
                    return connectedXs.map((tx, i) => (
                      <line key={i} x1={tx} y1={-barH / 2 - 3} x2={tx} y2={barH / 2 + 3}
                        stroke={color} strokeWidth="2" opacity="0.6" />
                    ));
                  })()}

                  {/* Tag label — centered on bar */}
                  <text x={0} y={barH / 2 + 16} textAnchor="middle" fill="hsl(210, 20%, 85%)" fontSize="11" fontFamily="IBM Plex Mono" fontWeight="bold">
                    {item.tag_number}
                  </text>

                  {/* Status text */}
                  <text x={0} y={barH / 2 + 28} textAnchor="middle" fill={color} fontSize="8" fontFamily="IBM Plex Mono" fontWeight="bold">
                    {item.status.toUpperCase()}
                  </text>

                  {/* Status dot */}
                  <circle cx={barExtent.right - pos.x + 12} cy={0} r={5} fill={color} stroke="hsl(220, 18%, 10%)" strokeWidth="2">
                    {item.status === "online" && (
                      <animate attributeName="r" values="5;6;5" dur="2s" repeatCount="indefinite" />
                    )}
                  </circle>

                  {/* Invisible hit area */}
                  <rect x={barLeft - 10} y={-25} width={barW + 20} height={70} fill="transparent" />
                </g>
              );
            }

            // === Standard point-node rendering ===
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

                {/* Live sensor data panel + sparkline */}
                {(() => {
                  const reading = sensorReadings.get(item.id);
                  if (!reading) return null;
                  const isZero = reading.kw === 0 && reading.voltage === 0;
                  const history = kwHistory.get(item.id) || [];

                  // Build sparkline path
                  const sparkW = 78;
                  const sparkH = 18;
                  const sparkX = -39;
                  const sparkY = 90;
                  let sparkPath = "";
                  if (history.length > 1) {
                    const min = Math.min(...history);
                    const max = Math.max(...history);
                    const range = max - min || 1;
                    sparkPath = history
                      .map((v, i) => {
                        const x = sparkX + (i / (history.length - 1)) * sparkW;
                        const y = sparkY + sparkH - ((v - min) / range) * sparkH;
                        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
                      })
                      .join(" ");
                  }

                  return (
                    <g>
                      {/* Background panel — taller to fit sparkline */}
                      <rect x={-42} y={50} width={84} height={64} rx={4}
                        fill="hsl(220, 18%, 10%)" fillOpacity="0.85"
                        stroke="hsl(215, 15%, 25%)" strokeWidth="0.5" />
                      {/* kW */}
                      <text x={-36} y={63} fill={isZero ? "hsl(215, 15%, 40%)" : "#22c55e"} fontSize="9" fontFamily="IBM Plex Mono" fontWeight="bold">
                        {reading.kw.toFixed(1)}
                      </text>
                      <text x={8} y={63} fill="hsl(215, 15%, 50%)" fontSize="7" fontFamily="IBM Plex Mono">kW</text>
                      {/* Voltage */}
                      <text x={-36} y={74} fill={isZero ? "hsl(215, 15%, 40%)" : "hsl(43, 96%, 56%)"} fontSize="8" fontFamily="IBM Plex Mono">
                        {reading.voltage.toFixed(0)}V
                      </text>
                      {/* Current */}
                      <text x={4} y={74} fill={isZero ? "hsl(215, 15%, 40%)" : "hsl(199, 89%, 48%)"} fontSize="8" fontFamily="IBM Plex Mono">
                        {reading.current.toFixed(1)}A
                      </text>
                      {/* PF + Hz */}
                      <text x={-36} y={85} fill="hsl(215, 15%, 50%)" fontSize="7" fontFamily="IBM Plex Mono">
                        PF {reading.powerFactor.toFixed(2)}
                      </text>
                      <text x={10} y={85} fill="hsl(215, 15%, 50%)" fontSize="7" fontFamily="IBM Plex Mono">
                        {reading.frequency.toFixed(1)}Hz
                      </text>

                      {/* Sparkline */}
                      {sparkPath && (
                        <g>
                          {/* Filled area under the line */}
                          <path
                            d={`${sparkPath} L ${(sparkX + sparkW).toFixed(1)} ${(sparkY + sparkH).toFixed(1)} L ${sparkX.toFixed(1)} ${(sparkY + sparkH).toFixed(1)} Z`}
                            fill="#22c55e"
                            fillOpacity="0.1"
                          />
                          {/* The sparkline */}
                          <path
                            d={sparkPath}
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {/* Current value dot */}
                          {history.length > 1 && (() => {
                            const min = Math.min(...history);
                            const max = Math.max(...history);
                            const range = max - min || 1;
                            const lastVal = history[history.length - 1];
                            const cx = sparkX + sparkW;
                            const cy = sparkY + sparkH - ((lastVal - min) / range) * sparkH;
                            return (
                              <circle cx={cx} cy={cy} r="2" fill="#22c55e">
                                <animate attributeName="r" values="2;3;2" dur="1.5s" repeatCount="indefinite" />
                              </circle>
                            );
                          })()}
                        </g>
                      )}
                    </g>
                  );
                })()}

                {/* Status text */}
                <text x={0} y={124} textAnchor="middle" fill={color} fontSize="8" fontFamily="IBM Plex Mono" fontWeight="bold">
                  {item.status.toUpperCase()}
                </text>

                {/* Collapsed group badge — show on anchor nodes */}
                {(() => {
                  const group = SLD_GROUPS.find((g) => g.anchorTag === item.tag_number);
                  if (!group || !collapsedGroups.has(group.id)) return null;
                  const count = groupCounts.get(group.id) || 0;
                  return (
                    <g
                      className="cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); toggleGroup(group.id); }}
                    >
                      <rect x={-40} y={130} width={80} height={20} rx={4}
                        fill={group.color} fillOpacity="0.15"
                        stroke={group.color} strokeWidth="1" strokeOpacity="0.4" />
                      <text x={0} y={143} textAnchor="middle" fill={group.color} fontSize="8" fontFamily="IBM Plex Mono" fontWeight="bold">
                        {group.label} ({count})
                      </text>
                      <text x={0} y={155} textAnchor="middle" fill="hsl(215, 15%, 50%)" fontSize="7" fontFamily="IBM Plex Mono">
                        click to expand
                      </text>
                    </g>
                  );
                })()}

                {/* Invisible hit area for easier clicking */}
                <rect x={-45} y={-35} width={90} height={168} fill="transparent" />
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
