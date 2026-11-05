import type { DbClient } from "@/lib/supabase/types";

/**
 * Data access for the tutor dashboard. Each function returns the row(s)
 * it fetched, or null/[] when nothing was found — callers decide how to
 * render the "not there yet" state.
 */

export async function getTutorApplication(client: DbClient, tutorId: string) {
  const { data } = await client
    .from("tutor_applications")
    .select(
      "id, status, review_notes, school_name, degree, major, graduation_year, academic_achievements, teaching_experience_summary, years_experience, teaching_approach, preferred_modes, tutor_application_subjects(subject_id), tutor_credentials(id)",
    )
    .eq("tutor_id", tutorId)
    .maybeSingle();
  return data;
}

export async function getTutorProfile(client: DbClient, profileId: string) {
  const { data } = await client
    .from("tutor_profiles")
    .select("id, headline, bio, tutor_subjects(subject_id)")
    .eq("profile_id", profileId)
    .maybeSingle();
  return data;
}

export async function getAvailability(client: DbClient, tutorProfileId: string) {
  const { data } = await client
    .from("availability")
    .select("id, day_date, start_time, end_time, slot_duration_minutes, subject_id, session_mode, meeting_url, location")
    .eq("tutor_profile_id", tutorProfileId)
    .order("day_date")
    .order("start_time");
  return data ?? [];
}
