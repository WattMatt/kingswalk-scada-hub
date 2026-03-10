import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SensorHistoryRow {
  id: string;
  equipment_id: string;
  kw: number;
  voltage: number;
  current: number;
  power_factor: number;
  frequency: number;
  recorded_at: string;
}

/**
 * Fetch historical sensor readings for a single equipment.
 * @param equipmentId  UUID
 * @param minutes      How many minutes of history (default 30)
 */
export function useSensorHistory(equipmentId: string | undefined, minutes = 30) {
  return useQuery({
    queryKey: ["sensor_history", equipmentId, minutes],
    enabled: !!equipmentId,
    refetchInterval: 6000, // refresh every 6s
    queryFn: async () => {
      const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("sensor_readings")
        .select("*")
        .eq("equipment_id", equipmentId!)
        .gte("recorded_at", since)
        .order("recorded_at", { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as SensorHistoryRow[];
    },
  });
}
