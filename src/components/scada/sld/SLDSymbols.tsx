/**
 * IEC/ANSI-style electrical symbols for the Single Line Diagram.
 * Each symbol is centered at (0,0) and sized to fit within a standard bounding box.
 */

interface SymbolProps {
  color: string;
  size?: number;
}

/** Generator — Circle with G */
export function GeneratorSymbol({ color, size = 48 }: SymbolProps) {
  const r = size / 2;
  return (
    <g>
      <circle cx={0} cy={0} r={r} fill="hsl(220, 18%, 10%)" stroke={color} strokeWidth="2.5" />
      <circle cx={0} cy={0} r={r - 4} fill="none" stroke={color} strokeWidth="1" opacity="0.3" />
      <text x={0} y={5} textAnchor="middle" fill={color} fontSize="18" fontFamily="IBM Plex Mono" fontWeight="bold">G</text>
    </g>
  );
}

/** Transformer — Two overlapping circles */
export function TransformerSymbol({ color, size = 48 }: SymbolProps) {
  const r = size / 2.8;
  return (
    <g>
      <circle cx={0} cy={-r * 0.45} r={r} fill="hsl(220, 18%, 10%)" stroke={color} strokeWidth="2.5" />
      <circle cx={0} cy={r * 0.45} r={r} fill="hsl(220, 18%, 10%)" stroke={color} strokeWidth="2.5" />
      <text x={0} y={-r * 0.45 + 4} textAnchor="middle" fill={color} fontSize="10" fontFamily="IBM Plex Mono" fontWeight="bold">P</text>
      <text x={0} y={r * 0.45 + 4} textAnchor="middle" fill={color} fontSize="10" fontFamily="IBM Plex Mono" fontWeight="bold">S</text>
    </g>
  );
}

/** Inverter — Rectangle with sine/DC wave */
export function InverterSymbol({ color, size = 48 }: SymbolProps) {
  const w = size * 0.9;
  const h = size * 0.65;
  return (
    <g>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={4} fill="hsl(220, 18%, 10%)" stroke={color} strokeWidth="2.5" />
      {/* DC side — straight line */}
      <line x1={-w / 4} y1={-3} x2={-w / 4 + 8} y2={-3} stroke={color} strokeWidth="1.5" />
      <line x1={-w / 4} y1={1} x2={-w / 4 + 8} y2={1} stroke={color} strokeWidth="1.5" opacity="0.5" strokeDasharray="2 2" />
      {/* AC side — sine wave */}
      <path d={`M ${w / 4 - 8} 0 Q ${w / 4 - 4} -8 ${w / 4} 0 Q ${w / 4 + 4} 8 ${w / 4 + 8} 0`} fill="none" stroke={color} strokeWidth="1.5" />
      <text x={0} y={h / 2 - 4} textAnchor="middle" fill={color} fontSize="8" fontFamily="IBM Plex Mono" fontWeight="bold" opacity="0.7">INV</text>
    </g>
  );
}

/** Switchgear — Rectangle with break symbol */
export function SwitchgearSymbol({ color, size = 48 }: SymbolProps) {
  const w = size * 0.85;
  const h = size * 0.65;
  return (
    <g>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={3} fill="hsl(220, 18%, 10%)" stroke={color} strokeWidth="2.5" />
      <text x={0} y={5} textAnchor="middle" fill={color} fontSize="12" fontFamily="IBM Plex Mono" fontWeight="bold">SWG</text>
    </g>
  );
}

/** Circuit Breaker — Small rectangle with X */
export function BreakerSymbol({ color, size = 48 }: SymbolProps) {
  const w = size * 0.55;
  const h = size * 0.45;
  return (
    <g>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={2} fill="hsl(220, 18%, 10%)" stroke={color} strokeWidth="2.5" />
      <line x1={-w / 4} y1={-h / 4} x2={w / 4} y2={h / 4} stroke={color} strokeWidth="1.5" />
      <line x1={w / 4} y1={-h / 4} x2={-w / 4} y2={h / 4} stroke={color} strokeWidth="1.5" />
    </g>
  );
}

/** Bus — Thick horizontal bar */
export function BusSymbol({ color, size = 48 }: SymbolProps) {
  const w = size * 1.4;
  const h = size * 0.25;
  return (
    <g>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={2} fill={color} opacity="0.9" />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={2} fill="none" stroke={color} strokeWidth="1" />
    </g>
  );
}

/** Panel — Rectangle with horizontal lines */
export function PanelSymbol({ color, size = 48 }: SymbolProps) {
  const w = size * 0.75;
  const h = size * 0.6;
  return (
    <g>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={3} fill="hsl(220, 18%, 10%)" stroke={color} strokeWidth="2.5" />
      {[-h / 5, 0, h / 5].map((ly, i) => (
        <line key={i} x1={-w / 3} y1={ly} x2={w / 3} y2={ly} stroke={color} strokeWidth="1" opacity="0.5" />
      ))}
    </g>
  );
}

/** Meter — Circle with M */
export function MeterSymbol({ color, size = 48 }: SymbolProps) {
  const r = size / 2.5;
  return (
    <g>
      <circle cx={0} cy={0} r={r} fill="hsl(220, 18%, 10%)" stroke={color} strokeWidth="2.5" />
      <text x={0} y={5} textAnchor="middle" fill={color} fontSize="14" fontFamily="IBM Plex Mono" fontWeight="bold">M</text>
    </g>
  );
}

/** VFD — Rectangle with wave */
export function VFDSymbol({ color, size = 48 }: SymbolProps) {
  const w = size * 0.85;
  const h = size * 0.65;
  return (
    <g>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={3} fill="hsl(220, 18%, 10%)" stroke={color} strokeWidth="2.5" />
      <path d={`M ${-w / 4} 0 L ${-w / 8} -8 L ${w / 8} 8 L ${w / 4} 0`} fill="none" stroke={color} strokeWidth="1.5" />
      <text x={0} y={h / 2 - 4} textAnchor="middle" fill={color} fontSize="8" fontFamily="IBM Plex Mono" fontWeight="bold" opacity="0.7">VFD</text>
    </g>
  );
}

/** Motor — Circle with M and rotation arrow */
export function MotorSymbol({ color, size = 48 }: SymbolProps) {
  const r = size / 2;
  return (
    <g>
      <circle cx={0} cy={0} r={r} fill="hsl(220, 18%, 10%)" stroke={color} strokeWidth="2.5" />
      <text x={0} y={5} textAnchor="middle" fill={color} fontSize="16" fontFamily="IBM Plex Mono" fontWeight="bold">M</text>
      <path d={`M ${r - 6} -4 L ${r - 2} 0 L ${r - 6} 4`} fill="none" stroke={color} strokeWidth="1.5" />
    </g>
  );
}

/** Fallback */
export function DefaultSymbol({ color, size = 48 }: SymbolProps) {
  const r = size / 2.5;
  return (
    <g>
      <rect x={-r} y={-r} width={r * 2} height={r * 2} rx={4} fill="hsl(220, 18%, 10%)" stroke={color} strokeWidth="2" />
      <text x={0} y={4} textAnchor="middle" fill={color} fontSize="10" fontFamily="IBM Plex Mono">?</text>
    </g>
  );
}

const symbolMap: Record<string, React.FC<SymbolProps>> = {
  generator: GeneratorSymbol,
  transformer: TransformerSymbol,
  inverter: InverterSymbol,
  switchgear: SwitchgearSymbol,
  breaker: BreakerSymbol,
  bus: BusSymbol,
  panel: PanelSymbol,
  meter: MeterSymbol,
  vfd: VFDSymbol,
  motor: MotorSymbol,
};

export function getSymbolComponent(type: string): React.FC<SymbolProps> {
  return symbolMap[type] || DefaultSymbol;
}

export const statusColors: Record<string, string> = {
  online: "#22c55e",
  offline: "#6b7280",
  standby: "#eab308",
  warning: "#f59e0b",
  fault: "#ef4444",
  maintenance: "#3b82f6",
};

export const statusGlowFilters = `
  <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation="4" result="blur" />
    <feFlood flood-color="#22c55e" flood-opacity="0.6" result="color" />
    <feComposite in="color" in2="blur" operator="in" result="glow" />
    <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
  </filter>
  <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation="4" result="blur" />
    <feFlood flood-color="#ef4444" flood-opacity="0.6" result="color" />
    <feComposite in="color" in2="blur" operator="in" result="glow" />
    <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
  </filter>
  <filter id="glow-amber" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation="4" result="blur" />
    <feFlood flood-color="#f59e0b" flood-opacity="0.6" result="color" />
    <feComposite in="color" in2="blur" operator="in" result="glow" />
    <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
  </filter>
`;

export function getStatusGlowFilter(status: string): string | undefined {
  if (status === "online") return "url(#glow-green)";
  if (status === "fault") return "url(#glow-red)";
  if (status === "warning" || status === "standby") return "url(#glow-amber)";
  return undefined;
}
