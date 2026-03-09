import { cn } from "@/lib/utils";
import type { GeneratorData } from "@/hooks/useScadaData";

interface SingleLineDiagramProps {
  generators: GeneratorData[];
}

const statusColor = {
  running: "#22c55e",
  standby: "#f59e0b",
  fault: "#ef4444",
  maintenance: "#3b82f6",
};

export function SingleLineDiagram({ generators }: SingleLineDiagramProps) {
  return (
    <div className="scada-panel p-4 h-full">
      <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Single Line Diagram</h3>
      <div className="scada-grid-bg rounded p-2 overflow-auto">
        <svg viewBox="0 0 800 320" className="w-full h-auto" style={{ minHeight: 250 }}>
          {/* Main Bus Bar */}
          <line x1="50" y1="60" x2="750" y2="60" stroke="hsl(43, 96%, 56%)" strokeWidth="4" />
          <text x="400" y="45" textAnchor="middle" fill="hsl(215, 15%, 55%)" fontSize="11" fontFamily="IBM Plex Mono">
            132kV MAIN BUS
          </text>

          {/* Generators */}
          {generators.map((gen, i) => {
            const x = 130 + i * 170;
            const color = statusColor[gen.status];
            return (
              <g key={gen.id}>
                {/* Connection line */}
                <line x1={x} y1="60" x2={x} y2="120" stroke={color} strokeWidth="2" />
                
                {/* Circuit Breaker */}
                <rect x={x - 8} y="80" width="16" height="16" rx="2" fill={gen.status === "running" ? color : "hsl(220, 14%, 20%)"} stroke={color} strokeWidth="1.5" />
                <text x={x} y="91" textAnchor="middle" fill="hsl(220, 20%, 10%)" fontSize="8" fontFamily="IBM Plex Mono" fontWeight="bold">
                  CB
                </text>

                {/* Transformer symbol */}
                <circle cx={x} cy="140" r="16" fill="none" stroke={color} strokeWidth="1.5" />
                <circle cx={x} cy="155" r="16" fill="none" stroke={color} strokeWidth="1.5" />

                {/* Line to generator */}
                <line x1={x} y1="171" x2={x} y2="220" stroke={color} strokeWidth="2" />

                {/* Generator circle */}
                <circle cx={x} cy="240" r="28" fill="hsl(220, 18%, 13%)" stroke={color} strokeWidth="2" />
                <text x={x} y="236" textAnchor="middle" fill={color} fontSize="10" fontFamily="IBM Plex Mono" fontWeight="bold">
                  G{i + 1}
                </text>
                <text x={x} y="250" textAnchor="middle" fill="hsl(215, 15%, 55%)" fontSize="9" fontFamily="IBM Plex Mono">
                  {gen.output}MW
                </text>

                {/* Status indicator */}
                <circle cx={x + 22} cy="222" r="4" fill={color}>
                  {gen.status === "running" && (
                    <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
                  )}
                </circle>

                {/* Label */}
                <text x={x} y="285" textAnchor="middle" fill="hsl(210, 20%, 80%)" fontSize="10" fontFamily="IBM Plex Mono">
                  {gen.id}
                </text>
                <text x={x} y="298" textAnchor="middle" fill="hsl(215, 15%, 55%)" fontSize="8" fontFamily="IBM Plex Mono" textTransform="uppercase">
                  {gen.status.toUpperCase()}
                </text>
              </g>
            );
          })}

          {/* Grid connection (right side) */}
          <line x1="750" y1="60" x2="750" y2="30" stroke="hsl(43, 96%, 56%)" strokeWidth="3" />
          <line x1="720" y1="30" x2="780" y2="30" stroke="hsl(43, 96%, 56%)" strokeWidth="3" />
          <text x="750" y="20" textAnchor="middle" fill="hsl(210, 20%, 80%)" fontSize="10" fontFamily="IBM Plex Mono">
            GRID
          </text>

          {/* Load feeder (left side) */}
          <line x1="50" y1="60" x2="50" y2="120" stroke="hsl(185, 70%, 50%)" strokeWidth="2" />
          <rect x="30" y="120" width="40" height="30" rx="3" fill="none" stroke="hsl(185, 70%, 50%)" strokeWidth="1.5" />
          <text x="50" y="140" textAnchor="middle" fill="hsl(185, 70%, 50%)" fontSize="9" fontFamily="IBM Plex Mono">
            LOAD
          </text>
        </svg>
      </div>
    </div>
  );
}
