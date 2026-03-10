import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
export interface SensorReading {
  kw: number;
  voltage: number;
  current: number;
  powerFactor: number;
  frequency: number;
}

const MAX_HISTORY = 15; // 15 ticks × 2s = 30s

/** Base profiles per equipment type — realistic ranges */
const typeProfiles: Record<string, { kw: [number, number]; v: [number, number]; pf: [number, number] }> = {
  generator:   { kw: [120, 500],  v: [380, 420],  pf: [0.85, 0.98] },
  transformer: { kw: [200, 800],  v: [380, 11500], pf: [0.92, 0.99] },
  inverter:    { kw: [10, 250],   v: [220, 400],  pf: [0.95, 1.0]  },
  switchgear:  { kw: [50, 600],   v: [380, 420],  pf: [0.88, 0.96] },
  breaker:     { kw: [50, 400],   v: [380, 420],  pf: [0.88, 0.96] },
  bus:         { kw: [100, 1000], v: [380, 420],  pf: [0.90, 0.98] },
  panel:       { kw: [5, 100],    v: [220, 240],  pf: [0.85, 0.95] },
  meter:       { kw: [0, 50],     v: [220, 240],  pf: [0.90, 1.0]  },
  vfd:         { kw: [10, 200],   v: [380, 420],  pf: [0.92, 0.99] },
  motor:       { kw: [15, 300],   v: [380, 420],  pf: [0.80, 0.92] },
};

function hashSeed(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function jitter(base: number, pct: number): number {
  return base * (1 + (Math.random() - 0.5) * 2 * pct);
}

interface EquipmentInfo {
  id: string;
  type: string;
  status: string;
  rating: number | null;
}

/**
 * Simulates real-time sensor readings with kW history for sparklines.
 * Updates every `intervalMs` (default 2s).
 */
export function useSimulatedSensors(equipmentList: EquipmentInfo[], intervalMs = 2000) {
  const [readings, setReadings] = useState<Map<string, SensorReading>>(new Map());
  const [kwHistory, setKwHistory] = useState<Map<string, number[]>>(new Map());
  const basesRef = useRef<Map<string, SensorReading>>(new Map());
  const historyRef = useRef<Map<string, number[]>>(new Map());

  // Build stable base values once per equipment set
  useEffect(() => {
    const bases = new Map<string, SensorReading>();
    equipmentList.forEach((eq) => {
      if (basesRef.current.has(eq.id)) {
        bases.set(eq.id, basesRef.current.get(eq.id)!);
        return;
      }
      const profile = typeProfiles[eq.type] || typeProfiles.panel;
      const seed = hashSeed(eq.id);
      const t = (seed % 1000) / 1000;

      const baseKw = eq.rating
        ? eq.rating * lerp(0.6, 0.95, t)
        : lerp(profile.kw[0], profile.kw[1], t);
      const baseV = lerp(profile.v[0], profile.v[1], (seed % 500) / 500);
      const basePf = lerp(profile.pf[0], profile.pf[1], (seed % 300) / 300);
      const baseCurrent = (baseKw * 1000) / (baseV * Math.sqrt(3) * basePf);

      bases.set(eq.id, {
        kw: Math.round(baseKw * 10) / 10,
        voltage: Math.round(baseV * 10) / 10,
        current: Math.round(baseCurrent * 10) / 10,
        powerFactor: Math.round(basePf * 100) / 100,
        frequency: 50,
      });
    });
    basesRef.current = bases;
  }, [equipmentList]);

  // Tick: apply jitter and accumulate history
  useEffect(() => {
    function tick() {
      const newReadings = new Map<string, SensorReading>();
      const newHistory = new Map<string, number[]>(historyRef.current);

      equipmentList.forEach((eq) => {
        const base = basesRef.current.get(eq.id);
        if (!base) return;

        if (eq.status === "offline" || eq.status === "maintenance") {
          const r: SensorReading = { kw: 0, voltage: 0, current: 0, powerFactor: 0, frequency: 0 };
          newReadings.set(eq.id, r);
          const prev = newHistory.get(eq.id) || [];
          newHistory.set(eq.id, [...prev, 0].slice(-MAX_HISTORY));
          return;
        }

        const scale = eq.status === "standby" ? 0.05 : 1;
        const fluctuation = eq.status === "fault" || eq.status === "warning" ? 0.12 : 0.03;

        const kwVal = Math.round(jitter(base.kw * scale, fluctuation) * 10) / 10;
        newReadings.set(eq.id, {
          kw: kwVal,
          voltage: Math.round(jitter(base.voltage * (eq.status === "standby" ? 0.95 : 1), fluctuation * 0.3) * 10) / 10,
          current: Math.round(jitter(base.current * scale, fluctuation) * 10) / 10,
          powerFactor: Math.round(Math.min(1, jitter(base.powerFactor, fluctuation * 0.2)) * 100) / 100,
          frequency: Math.round(jitter(base.frequency, 0.002) * 100) / 100,
        });

        const prev = newHistory.get(eq.id) || [];
        newHistory.set(eq.id, [...prev, kwVal].slice(-MAX_HISTORY));
      });

      historyRef.current = newHistory;
      setReadings(newReadings);
      setKwHistory(new Map(newHistory));

      // Persist to DB (fire-and-forget, every other tick to reduce writes)
      tickCountRef.current += 1;
      if (tickCountRef.current % 3 === 0) {
        const rows: Array<{
          equipment_id: string;
          kw: number;
          voltage: number;
          current: number;
          power_factor: number;
          frequency: number;
        }> = [];
        newReadings.forEach((r, eqId) => {
          rows.push({
            equipment_id: eqId,
            kw: r.kw,
            voltage: r.voltage,
            current: r.current,
            power_factor: r.powerFactor,
            frequency: r.frequency,
          });
        });
        if (rows.length > 0) {
          supabase.from("sensor_readings").insert(rows).then(({ error }) => {
            if (error) console.warn("Sensor persist error:", error.message);
          });
        }
      }
    }

    tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [equipmentList, intervalMs]);

  return { readings, kwHistory };
}
