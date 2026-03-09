import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Equipment = Tables<"equipment">;
export type EquipmentInsert = TablesInsert<"equipment">;
export type EquipmentUpdate = TablesUpdate<"equipment">;
export type EquipmentConnection = Tables<"equipment_connections">;

const EQUIPMENT_KEY = ["equipment"] as const;
const CONNECTIONS_KEY = ["equipment_connections"] as const;

export function useEquipment() {
  return useQuery({
    queryKey: EQUIPMENT_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipment")
        .select("*")
        .order("tag_number");
      if (error) throw error;
      return data;
    },
  });
}

export function useEquipmentConnections() {
  return useQuery({
    queryKey: CONNECTIONS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipment_connections")
        .select("*");
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: EquipmentInsert) => {
      const { data, error } = await supabase
        .from("equipment")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: EQUIPMENT_KEY }),
  });
}

export function useUpdateEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: EquipmentUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("equipment")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: EQUIPMENT_KEY }),
  });
}

export function useDeleteEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("equipment").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EQUIPMENT_KEY });
      qc.invalidateQueries({ queryKey: CONNECTIONS_KEY });
    },
  });
}

export function useCreateConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { from_equipment_id: string; to_equipment_id: string; connection_type?: string; label?: string }) => {
      const { data, error } = await supabase
        .from("equipment_connections")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CONNECTIONS_KEY }),
  });
}

export function useDeleteConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("equipment_connections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CONNECTIONS_KEY }),
  });
}
