// Hand-written to match supabase/migrations/*.sql.
// Once you have a real Supabase project linked, regenerate this file with
// `npm run db:types` and it will match exactly — treat this version as a
// best-effort starting point for Phase 3, not a permanent source of truth.
//
// NOTE: `Relationships` is required by @supabase/postgrest-js's
// `GenericTable` constraint even for tables you never embed-select from —
// omitting it silently degrades every query on that table (including
// plain scalar `.select()` calls) to `never`. Every FK is declared once,
// on the table that owns the foreign key column; embeds work in both
// directions from that single declaration, same as CLI-generated types.

export type AppRole = "student" | "tutor" | "admin";

export type ApplicationStatus =
  | "draft"
  | "pending"
  | "under_review"
  | "needs_revision"
  | "approved"
  | "rejected";

export type CredentialType =
  | "valid_id"
  | "diploma"
  | "certificate"
  | "teaching_credential"
  | "other";

export type TeachingMode = "online" | "in_person" | "hybrid";

export type SlotStatus = "open" | "booked" | "cancelled";

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: AppRole;
          first_name: string;
          middle_name: string | null;
          last_name: string;
          email: string;
          phone: string | null;
          address: string | null;
          date_of_birth: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      subjects: {
        Row: {
          id: string;
          name: string;
          slug: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["subjects"]["Row"]> & {
          name: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["subjects"]["Row"]>;
        Relationships: [];
      };
      tutor_applications: {
        Row: {
          id: string;
          tutor_id: string;
          status: ApplicationStatus;
          school_name: string | null;
          degree: string | null;
          major: string | null;
          graduation_year: number | null;
          academic_achievements: string | null;
          teaching_experience_summary: string | null;
          years_experience: number | null;
          teaching_approach: string | null;
          preferred_modes: TeachingMode[];
          submitted_at: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          review_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["tutor_applications"]["Row"]
        > & { tutor_id: string };
        Update: Partial<
          Database["public"]["Tables"]["tutor_applications"]["Row"]
        >;
        Relationships: [
          {
            foreignKeyName: "tutor_applications_tutor_id_fkey";
            columns: ["tutor_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tutor_applications_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tutor_application_subjects: {
        Row: { application_id: string; subject_id: string };
        Insert: { application_id: string; subject_id: string };
        Update: Partial<{ application_id: string; subject_id: string }>;
        Relationships: [
          {
            foreignKeyName: "tutor_application_subjects_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "tutor_applications";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tutor_application_subjects_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      tutor_credentials: {
        Row: {
          id: string;
          application_id: string;
          credential_type: CredentialType;
          storage_path: string;
          file_name: string;
          mime_type: string | null;
          file_size: number | null;
          uploaded_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["tutor_credentials"]["Row"]
        > & {
          application_id: string;
          credential_type: CredentialType;
          storage_path: string;
          file_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["tutor_credentials"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "tutor_credentials_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "tutor_applications";
            referencedColumns: ["id"];
          },
        ];
      };
      tutor_profiles: {
        Row: {
          id: string;
          profile_id: string;
          application_id: string | null;
          headline: string | null;
          bio: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["tutor_profiles"]["Row"]> & {
          profile_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["tutor_profiles"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "tutor_profiles_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tutor_profiles_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "tutor_applications";
            referencedColumns: ["id"];
          },
        ];
      };
      tutor_subjects: {
        Row: { tutor_profile_id: string; subject_id: string };
        Insert: { tutor_profile_id: string; subject_id: string };
        Update: Partial<{ tutor_profile_id: string; subject_id: string }>;
        Relationships: [
          {
            foreignKeyName: "tutor_subjects_tutor_profile_id_fkey";
            columns: ["tutor_profile_id"];
            isOneToOne: false;
            referencedRelation: "tutor_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tutor_subjects_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      availability: {
        Row: {
          id: string;
          tutor_profile_id: string;
          subject_id: string | null;
          day_date: string;
          start_time: string;
          end_time: string;
          slot_duration_minutes: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["availability"]["Row"]> & {
          tutor_profile_id: string;
          day_date: string;
          start_time: string;
          end_time: string;
        };
        Update: Partial<Database["public"]["Tables"]["availability"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "availability_tutor_profile_id_fkey";
            columns: ["tutor_profile_id"];
            isOneToOne: false;
            referencedRelation: "tutor_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "availability_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      appointment_slots: {
        Row: {
          id: string;
          availability_id: string;
          tutor_profile_id: string;
          subject_id: string | null;
          slot_date: string;
          start_time: string;
          end_time: string;
          status: SlotStatus;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["appointment_slots"]["Row"]
        > & {
          availability_id: string;
          tutor_profile_id: string;
          slot_date: string;
          start_time: string;
          end_time: string;
        };
        Update: Partial<Database["public"]["Tables"]["appointment_slots"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "appointment_slots_availability_id_fkey";
            columns: ["availability_id"];
            isOneToOne: false;
            referencedRelation: "availability";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointment_slots_tutor_profile_id_fkey";
            columns: ["tutor_profile_id"];
            isOneToOne: false;
            referencedRelation: "tutor_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointment_slots_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      appointments: {
        Row: {
          id: string;
          slot_id: string;
          student_id: string;
          tutor_profile_id: string;
          subject_id: string | null;
          status: AppointmentStatus;
          notes: string | null;
          cancelled_by: string | null;
          cancellation_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: never; // always created via the book_appointment_slot() RPC
        Update: Partial<Database["public"]["Tables"]["appointments"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "appointments_slot_id_fkey";
            columns: ["slot_id"];
            isOneToOne: false;
            referencedRelation: "appointment_slots";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_tutor_profile_id_fkey";
            columns: ["tutor_profile_id"];
            isOneToOne: false;
            referencedRelation: "tutor_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      appointment_status_history: {
        Row: {
          id: string;
          appointment_id: string;
          from_status: AppointmentStatus | null;
          to_status: AppointmentStatus;
          changed_by: string | null;
          changed_at: string;
          note: string | null;
        };
        Insert: never; // system-written only
        Update: never;
        Relationships: [
          {
            foreignKeyName: "appointment_status_history_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          profile_id: string;
          type: string;
          title: string;
          body: string | null;
          is_read: boolean;
          related_entity_type: string | null;
          related_entity_id: string | null;
          created_at: string;
        };
        Insert: never; // system-written only
        Update: { is_read?: boolean };
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          target_type: string | null;
          target_id: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      book_appointment_slot: {
        Args: { p_slot_id: string; p_notes?: string | null };
        Returns: string; // new appointment id
      };
      cancel_appointment: {
        Args: { p_appointment_id: string; p_reason?: string | null };
        Returns: void;
      };
    };
    Enums: {
      app_role: AppRole;
      application_status: ApplicationStatus;
      credential_type: CredentialType;
      teaching_mode: TeachingMode;
      slot_status: SlotStatus;
      appointment_status: AppointmentStatus;
    };
  };
}
