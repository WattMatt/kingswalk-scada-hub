import { useState, useEffect, useCallback } from "react";

// Simulated SCADA data generator
export interface PowerMetrics {
  totalGeneration: number; // MW
  totalLoad: number; // MW
  frequency: number; // Hz
  voltage: number; // kV
  powerFactor: number;
  efficiency: number; // %
}

export interface GeneratorData {
  id: string;
  name: string;
  status: "running" | "standby" | "fault" | "maintenance";
  output: number; // MW
  maxOutput: number; // MW
  rpm: number;
  temperature: number; // °C
  voltage: number; // kV
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

      // Randomly add alarms
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

  return { metrics, generators: gens, alarms, trendData, acknowledgeAlarm };
}
