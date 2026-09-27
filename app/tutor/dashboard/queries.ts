import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { getActiveSubjects, getRecentNotifications } from "@/lib/queries/shared";

type Client = SupabaseClient<Database>;

/**
 * Data access for the tutor dashboard. Each function returns the row(s)
 * it fetched, or null/[] when nothing was found — callers decide how to
 * render the "not there yet" state.
 */

export async function getTutorApplication(client: Client, tutorId: string) {
  const { data } = await client
    .from("tutor_applications")
    .select(
      "id, status, review_notes, school_name, degree, major, graduation_year, academic_achievements, teaching_experience_summary, years_experience, teaching_approach, preferred_modes, tutor_application_subjects(subject_id)",
    )
    .eq("tutor_id", tutorId)
    .maybeSingle();
  return data;
}

export async function getTutorProfile(client: Client, profileId: string) {
  const { data } = await client
    .from("tutor_profiles")
    .select("id, headline, bio")
    .eq("profile_id", profileId)
    .single();
  return data;
}

export async function getUpcomingAppointments(client: Client, tutorProfileId: string) {
  const { data } = await client
    .from("appointments")
    .select(
      "id, status, appointment_slots(slot_date, start_time, end_time), profiles(first_name, last_name), subjects(name)",
    )
    .eq("tutor_profile_id", tutorProfileId)
    .in("status", ["scheduled", "confirmed"])
    .order("created_at", { ascending: false })
    .limit(8);
  return data ?? [];
}

export async function getAvailability(client: Client, tutorProfileId: string) {
  const { data } = await client
    .from("availability")
    .select("id, day_date, start_time, end_time, slot_duration_minutes, subject_id")
    .eq("tutor_profile_id", tutorProfileId)
    .order("day_date")
    .order("start_time");
  return data ?? [];
}

export { getActiveSubjects, getRecentNotifications };
