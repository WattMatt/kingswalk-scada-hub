import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type EquipmentDocument = Tables<"equipment_documents">;
export type EquipmentDocumentInsert = TablesInsert<"equipment_documents">;

const DOCS_KEY = (equipmentId: string) => ["equipment_documents", equipmentId] as const;

export function useEquipmentDocuments(equipmentId: string) {
  return useQuery({
    queryKey: DOCS_KEY(equipmentId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipment_documents")
        .select("*")
        .eq("equipment_id", equipmentId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!equipmentId,
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      equipmentId,
      file,
      title,
      category,
      description,
      expiryDate,
    }: {
      equipmentId: string;
      file: File;
      title: string;
      category: string;
      description?: string;
      expiryDate?: string;
    }) => {
      // Upload file to storage
      const filePath = `${equipmentId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("equipment-documents")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      // Create document record
      const { data, error } = await supabase
        .from("equipment_documents")
        .insert({
          equipment_id: equipmentId,
          title,
          category: category as any,
          description: description || null,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type || null,
          expiry_date: expiryDate || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: DOCS_KEY(data.equipment_id) });
    },
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doc: EquipmentDocument) => {
      // Delete from storage
      await supabase.storage.from("equipment-documents").remove([doc.file_path]);
      // Delete record
      const { error } = await supabase.from("equipment_documents").delete().eq("id", doc.id);
      if (error) throw error;
      return doc.equipment_id;
    },
    onSuccess: (equipmentId) => {
      qc.invalidateQueries({ queryKey: DOCS_KEY(equipmentId) });
    },
  });
}

export function getDocumentUrl(filePath: string) {
  const { data } = supabase.storage.from("equipment-documents").getPublicUrl(filePath);
  return data.publicUrl;
}
