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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      analysis_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          document_count: number | null
          high_risk_count: number | null
          id: string
          low_risk_count: number | null
          medium_risk_count: number | null
          session_name: string | null
          started_at: string
          total_pii_detected: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          document_count?: number | null
          high_risk_count?: number | null
          id?: string
          low_risk_count?: number | null
          medium_risk_count?: number | null
          session_name?: string | null
          started_at?: string
          total_pii_detected?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          document_count?: number | null
          high_risk_count?: number | null
          id?: string
          low_risk_count?: number | null
          medium_risk_count?: number | null
          session_name?: string | null
          started_at?: string
          total_pii_detected?: number | null
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          confidence_score: number | null
          created_at: string
          encryption_key_id: string | null
          encryption_metadata: Json | null
          file_size: number
          file_type: string
          filename: string
          id: string
          is_encrypted: boolean | null
          original_filename: string
          pages_processed: number | null
          processing_completed_at: string | null
          processing_started_at: string | null
          risk_score: number | null
          status: Database["public"]["Enums"]["processing_status"]
          storage_path: string
          total_pages: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          encryption_key_id?: string | null
          encryption_metadata?: Json | null
          file_size: number
          file_type: string
          filename: string
          id?: string
          is_encrypted?: boolean | null
          original_filename: string
          pages_processed?: number | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          risk_score?: number | null
          status?: Database["public"]["Enums"]["processing_status"]
          storage_path: string
          total_pages?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          encryption_key_id?: string | null
          encryption_metadata?: Json | null
          file_size?: number
          file_type?: string
          filename?: string
          id?: string
          is_encrypted?: boolean | null
          original_filename?: string
          pages_processed?: number | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          risk_score?: number | null
          status?: Database["public"]["Enums"]["processing_status"]
          storage_path?: string
          total_pages?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      encryption_keys: {
        Row: {
          algorithm: string
          created_at: string
          document_id: string
          downloaded_at: string | null
          id: string
          key_fingerprint: string
          user_id: string
        }
        Insert: {
          algorithm?: string
          created_at?: string
          document_id: string
          downloaded_at?: string | null
          id?: string
          key_fingerprint: string
          user_id: string
        }
        Update: {
          algorithm?: string
          created_at?: string
          document_id?: string
          downloaded_at?: string | null
          id?: string
          key_fingerprint?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_encryption_keys_document"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      pii_detections: {
        Row: {
          confidence_score: number
          coordinates: Json | null
          created_at: string
          detected_text: string
          document_id: string
          id: string
          is_verified: boolean | null
          page_number: number
          pii_type: Database["public"]["Enums"]["pii_type"]
          redacted_text: string | null
        }
        Insert: {
          confidence_score: number
          coordinates?: Json | null
          created_at?: string
          detected_text: string
          document_id: string
          id?: string
          is_verified?: boolean | null
          page_number?: number
          pii_type: Database["public"]["Enums"]["pii_type"]
          redacted_text?: string | null
        }
        Update: {
          confidence_score?: number
          coordinates?: Json | null
          created_at?: string
          detected_text?: string
          document_id?: string
          id?: string
          is_verified?: boolean | null
          page_number?: number
          pii_type?: Database["public"]["Enums"]["pii_type"]
          redacted_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pii_detections_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      processed_files: {
        Row: {
          created_at: string
          document_id: string
          encrypted_storage_path: string
          id: string
          original_storage_path: string
          processing_metadata: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          encrypted_storage_path: string
          id?: string
          original_storage_path: string
          processing_metadata?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          encrypted_storage_path?: string
          id?: string
          original_storage_path?: string
          processing_metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_processed_files_document"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          government_agency: string | null
          id: string
          organization: string | null
          security_clearance: string | null
          updated_at: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          government_agency?: string | null
          id?: string
          organization?: string | null
          security_clearance?: string | null
          updated_at?: string
          user_id: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          created_at?: string
          display_name?: string | null
          government_agency?: string | null
          id?: string
          organization?: string | null
          security_clearance?: string | null
          updated_at?: string
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      log_audit_event: {
        Args: {
          p_action: string
          p_details?: Json
          p_resource_id?: string
          p_resource_type: string
        }
        Returns: string
      }
    }
    Enums: {
      pii_type:
        | "ssn"
        | "credit_card"
        | "phone"
        | "email"
        | "address"
        | "name"
        | "date_of_birth"
        | "medical_id"
        | "passport"
        | "license"
        | "bank_account"
      processing_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "quarantined"
      user_type: "government" | "public" | "admin"
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
      pii_type: [
        "ssn",
        "credit_card",
        "phone",
        "email",
        "address",
        "name",
        "date_of_birth",
        "medical_id",
        "passport",
        "license",
        "bank_account",
      ],
      processing_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "quarantined",
      ],
      user_type: ["government", "public", "admin"],
    },
  },
} as const
