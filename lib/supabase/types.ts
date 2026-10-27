import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/** The typed Supabase client, shared by every query helper. */
export type DbClient = SupabaseClient<Database>;
