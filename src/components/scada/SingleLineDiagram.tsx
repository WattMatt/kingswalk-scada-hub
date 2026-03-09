import { useNavigate } from "react-router-dom";
import type { Equipment, EquipmentConnection } from "@/hooks/useEquipment";
import { Zap, CircleDot, ToggleRight, Cable, Cpu, SunMedium, PanelTop, Gauge, Activity, Cog } from "lucide-react";

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
};

const statusColor: Record<string, string> = {
  online: "#22c55e",
  offline: "#6b7280",
  standby: "#f59e0b",
  warning: "#f59e0b",
  fault: "#ef4444",
  maintenance: "#3b82f6",
};

interface SingleLineDiagramProps {
  equipment: Equipment[];
  connections: EquipmentConnection[];
}

export function SingleLineDiagram({ equipment, connections }: SingleLineDiagramProps) {
  const navigate = useNavigate();

  // Group equipment by type for layout
  const generators = equipment.filter((e) => e.type === "generator");
  const transformers = equipment.filter((e) => e.type === "transformer");
  const inverters = equipment.filter((e) => e.type === "inverter");
  const breakers = equipment.filter((e) => e.type === "breaker");
  const switchgear = equipment.filter((e) => e.type === "switchgear");
  const buses = equipment.filter((e) => e.type === "bus");
  const others = equipment.filter((e) => !["generator", "transformer", "inverter", "breaker", "switchgear", "bus"].includes(e.type));

  // Layout: bus bar at top, equipment below grouped by type
  const allItems = [...generators, ...transformers, ...inverters, ...breakers, ...switchgear, ...others];
  const itemCount = Math.max(allItems.length, 1);
  const spacing = Math.min(170, 750 / itemCount);
  const svgWidth = Math.max(800, itemCount * spacing + 100);

  const handleClick = (item: Equipment) => {
    navigate(`/equipment/${item.id}`);
  };

  // If no equipment registered, show placeholder
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
    <div className="scada-panel p-4 h-full flex flex-col">
      <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Single Line Diagram</h3>
      <div className="flex-1 scada-grid-bg rounded p-2 overflow-auto">
        <svg viewBox={`0 0 ${svgWidth} 380`} className="w-full h-auto" style={{ minHeight: 300 }}>
          {/* Main Bus Bar */}
          <line x1="40" y1="60" x2={svgWidth - 40} y2="60" stroke="hsl(43, 96%, 56%)" strokeWidth="4" />
          <text x={svgWidth / 2} y="45" textAnchor="middle" fill="hsl(215, 15%, 55%)" fontSize="11" fontFamily="IBM Plex Mono">
            {buses.length > 0 ? buses[0].tag_number : "MAIN BUS"}
          </text>

          {/* Bus bar clickable area */}
          {buses[0] && (
            <rect
              x="40" y="50" width={svgWidth - 80} height="20"
              fill="transparent" cursor="pointer"
              onClick={() => handleClick(buses[0])}
            />
          )}

          {/* Render each item */}
          {allItems.map((item, i) => {
            const x = 80 + i * spacing;
            const color = statusColor[item.status] || "#6b7280";
            const isGen = item.type === "generator";
            const isInverter = item.type === "inverter";
            const isTransformer = item.type === "transformer";
            const isBreaker = item.type === "breaker";

            return (
              <g key={item.id} className="cursor-pointer" onClick={() => handleClick(item)}>
                {/* Connection line to bus */}
                <line x1={x} y1="60" x2={x} y2="120" stroke={color} strokeWidth="2" />

                {/* Circuit breaker symbol */}
                <rect x={x - 8} y="80" width="16" height="16" rx="2"
                  fill={item.status === "online" || item.status === "standby" ? color : "hsl(220, 14%, 20%)"}
                  stroke={color} strokeWidth="1.5" />
                <text x={x} y="91" textAnchor="middle" fill="hsl(220, 20%, 10%)" fontSize="7" fontFamily="IBM Plex Mono" fontWeight="bold">
                  CB
                </text>

                {/* Equipment symbol */}
                {isTransformer ? (
                  <>
                    <circle cx={x} cy="140" r="16" fill="none" stroke={color} strokeWidth="1.5" />
                    <circle cx={x} cy="155" r="16" fill="none" stroke={color} strokeWidth="1.5" />
                    <line x1={x} y1="171" x2={x} y2="210" stroke={color} strokeWidth="2" />
                  </>
                ) : isInverter ? (
                  <>
                    <rect x={x - 18} y="125" width="36" height="28" rx="3" fill="hsl(220, 18%, 13%)" stroke={color} strokeWidth="1.5" />
                    <text x={x} y="143" textAnchor="middle" fill={color} fontSize="10" fontFamily="IBM Plex Mono" fontWeight="bold">INV</text>
                    <line x1={x} y1="153" x2={x} y2="210" stroke={color} strokeWidth="2" />
                  </>
                ) : isBreaker ? (
                  <>
                    <rect x={x - 12} y="125" width="24" height="20" rx="2" fill="hsl(220, 18%, 13%)" stroke={color} strokeWidth="1.5" />
                    <line x1={x - 6} y1="135" x2={x + 6} y2="135" stroke={color} strokeWidth="2" />
                    <line x1={x} y1="145" x2={x} y2="210" stroke={color} strokeWidth="2" />
                  </>
                ) : (
                  <>
                    <line x1={x} y1="120" x2={x} y2="210" stroke={color} strokeWidth="2" />
                  </>
                )}

                {/* Main symbol circle/shape */}
                {isGen ? (
                  <circle cx={x} cy="235" r="28" fill="hsl(220, 18%, 13%)" stroke={color} strokeWidth="2" />
                ) : (
                  <rect x={x - 24} y="212" width="48" height="36" rx="4" fill="hsl(220, 18%, 13%)" stroke={color} strokeWidth="1.5" />
                )}

                {/* Label inside symbol */}
                <text x={x} y={isGen ? 232 : 226} textAnchor="middle" fill={color} fontSize="9" fontFamily="IBM Plex Mono" fontWeight="bold">
                  {item.tag_number.length > 8 ? item.tag_number.slice(0, 8) : item.tag_number}
                </text>
                {item.rating && (
                  <text x={x} y={isGen ? 246 : 240} textAnchor="middle" fill="hsl(215, 15%, 55%)" fontSize="8" fontFamily="IBM Plex Mono">
                    {item.rating}{item.rating_unit ?? ""}
                  </text>
                )}

                {/* Status indicator */}
                <circle cx={x + (isGen ? 22 : 20)} cy={isGen ? 215 : 214} r="4" fill={color}>
                  {item.status === "online" && (
                    <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
                  )}
                </circle>

                {/* Bottom label */}
                <text x={x} y="280" textAnchor="middle" fill="hsl(210, 20%, 80%)" fontSize="9" fontFamily="IBM Plex Mono">
                  {item.name.length > 14 ? item.name.slice(0, 14) + "…" : item.name}
                </text>
                <text x={x} y="294" textAnchor="middle" fill="hsl(215, 15%, 55%)" fontSize="8" fontFamily="IBM Plex Mono">
                  {item.status.toUpperCase()}
                </text>
                <text x={x} y="306" textAnchor="middle" fill="hsl(215, 15%, 45%)" fontSize="7" fontFamily="IBM Plex Mono" className="capitalize">
                  {item.type}
                </text>

                {/* Hover highlight */}
                <rect
                  x={x - 30} y="70" width="60" height="250" rx="4"
                  fill="transparent" stroke="transparent"
                  className="hover:stroke-primary/30"
                  strokeWidth="2"
                />
              </g>
            );
          })}

          {/* Connection lines between linked equipment */}
          {connections.map((conn) => {
            const fromIdx = allItems.findIndex((e) => e.id === conn.from_equipment_id);
            const toIdx = allItems.findIndex((e) => e.id === conn.to_equipment_id);
            if (fromIdx === -1 || toIdx === -1) return null;
            const fromX = 80 + fromIdx * spacing;
            const toX = 80 + toIdx * spacing;
            const midY = 340;
            return (
              <g key={conn.id}>
                <path
                  d={`M ${fromX} 270 L ${fromX} ${midY} L ${toX} ${midY} L ${toX} 270`}
                  fill="none"
                  stroke="hsl(215, 15%, 35%)"
                  strokeWidth="1"
                  strokeDasharray="4 2"
                />
                {conn.label && (
                  <text x={(fromX + toX) / 2} y={midY - 4} textAnchor="middle" fill="hsl(215, 15%, 45%)" fontSize="7" fontFamily="IBM Plex Mono">
                    {conn.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Grid connection */}
          <line x1={svgWidth - 40} y1="60" x2={svgWidth - 40} y2="30" stroke="hsl(43, 96%, 56%)" strokeWidth="3" />
          <line x1={svgWidth - 70} y1="30" x2={svgWidth - 10} y2="30" stroke="hsl(43, 96%, 56%)" strokeWidth="3" />
          <text x={svgWidth - 40} y="20" textAnchor="middle" fill="hsl(210, 20%, 80%)" fontSize="10" fontFamily="IBM Plex Mono">
            GRID
          </text>

          {/* Load feeder */}
          <line x1="40" y1="60" x2="40" y2="120" stroke="hsl(185, 70%, 50%)" strokeWidth="2" />
          <rect x="20" y="120" width="40" height="30" rx="3" fill="none" stroke="hsl(185, 70%, 50%)" strokeWidth="1.5" />
          <text x="40" y="140" textAnchor="middle" fill="hsl(185, 70%, 50%)" fontSize="9" fontFamily="IBM Plex Mono">
            LOAD
          </text>
        </svg>
      </div>
    </div>
  );
}
