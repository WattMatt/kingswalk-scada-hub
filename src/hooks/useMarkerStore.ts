import { useCallback } from "react";
import { useEquipment, useUpdateEquipment, type Equipment } from "./useEquipment";

export interface MarkerConfig {
  id: string;
  label: string;
  type: "generator" | "transformer" | "inverter" | "switchgear" | "breaker" | "bus" | "panel" | "meter" | "vfd" | "motor" | "custom";
  left: number;
  top: number;
  equipmentId: string;
}

/** Convert an equipment row (with marker coords) into a MarkerConfig */
function toMarker(e: Equipment): MarkerConfig | null {
  if (e.marker_left == null || e.marker_top == null) return null;
  return {
    id: e.id,
    label: e.tag_number,
    type: e.type as MarkerConfig["type"],
    left: Number(e.marker_left),
    top: Number(e.marker_top),
    equipmentId: e.id,
  };
}

export function useMarkerStore() {
  const { data: equipment = [], isLoading } = useEquipment();
  const updateMutation = useUpdateEquipment();

  const markers: MarkerConfig[] = equipment
    .map(toMarker)
    .filter((m): m is MarkerConfig => m !== null);

  const updateMarkerPosition = useCallback(
    (id: string, left: number, top: number) => {
      updateMutation.mutate({ id, marker_left: left, marker_top: top });
    },
    [updateMutation]
  );

  return {
    markers,
    isLoading,
    updateMarkerPosition,
  };
}
