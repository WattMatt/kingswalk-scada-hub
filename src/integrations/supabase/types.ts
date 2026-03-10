export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      alarm_thresholds: {
        Row: {
          created_at: string
          equipment_type: string
          id: string
          max_value: number | null
          metric: string
          min_value: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          equipment_type: string
          id?: string
          max_value?: number | null
          metric: string
          min_value?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          equipment_type?: string
          id?: string
          max_value?: number | null
          metric?: string
          min_value?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      equipment: {
        Row: {
          created_at: string
          id: string
          installation_date: string | null
          location: string | null
          manufacturer: string | null
          marker_left: number | null
          marker_top: number | null
          model: string | null
          name: string
          notes: string | null
          protection_settings: string | null
          rating: number | null
          rating_unit: string | null
          serial_number: string | null
          sld_x: number | null
          sld_y: number | null
          status: Database["public"]["Enums"]["equipment_status"]
          tag_number: string
          type: Database["public"]["Enums"]["equipment_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          installation_date?: string | null
          location?: string | null
          manufacturer?: string | null
          marker_left?: number | null
          marker_top?: number | null
          model?: string | null
          name: string
          notes?: string | null
          protection_settings?: string | null
          rating?: number | null
          rating_unit?: string | null
          serial_number?: string | null
          sld_x?: number | null
          sld_y?: number | null
          status?: Database["public"]["Enums"]["equipment_status"]
          tag_number: string
          type: Database["public"]["Enums"]["equipment_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          installation_date?: string | null
          location?: string | null
          manufacturer?: string | null
          marker_left?: number | null
          marker_top?: number | null
          model?: string | null
          name?: string
          notes?: string | null
          protection_settings?: string | null
          rating?: number | null
          rating_unit?: string | null
          serial_number?: string | null
          sld_x?: number | null
          sld_y?: number | null
          status?: Database["public"]["Enums"]["equipment_status"]
          tag_number?: string
          type?: Database["public"]["Enums"]["equipment_type"]
          updated_at?: string
        }
        Relationships: []
      }
      equipment_connections: {
        Row: {
          connection_type: string | null
          created_at: string
          from_equipment_id: string
          id: string
          label: string | null
          to_equipment_id: string
        }
        Insert: {
          connection_type?: string | null
          created_at?: string
          from_equipment_id: string
          id?: string
          label?: string | null
          to_equipment_id: string
        }
        Update: {
          connection_type?: string | null
          created_at?: string
          from_equipment_id?: string
          id?: string
          label?: string | null
          to_equipment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_connections_from_equipment_id_fkey"
            columns: ["from_equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_connections_to_equipment_id_fkey"
            columns: ["to_equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_documents: {
        Row: {
          category: Database["public"]["Enums"]["document_category"]
          created_at: string
          description: string | null
          equipment_id: string
          expiry_date: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          title: string
          updated_at: string
          uploaded_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["document_category"]
          created_at?: string
          description?: string | null
          equipment_id: string
          expiry_date?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          title: string
          updated_at?: string
          uploaded_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["document_category"]
          created_at?: string
          description?: string | null
          equipment_id?: string
          expiry_date?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          title?: string
          updated_at?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_documents_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      sensor_readings: {
        Row: {
          current: number
          equipment_id: string
          frequency: number
          id: string
          kw: number
          power_factor: number
          recorded_at: string
          voltage: number
        }
        Insert: {
          current?: number
          equipment_id: string
          frequency?: number
          id?: string
          kw?: number
          power_factor?: number
          recorded_at?: string
          voltage?: number
        }
        Update: {
          current?: number
          equipment_id?: string
          frequency?: number
          id?: string
          kw?: number
          power_factor?: number
          recorded_at?: string
          voltage?: number
        }
        Relationships: [
          {
            foreignKeyName: "sensor_readings_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      document_category:
        | "coc"
        | "lease_agreement"
        | "contact_details"
        | "utility_account"
        | "compliance_register"
        | "lighting_schedule"
        | "maintenance_report"
        | "specification"
        | "other"
      equipment_status:
        | "online"
        | "offline"
        | "standby"
        | "warning"
        | "fault"
        | "maintenance"
      equipment_type:
        | "generator"
        | "transformer"
        | "inverter"
        | "switchgear"
        | "breaker"
        | "bus"
        | "panel"
        | "meter"
        | "vfd"
        | "motor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      document_category: [
        "coc",
        "lease_agreement",
        "contact_details",
        "utility_account",
        "compliance_register",
        "lighting_schedule",
        "maintenance_report",
        "specification",
        "other",
      ],
      equipment_status: [
        "online",
        "offline",
        "standby",
        "warning",
        "fault",
        "maintenance",
      ],
      equipment_type: [
        "generator",
        "transformer",
        "inverter",
        "switchgear",
        "breaker",
        "bus",
        "panel",
        "meter",
        "vfd",
        "motor",
      ],
    },
  },
} as const
