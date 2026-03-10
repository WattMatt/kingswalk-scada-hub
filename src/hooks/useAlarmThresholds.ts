import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SensorReading } from "./useSimulatedSensors";

export interface AlarmThreshold {
  id: string;
  equipment_type: string;
  metric: string;
  min_value: number | null;
  max_value: number | null;
}

export function useAlarmThresholds() {
  return useQuery({
    queryKey: ["alarm_thresholds"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alarm_thresholds" as any)
        .select("*")
        .order("equipment_type")
        .order("metric");
      if (error) throw error;
      return (data as unknown as AlarmThreshold[]) ?? [];
    },
  });
}

export function useUpdateThreshold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; min_value: number | null; max_value: number | null }) => {
      const { error } = await supabase
        .from("alarm_thresholds" as any)
        .update({ min_value: args.min_value, max_value: args.max_value } as any)
        .eq("id", args.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alarm_thresholds"] }),
  });
}

/** Build a lookup map: "type:metric" → { min, max } */
export function buildThresholdMap(thresholds: AlarmThreshold[]): Map<string, { min: number | null; max: number | null }> {
  const map = new Map<string, { min: number | null; max: number | null }>();
  for (const t of thresholds) {
    map.set(`${t.equipment_type}:${t.metric}`, { min: t.min_value, max: t.max_value });
  }
  return map;
}

/** Check if a reading breaches any threshold for a given equipment type */
export function checkAlarmBreach(
  equipmentType: string,
  reading: SensorReading,
  thresholdMap: Map<string, { min: number | null; max: number | null }>
): { breached: boolean; metrics: string[] } {
  const breachedMetrics: string[] = [];

  const voltageThreshold = thresholdMap.get(`${equipmentType}:voltage`);
  if (voltageThreshold) {
    if ((voltageThreshold.min != null && reading.voltage < voltageThreshold.min) ||
        (voltageThreshold.max != null && reading.voltage > voltageThreshold.max)) {
      breachedMetrics.push("voltage");
    }
  }

  const currentThreshold = thresholdMap.get(`${equipmentType}:current`);
  if (currentThreshold) {
    if ((currentThreshold.min != null && reading.current < currentThreshold.min) ||
        (currentThreshold.max != null && reading.current > currentThreshold.max)) {
      breachedMetrics.push("current");
    }
  }

  return { breached: breachedMetrics.length > 0, metrics: breachedMetrics };
}
