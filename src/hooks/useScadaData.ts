import { useState, useEffect, useCallback } from "react";

// Simulated SCADA data generator
export interface PowerMetrics {
  totalGeneration: number;
  totalLoad: number;
  frequency: number;
  voltage: number;
  powerFactor: number;
  efficiency: number;
}

export interface GeneratorData {
  id: string;
  name: string;
  status: "running" | "standby" | "fault" | "maintenance";
  output: number;
  maxOutput: number;
  rpm: number;
  temperature: number;
  voltage: number;
}

export interface EquipmentData {
  id: string;
  name: string;
  type: "transformer" | "switchgear" | "breaker" | "bus";
  status: "online" | "offline" | "warning" | "fault";
  metrics: Record<string, { value: string; unit: string }>;
}

export interface AlarmData {
  id: string;
  timestamp: Date;
  severity: "critical" | "warning" | "info";
  source: string;
  message: string;
  acknowledged: boolean;
}

export interface TrendPoint {
  time: string;
  generation: number;
  load: number;
  frequency: number;
}

const generators: GeneratorData[] = [
  { id: "GEN-01", name: "Generator 1", status: "running", output: 45, maxOutput: 60, rpm: 3000, temperature: 72, voltage: 11 },
  { id: "GEN-02", name: "Generator 2", status: "running", output: 38, maxOutput: 60, rpm: 3000, temperature: 68, voltage: 11 },
  { id: "GEN-03", name: "Generator 3", status: "standby", output: 0, maxOutput: 60, rpm: 0, temperature: 25, voltage: 0 },
  { id: "GEN-04", name: "Generator 4", status: "running", output: 52, maxOutput: 60, rpm: 3000, temperature: 76, voltage: 11 },
];

const equipmentList: EquipmentData[] = [
  {
    id: "XFMR-1", name: "Transformer 1", type: "transformer", status: "online",
    metrics: {
      "Primary V": { value: "132", unit: "kV" },
      "Secondary V": { value: "11", unit: "kV" },
      "Load": { value: "82", unit: "%" },
      "Oil Temp": { value: "65", unit: "°C" },
      "Tap Position": { value: "7", unit: "" },
      "Rating": { value: "90", unit: "MVA" },
    },
  },
  {
    id: "XFMR-2", name: "Transformer 2", type: "transformer", status: "online",
    metrics: {
      "Primary V": { value: "132", unit: "kV" },
      "Secondary V": { value: "11", unit: "kV" },
      "Load": { value: "58", unit: "%" },
      "Oil Temp": { value: "52", unit: "°C" },
      "Tap Position": { value: "6", unit: "" },
      "Rating": { value: "90", unit: "MVA" },
    },
  },
  {
    id: "SWG-1", name: "Main Switchgear", type: "switchgear", status: "online",
    metrics: {
      "Voltage": { value: "11", unit: "kV" },
      "Sections": { value: "4", unit: "" },
      "Active Feeders": { value: "12", unit: "" },
      "Bus Coupler": { value: "Closed", unit: "" },
      "Arc Flash": { value: "24.5", unit: "cal/cm²" },
    },
  },
  {
    id: "CB-01", name: "Circuit Breaker 1", type: "breaker", status: "online",
    metrics: {
      "State": { value: "Closed", unit: "" },
      "Current": { value: "2450", unit: "A" },
      "Rating": { value: "3150", unit: "A" },
      "Trip Count": { value: "14", unit: "" },
      "Last Maintenance": { value: "2025-12-01", unit: "" },
    },
  },
  {
    id: "CB-02", name: "Circuit Breaker 2", type: "breaker", status: "online",
    metrics: {
      "State": { value: "Closed", unit: "" },
      "Current": { value: "1820", unit: "A" },
      "Rating": { value: "3150", unit: "A" },
      "Trip Count": { value: "8", unit: "" },
      "Last Maintenance": { value: "2026-01-15", unit: "" },
    },
  },
  {
    id: "BUS-1", name: "132kV Main Bus", type: "bus", status: "online",
    metrics: {
      "Voltage": { value: "132.4", unit: "kV" },
      "Frequency": { value: "50.01", unit: "Hz" },
      "Fault Level": { value: "31.5", unit: "kA" },
      "Protection": { value: "Active", unit: "" },
      "Earth Fault": { value: "Normal", unit: "" },
    },
  },
];

const alarmMessages = [
  { severity: "warning" as const, source: "GEN-04", message: "High bearing temperature detected" },
  { severity: "critical" as const, source: "BUS-2", message: "Overcurrent protection triggered" },
  { severity: "info" as const, source: "XFMR-1", message: "Tap changer operation completed" },
  { severity: "warning" as const, source: "GEN-01", message: "Vibration level above threshold" },
  { severity: "info" as const, source: "CB-05", message: "Circuit breaker reclosed successfully" },
  { severity: "critical" as const, source: "GEN-02", message: "Loss of excitation detected" },
  { severity: "warning" as const, source: "XFMR-2", message: "Oil temperature rising" },
];

function jitter(base: number, range: number): number {
  return base + (Math.random() - 0.5) * range;
}

export function useScadaData() {
  const [metrics, setMetrics] = useState<PowerMetrics>({
    totalGeneration: 135,
    totalLoad: 128,
    frequency: 50.0,
    voltage: 132,
    powerFactor: 0.95,
    efficiency: 94.8,
  });

  const [gens, setGens] = useState<GeneratorData[]>(generators);
  const [equipment, setEquipment] = useState<EquipmentData[]>(equipmentList);
  const [alarms, setAlarms] = useState<AlarmData[]>(() => {
    const now = new Date();
    return alarmMessages.slice(0, 4).map((a, i) => ({
      id: `ALM-${1000 + i}`,
      timestamp: new Date(now.getTime() - i * 120000),
      ...a,
      acknowledged: i > 1,
    }));
  });

  const [trendData, setTrendData] = useState<TrendPoint[]>(() => {
    const points: TrendPoint[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const t = new Date(now.getTime() - i * 60000);
      points.push({
        time: t.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        generation: jitter(135, 10),
        load: jitter(128, 8),
        frequency: jitter(50, 0.1),
      });
    }
    return points;
  });

  const acknowledgeAlarm = useCallback((id: string) => {
    setAlarms((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        totalGeneration: Math.round(jitter(prev.totalGeneration, 4) * 10) / 10,
        totalLoad: Math.round(jitter(prev.totalLoad, 3) * 10) / 10,
        frequency: Math.round(jitter(50, 0.08) * 100) / 100,
        voltage: Math.round(jitter(132, 2) * 10) / 10,
        powerFactor: Math.round(jitter(0.95, 0.02) * 1000) / 1000,
        efficiency: Math.round(jitter(94.8, 1) * 10) / 10,
      }));

      setGens((prev) =>
        prev.map((g) =>
          g.status === "running"
            ? {
                ...g,
                output: Math.round(jitter(g.output, 3) * 10) / 10,
                temperature: Math.round(jitter(g.temperature, 2) * 10) / 10,
                rpm: Math.round(jitter(3000, 5)),
              }
            : g
        )
      );

      // Jitter equipment metrics
      setEquipment((prev) =>
        prev.map((eq) => {
          const updated = { ...eq, metrics: { ...eq.metrics } };
          if (eq.type === "transformer") {
            updated.metrics["Oil Temp"] = { value: jitter(parseFloat(eq.metrics["Oil Temp"].value), 2).toFixed(1), unit: "°C" };
            updated.metrics["Load"] = { value: Math.round(jitter(parseFloat(eq.metrics["Load"].value), 3)).toString(), unit: "%" };
          }
          if (eq.type === "breaker") {
            updated.metrics["Current"] = { value: Math.round(jitter(parseFloat(eq.metrics["Current"].value), 50)).toString(), unit: "A" };
          }
          if (eq.type === "bus") {
            updated.metrics["Voltage"] = { value: jitter(132, 2).toFixed(1), unit: "kV" };
            updated.metrics["Frequency"] = { value: jitter(50, 0.08).toFixed(2), unit: "Hz" };
          }
          return updated;
        })
      );

      setTrendData((prev) => {
        const now = new Date();
        const newPoint: TrendPoint = {
          time: now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
          generation: jitter(135, 10),
          load: jitter(128, 8),
          frequency: jitter(50, 0.1),
        };
        return [...prev.slice(1), newPoint];
      });

      if (Math.random() < 0.1) {
        const template = alarmMessages[Math.floor(Math.random() * alarmMessages.length)];
        setAlarms((prev) => [
          {
            id: `ALM-${Date.now()}`,
            timestamp: new Date(),
            ...template,
            acknowledged: false,
          },
          ...prev.slice(0, 19),
        ]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return { metrics, generators: gens, equipment, alarms, trendData, acknowledgeAlarm };
}
