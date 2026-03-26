/**
 * Subset of Supabase generated types (public schema).
 *
 * Note: keep this aligned with `supabase/migrations/**.sql`. We model the tables
 * used by the mobile app today screen (personal lane) plus their enums.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type PublicTables = {
  personal_medication: {
    Row: {
      id: string;
      patient_id: string;
      personal_profile_id: string;
      catalog_id: string | null;
      custom_name: string | null;
      display_name: string;
      strength_text: string | null;
      dosage_form: string | null;
      dose_amount: number;
      dose_unit: string;
      frequency_code: Database["public"]["Enums"]["frequency_code_enum"];
      dose_schedule_json: Json;
      start_date: string;
      end_date: string | null;
      notes: string | null;
      status: Database["public"]["Enums"]["personal_med_status_enum"];
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      patient_id: string;
      personal_profile_id: string;
      catalog_id?: string | null;
      custom_name?: string | null;
      display_name: string;
      strength_text?: string | null;
      dosage_form?: string | null;
      dose_amount: number;
      dose_unit: string;
      frequency_code: Database["public"]["Enums"]["frequency_code_enum"];
      dose_schedule_json: Json;
      start_date: string;
      end_date?: string | null;
      notes?: string | null;
      status?: Database["public"]["Enums"]["personal_med_status_enum"];
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      patient_id?: string;
      personal_profile_id?: string;
      catalog_id?: string | null;
      custom_name?: string | null;
      display_name?: string;
      strength_text?: string | null;
      dosage_form?: string | null;
      dose_amount?: number;
      dose_unit?: string;
      frequency_code?: Database["public"]["Enums"]["frequency_code_enum"];
      dose_schedule_json?: Json;
      start_date?: string;
      end_date?: string | null;
      notes?: string | null;
      status?: Database["public"]["Enums"]["personal_med_status_enum"];
      created_at?: string;
      updated_at?: string;
    };
    Relationships: [
      {
        foreignKeyName: "personal_medication_patient_id_fkey";
        columns: ["patient_id"];
        isOneToOne: false;
        referencedRelation: "patient";
        referencedColumns: ["id"];
      },
      {
        foreignKeyName: "personal_medication_personal_profile_id_fkey";
        columns: ["personal_profile_id"];
        isOneToOne: false;
        referencedRelation: "personal_profile";
        referencedColumns: ["id"];
      },
      {
        foreignKeyName: "personal_medication_catalog_id_fkey";
        columns: ["catalog_id"];
        isOneToOne: false;
        referencedRelation: "medication_catalog";
        referencedColumns: ["id"];
      },
    ];
  };
  personal_adherence_log: {
    Row: {
      id: string;
      patient_id: string;
      personal_medication_id: string;
      scheduled_date: string;
      scheduled_time: string;
      actual_taken_time: string | null;
      status: Database["public"]["Enums"]["personal_dose_status_enum"];
      source: string;
      notes: string | null;
      created_at: string;
    };
    Insert: {
      id?: string;
      patient_id: string;
      personal_medication_id: string;
      scheduled_date: string;
      scheduled_time: string;
      actual_taken_time?: string | null;
      status?: Database["public"]["Enums"]["personal_dose_status_enum"];
      source?: string;
      notes?: string | null;
      created_at?: string;
    };
    Update: {
      id?: string;
      patient_id?: string;
      personal_medication_id?: string;
      scheduled_date?: string;
      scheduled_time?: string;
      actual_taken_time?: string | null;
      status?: Database["public"]["Enums"]["personal_dose_status_enum"];
      source?: string;
      notes?: string | null;
      created_at?: string;
    };
    Relationships: [
      {
        foreignKeyName: "personal_adherence_log_patient_id_fkey";
        columns: ["patient_id"];
        isOneToOne: false;
        referencedRelation: "patient";
        referencedColumns: ["id"];
      },
      {
        foreignKeyName: "personal_adherence_log_personal_medication_id_fkey";
        columns: ["personal_medication_id"];
        isOneToOne: false;
        referencedRelation: "personal_medication";
        referencedColumns: ["id"];
      },
    ];
  };
};

type PublicEnums = {
  personal_med_status_enum: "active" | "paused" | "stopped";
  personal_dose_status_enum: "scheduled" | "taken" | "missed" | "skipped";
  frequency_code_enum: "QD" | "BID" | "TID" | "QID" | "Q8H" | "Q12H" | "QHS" | "QOD" | "QW" | "PRN";
};

export type Database = {
  public: {
    Tables: PublicTables;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: PublicEnums;
    CompositeTypes: Record<string, never>;
  };
};
